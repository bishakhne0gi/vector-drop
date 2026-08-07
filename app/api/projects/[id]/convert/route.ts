import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient, requireAuth } from "@/lib/api/supabase";
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
import { createVersion } from "@/lib/versions/service";
import {
  spendUnits,
  isUnlocked,
  ensureSignupGrant,
  InsufficientCreditsError,
} from "@/lib/credits/service";
import { CONVERSION_UNITS } from "@/lib/credits/constants";
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

async function setJobStep(supabase: SupabaseClient, jobId: string, step: ConversionStep, status: JobStatus) {
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

/**
 * Charges for a conversion and grants a permanent free-export entitlement on
 * the original version.
 *
 * Called only AFTER the SVG exists, so a failed trace never costs a credit.
 * Idempotent per project (`unlocks` unique on user+kind+ref), so re-converting
 * the same project — including via a Redis cache hit — is free. That matters
 * for the tracing-presets feature: users must be able to re-run a conversion
 * with different settings without watching a meter.
 */
async function chargeConversion(
  userId: string,
  projectId: string,
  versionId: string,
): Promise<void> {
  await spendUnits({
    userId,
    kind: "conversion",
    refId: projectId,
    units: CONVERSION_UNITS,
    reason: "conversion",
  });

  // 0 units: records the entitlement without touching the balance, so the
  // original traced result is always free to export.
  await spendUnits({
    userId,
    kind: "version_export",
    refId: versionId,
    units: 0,
    reason: "version_export",
  });
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

    // Auth is required everywhere. The guest path was removed with the POC
    // cutover — app/(app)/layout.tsx already redirected anonymous users, so no
    // guest could ever reach this route.
    const authResult = await requireAuth();
    userId = authResult.userId;

    const { remaining } = await enforceRateLimit(convertRatelimit, userId);

    // Parse body (empty body → defaults)
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

    const svc = createServiceClient();

    const { data: project, error: projectErr } = await svc
      .from("projects")
      .select()
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (projectErr || !project) throw AppError.notFound("Project");
    if (project.status === "converting")
      throw AppError.conflict("Conversion already in progress for this project");
    if (!project.source_image_path)
      throw AppError.validation("Project has no source image — upload first");

    // Credit pre-check: reject BEFORE running the pipeline, so we never burn
    // CPU tracing an image the user cannot pay for. Not authoritative — the
    // real charge happens once the SVG exists.
    const conversionPaid = await isUnlocked(userId, "conversion", projectId);
    if (!conversionPaid) {
      // ensureSignupGrant rather than getBalance: a user whose Clerk webhook
      // never fired would otherwise be blocked from their first ever
      // conversion, which is the worst possible first impression.
      const balance = await ensureSignupGrant(userId);
      if (balance < CONVERSION_UNITS) {
        throw AppError.paymentRequired("Not enough credits to convert", {
          requiredUnits: CONVERSION_UNITS,
          balanceUnits: balance,
        });
      }
    }

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
      // Copy the cached SVG to a path owned by *this* project so its lifecycle
      // (deletion, etc.) is independent from the original project that produced
      // the cache entry. If the source is missing, fall through to a full
      // re-run and overwrite the stale cache entry.
      const destPath = `projects/${projectId}/output.svg`;
      // Remove any pre-existing file at the destination — copy() does not overwrite.
      await svc.storage.from("images").remove([destPath]);
      const { error: copyErr } = await svc.storage
        .from("images")
        .copy(cached.svgStoragePath, destPath);

      if (!copyErr) {
        await svc
          .from("projects")
          .update({ status: "ready", svg_path: destPath, source_image_hash: imageHash })
          .eq("id", projectId);
        await setJobStep(svc, job.id, "assemble", "done");

        // Record version 1 and charge. On a cache hit the SVG already exists,
        // so read it back to hash its canonical content.
        const { data: cachedSvg } = await svc.storage.from("images").download(destPath);
        if (cachedSvg) {
          const { version } = await createVersion({
            projectId,
            userId,
            svg: await cachedSvg.text(),
            source: "conversion",
          });
          await chargeConversion(userId, projectId, version.id);
        }

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

      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          route: ROUTE,
          userId,
          message: "Stale conversion cache — source SVG missing, re-running pipeline",
          context: { cacheKey, cachedPath: cached.svgStoragePath, error: copyErr.message },
        }),
      );
    }

    // Step 3: quantize + trace (full pipeline)
    await setJobStep(svc, job.id, "normalize", "running");
    await setJobStep(svc, job.id, "trace", "running");
    const svgContent = await runConversionPipeline(rawBuffer, colorCount);
    await setJobStep(svc, job.id, "trace", "done");

    // Step 5: upload SVG
    await setJobStep(svc, job.id, "assemble", "running");
    const svgBytes = Buffer.byteLength(svgContent, "utf8");
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        projectId,
        jobId: job.id,
        message: "svg_built",
        svgBytes,
        colorCount,
      }),
    );
    const svgPath = await uploadSvg(projectId, svgContent);
    await setJobStep(svc, job.id, "assemble", "done");

    // Step 7: write cache + update project
    await cacheSet<ConversionCacheValue>(
      cacheKey,
      { projectId, svgStoragePath: svgPath },
      TTL.CONVERSION,
    );
    await svc
      .from("projects")
      .update({ status: "ready", svg_path: svgPath, source_image_hash: imageHash })
      .eq("id", projectId);

    // Version 1 exists before any charge is made — a failed trace above means
    // we never reach this line, so the user is never billed for nothing.
    const { version } = await createVersion({
      projectId,
      userId,
      svg: svgContent,
      source: "conversion",
    });
    await chargeConversion(userId, projectId, version.id);

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
    // Raised if the balance moved between the pre-check and the debit.
    // Surface as 402 so the UI can offer checkout, not a generic 500.
    if (err instanceof InsufficientCreditsError) {
      return handleError(
        AppError.paymentRequired("Not enough credits to convert"),
        ROUTE,
        userId,
        Date.now() - start,
      );
    }
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
