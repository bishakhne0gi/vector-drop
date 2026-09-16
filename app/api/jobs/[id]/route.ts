import { createServiceClient, requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError, JobStatusResponse, ConversionStep, JobStatus } from "@/lib/types";

const ROUTE = "GET /api/jobs/[id]";

/**
 * Past this, a job that still says `pending` or `running` is dead.
 *
 * The convert route runs the whole pipeline inside the request, with
 * `maxDuration = 300`. When the platform kills it at the budget, no catch block
 * runs: the job keeps its non-terminal status and the project keeps
 * `converting`, so the dashboard polls every 2s forever and the card pulses
 * "Converting" with no error and no way out. Nothing can still be running an
 * hour — or a minute — past the budget, so this route reports the truth and
 * writes it back.
 */
const JOB_TIMEOUT_MS = (300 + 60) * 1000;

const TIMEOUT_MESSAGE =
  "Conversion timed out — the image may be too large or detailed. Try again, or use a smaller image.";

const STEP_PROGRESS: Record<ConversionStep, number> = {
  upload: 20,
  normalize: 45,
  trace: 75,
  assemble: 95,
};

function computeProgress(step: ConversionStep, status: JobStatus): number {
  if (status === "done") return 100;
  if (status === "failed") return STEP_PROGRESS[step];
  if (status === "running") return STEP_PROGRESS[step];
  return 0; // pending
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id: jobId } = await params;

    const authResult = await requireAuth();
    userId = authResult.userId;

    const svc = createServiceClient();

    // Load job — join to project to verify ownership
    const { data: job, error } = await svc
      .from("conversion_jobs")
      .select("*, projects!inner(user_id)")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      throw AppError.notFound("Job");
    }

    // Enforce ownership. The guest branch was removed with the auth-only
    // cutover — every project now has an owner.
    const projectUserId = (job.projects as { user_id: string | null }).user_id;
    if (projectUserId !== userId) throw AppError.forbidden();

    const step = job.step as ConversionStep;
    let status = job.status as JobStatus;
    let jobError = (job.error ?? null) as JobStatusResponse["error"];

    const isTerminal = status === "done" || status === "failed";
    const ageMs = Date.now() - new Date(job.started_at ?? job.created_at).getTime();

    if (!isTerminal && ageMs > JOB_TIMEOUT_MS) {
      status = "failed";
      jobError = { code: "PIPELINE_ERROR", message: TIMEOUT_MESSAGE };

      // Persist it, so the project card stops saying "Converting" too. The
      // response does not depend on these writes — the status above is already
      // the answer — so failures here only cost a stale row, not a hung client.
      const { error: jobWriteErr } = await svc
        .from("conversion_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error: jobError,
        })
        .eq("id", jobId)
        .in("status", ["pending", "running"]);

      const { error: projectWriteErr } = await svc
        .from("projects")
        .update({ status: "error", error_message: TIMEOUT_MESSAGE })
        .eq("id", job.project_id)
        .eq("status", "converting");

      if (jobWriteErr || projectWriteErr) {
        console.warn(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "warn",
            route: ROUTE,
            userId,
            message: "Failed to persist job timeout",
            context: {
              jobId,
              jobError: jobWriteErr?.message,
              projectError: projectWriteErr?.message,
            },
          }),
        );
      }
    }

    const response: JobStatusResponse = {
      jobId: job.id,
      projectId: job.project_id,
      step,
      status,
      progress: computeProgress(step, status),
      startedAt: job.started_at ?? null,
      completedAt: job.completed_at ?? null,
      error: jobError,
    };

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        jobId,
        status,
      }),
    );

    return Response.json(response);
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
