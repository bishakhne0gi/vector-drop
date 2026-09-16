import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient, requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { copyObject, downloadObject, downloadText, uploadObject } from "@/lib/storage/r2";
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
import { quantizeColors, MAX_TRACE_DIMENSION } from "@/lib/conversion/quantize";
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

/**
 * Declared explicitly rather than left to the platform default, because the
 * budget is what bounds MAX_TRACE_DIMENSION and DEFAULT_COLOR_COUNT below.
 * Measured at 2048px/32 colors: p99 ≈ 122s, worst ≈ 222s.
 */
export const maxDuration = 300;

/**
 * Benchmarked on real uploads (2026-09-01): at 2048px tracing resolution, 64
 * colors is visually indistinguishable from 32 on line art and logos, while
 * costing ~70% more CPU and 2.2 MB more per SVG — enough to push the worst case
 * past maxDuration. Perceived "pixelation" came from the tracing resolution,
 * not the palette size; see MAX_TRACE_DIMENSION in lib/conversion/quantize.ts.
 * Callers wanting a richer palette can still pass colorCount up to 64.
 */
const DEFAULT_COLOR_COUNT = 32;

const convertSchema = z.object({
  colorCount: z.number().int().min(2).max(64).default(DEFAULT_COLOR_COUNT),
});

// ─── Pipeline helpers ────────────────────────────────────────────────────────

async function downloadImage(storagePath: string): Promise<Buffer> {
  return downloadObject(storagePath);
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
  const svgPath = `projects/${projectId}/output.svg`;
  await uploadObject(svgPath, svgContent, "image/svg+xml");
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
 * How long a project may sit in `converting` before the next request treats the
 * run as dead and takes over.
 *
 * A conversion that outlives `maxDuration` is killed by the platform mid-flight:
 * no catch block runs, so the project keeps the `converting` status and the job
 * keeps `running` forever. The dashboard then polls a job that will never
 * finish and the card pulses "Converting" for eternity, with no way for the
 * user to retry. Anything older than the function budget (plus a minute of
 * slack) cannot still be alive, so it is safe to reclaim.
 */
const STALE_CONVERSION_MS = (maxDuration + 60) * 1000;

/**
 * Marks a conversion as failed on both rows it touches.
 *
 * Without this, any throw between "mark converting" and "mark ready" left the
 * project stuck on `converting` and the job stuck on `pending`/`running` — the
 * UI's two hanging states. Both must land, so each is best-effort: a failure to
 * write one must not stop the other, and neither may mask the original error.
 */
async function failConversion(
  supabase: SupabaseClient,
  jobId: string,
  projectId: string,
  err: unknown,
): Promise<void> {
  const appErr = err instanceof AppError ? err : null;
  const message =
    appErr?.message ??
    (err instanceof Error ? err.message : "Conversion failed");
  const code = appErr?.code ?? "PIPELINE_ERROR";

  const results = await Promise.allSettled([
    supabase
      .from("conversion_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: { code, message },
      })
      .eq("id", jobId),
    supabase
      .from("projects")
      .update({ status: "error", error_message: message })
      .eq("id", projectId),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          route: ROUTE,
          userId: null,
          message: "Failed to record conversion failure",
          context: { jobId, projectId, error: String(result.reason) },
        }),
      );
    }
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

  // Tracked outside the try so the catch can clean up whatever the pipeline
  // left half-written. `inFlight` is true only between marking the project
  // `converting` and marking it `ready`: before that there is nothing to undo,
  // and after it the SVG exists, so a later failure (a short balance at charge
  // time) must not turn a finished project into an errored one.
  let inFlight: { jobId: string; projectId: string } | null = null;

  // Hoisted above the try: the catch needs it to write the failure state.
  const svc = createServiceClient();

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

    const { data: project, error: projectErr } = await svc
      .from("projects")
      .select()
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (projectErr || !project) throw AppError.notFound("Project");
    if (project.status === "converting") {
      // Only refuse while a run could genuinely still be in flight. Past the
      // function budget the previous attempt is dead, and refusing forever
      // would strand the project with no way back.
      const lastTouched = new Date(project.updated_at ?? project.created_at).getTime();
      if (Date.now() - lastTouched < STALE_CONVERSION_MS)
        throw AppError.conflict("Conversion already in progress for this project");

      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          route: ROUTE,
          userId,
          message: "Reclaiming stale converting project",
          context: { projectId, updatedAt: project.updated_at },
        }),
      );
      await svc
        .from("conversion_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error: { code: "PIPELINE_ERROR", message: "Conversion timed out" },
        })
        .eq("project_id", projectId)
        .in("status", ["pending", "running"]);
    }
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
    inFlight = { jobId: job.id, projectId };

    // ── Pipeline ──────────────────────────────────────────────────────────────

    // Step 1: download
    await setJobStep(svc, job.id, "upload", "running");
    const rawBuffer = await downloadImage(project.source_image_path);
    await setJobStep(svc, job.id, "upload", "done");

    // Step 2: cache-aside on raw buffer hash
    const imageHash = computeImageHash(rawBuffer);
    const cacheKey = cacheKeys.conversion(imageHash, colorCount, MAX_TRACE_DIMENSION);
    const cached = await cacheGet<ConversionCacheValue>(cacheKey);

    if (cached) {
      // Copy the cached SVG to a path owned by *this* project so its lifecycle
      // (deletion, etc.) is independent from the original project that produced
      // the cache entry. If the source is missing, fall through to a full
      // re-run and overwrite the stale cache entry.
      const destPath = `projects/${projectId}/output.svg`;
      // R2's CopyObject overwrites, so unlike Supabase's copy() the destination
      // no longer has to be removed first. It still fails when the SOURCE is
      // missing, which is exactly how a stale cache entry gets detected.
      let copyErr: Error | null = null;
      try {
        await copyObject(cached.svgStoragePath, destPath);
      } catch (err) {
        copyErr = err instanceof Error ? err : new Error(String(err));
      }

      if (!copyErr) {
        await svc
          .from("projects")
          .update({ status: "ready", svg_path: destPath, source_image_hash: imageHash })
          .eq("id", projectId);
        await setJobStep(svc, job.id, "assemble", "done");
        inFlight = null;

        // Record version 1 and charge. On a cache hit the SVG already exists,
        // so read it back to hash its canonical content.
        const cachedSvg = await downloadText(destPath);
        const { version } = await createVersion({
          projectId,
          userId,
          svg: cachedSvg,
          source: "conversion",
        });
        await chargeConversion(userId, projectId, version.id);

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
    inFlight = null;

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
    // Nothing may be left mid-conversion. A project stuck on `converting` and a
    // job stuck on `pending`/`running` are what the dashboard polls forever, so
    // every exit from the pipeline has to land on a terminal state.
    if (inFlight) {
      await failConversion(svc, inFlight.jobId, inFlight.projectId, err);
    }

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
