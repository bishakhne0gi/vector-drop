import { z } from "zod";
import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import {
  cacheGet,
  cacheSet,
  cacheKeys,
  TTL,
  convertRatelimit,
  enforceRateLimit,
} from "@/lib/cache/redis";
import { computeImageHash } from "@/lib/conversion/hash";
import { quantizeColors } from "@/lib/conversion/quantize";
import { traceColorMask } from "@/lib/conversion/maskTrace";
import { assembleSvg } from "@/lib/conversion/assembleSvg";
import {
  AppError,
  ConversionCacheValue,
  ConvertProjectResponse,
  JobStatus,
  ConversionStep,
} from "@/lib/types";

const ROUTE = "POST /api/projects/[id]/convert";
const DEFAULT_COLOR_COUNT = 32;

const convertSchema = z.object({
  colorCount: z.number().int().min(2).max(64).default(DEFAULT_COLOR_COUNT),
});

// ─── Pipeline helpers ────────────────────────────────────────────────────────

async function downloadImage(storagePath: string): Promise<Buffer> {
  // Service client needed — storage bucket is private
  const serviceSupabase = createServiceClient();
  const { data, error } = await serviceSupabase.storage
    .from("images")
    .download(storagePath);

  if (error || !data) {
    throw AppError.storage(
      `Failed to download source image: ${error?.message ?? "unknown"}`,
      { storagePath },
    );
  }

  return Buffer.from(await data.arrayBuffer());
}

async function runConversionPipeline(
  rawBuffer: Buffer,
  colorCount: number,
): Promise<string> {
  // 1. Quantize: resize, blur, extract color clusters
  const { clusters, width, height } = await quantizeColors(rawBuffer, colorCount);

  // 2. Trace each color mask — capped at 4 concurrent potrace calls
  const totalPixels = width * height;
  const layers: Array<{ pathD: string; color: [number, number, number] }> = [];

  for (let i = 0; i < clusters.length; i += 4) {
    const batch = clusters.slice(i, i + 4);
    const results = await Promise.all(
      batch.map((cluster) =>
        traceColorMask(width, height, cluster.indices, totalPixels),
      ),
    );
    for (let j = 0; j < batch.length; j++) {
      const pathD = results[j];
      if (pathD) layers.push({ pathD, color: batch[j].color });
    }
  }

  // 3. Assemble
  return assembleSvg(layers, width, height);
}

async function uploadSvg(
  projectId: string,
  svgContent: string,
): Promise<string> {
  const serviceSupabase = createServiceClient();
  const svgPath = `projects/${projectId}/output.svg`;
  const blob = new Blob([svgContent], { type: "image/svg+xml" });

  const { error } = await serviceSupabase.storage
    .from("images")
    .upload(svgPath, blob, { upsert: true, contentType: "image/svg+xml" });

  if (error) {
    throw AppError.storage(`Failed to upload SVG: ${error.message}`, { svgPath });
  }

  return svgPath;
}

// ─── Job status helper ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setJobStep(supabase: any, jobId: string, step: ConversionStep, status: JobStatus) {
  const patch: Record<string, unknown> = { step, status };
  if (status === "running") patch.started_at = new Date().toISOString();
  if (status === "done" || status === "failed")
    patch.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("conversion_jobs")
    .update(patch)
    .eq("id", jobId);

  if (error) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        route: ROUTE,
        userId: null,
        error: { code: "INTERNAL_ERROR", message: error.message, context: { jobId, step } },
      }),
    );
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id: projectId } = await params;

    // 1. Auth
    const { supabase, user } = await requireAuth();
    userId = user.id;

    // 2. Rate limit
    const { remaining } = await enforceRateLimit(convertRatelimit, user.id);

    // 3. Parse body (empty body → defaults)
    let raw: unknown = {};
    try {
      raw = await req.json();
    } catch {
      // empty body is fine
    }
    const parsed = convertSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid request body", { issues: parsed.error.issues });
    }
    const { colorCount } = parsed.data;

    // 4. Load project (RLS enforces ownership)
    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select()
      .eq("id", projectId)
      .single();

    if (projectErr || !project) throw AppError.notFound("Project");
    if (project.status === "converting")
      throw AppError.conflict("Conversion already in progress for this project");
    if (!project.source_image_path)
      throw AppError.validation("Project has no source image — upload first");

    // Use service client for all job + project writes (conversion_jobs has no RLS insert policy)
    const svc = createServiceClient();

    // 5. Create job record
    const { data: job, error: jobErr } = await svc
      .from("conversion_jobs")
      .insert({ project_id: projectId, step: "upload", status: "pending" })
      .select()
      .single();

    if (jobErr || !job)
      throw AppError.internal(`Failed to create job: ${jobErr?.message ?? "no data"}`);

    // 6. Mark project as converting
    await svc
      .from("projects")
      .update({ status: "converting", error_message: null })
      .eq("id", projectId);

    // ── Pipeline ──────────────────────────────────────────────────────────────

    // Step 1: download
    await setJobStep(svc, job.id, "upload", "running");
    const rawBuffer = await downloadImage(project.source_image_path);
    await setJobStep(svc, job.id, "upload", "done");

    // Step 2: cache-aside on raw buffer hash
    const imageHash = computeImageHash(rawBuffer);
    const cacheKey = cacheKeys.conversion(imageHash, colorCount);
    const cached = await cacheGet<ConversionCacheValue>(cacheKey);

    if (cached) {
      await svc
        .from("projects")
        .update({ status: "ready", svg_path: cached.svgStoragePath, source_image_hash: imageHash })
        .eq("id", projectId);
      await setJobStep(svc, job.id, "assemble", "done");

      const response: ConvertProjectResponse = {
        jobId: job.id,
        projectId,
        status: "done",
        cacheHit: true,
      };
      return Response.json(response, {
        headers: { "X-RateLimit-Remaining": String(remaining) },
      });
    }

    // Step 3: quantize + trace (full pipeline)
    await setJobStep(svc, job.id, "normalize", "running");
    await setJobStep(svc, job.id, "trace", "running");
    const svgContent = await runConversionPipeline(rawBuffer, colorCount);
    await setJobStep(svc, job.id, "trace", "done");

    // Step 5: upload SVG
    await setJobStep(svc, job.id, "assemble", "running");
    const svgPath = await uploadSvg(projectId, svgContent);
    await setJobStep(svc, job.id, "assemble", "done");

    // Step 6: generate a long-lived signed URL for the SVG (10 years)
    const { data: signedData } = await svc.storage
      .from("images")
      .createSignedUrl(svgPath, 60 * 60 * 24 * 365 * 10);
    const svgUrl = signedData?.signedUrl ?? null;

    // Step 7: write cache + update project
    await cacheSet<ConversionCacheValue>(
      cacheKey,
      { projectId, svgStoragePath: svgPath },
      TTL.CONVERSION,
    );
    await svc
      .from("projects")
      .update({ status: "ready", svg_path: svgPath, svg_url: svgUrl, source_image_hash: imageHash })
      .eq("id", projectId);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        projectId,
        jobId: job.id,
        colorCount,
        cacheHit: false,
      }),
    );

    const response: ConvertProjectResponse = {
      jobId: job.id,
      projectId,
      status: "done",
      cacheHit: false,
    };

    return Response.json(response, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
