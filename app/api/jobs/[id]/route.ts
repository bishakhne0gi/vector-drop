import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError, JobStatusResponse, ConversionStep, JobStatus } from "@/lib/types";

const ROUTE = "GET /api/jobs/[id]";

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

    const { userId: clerkUserId } = await auth();
    userId = clerkUserId;

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

    // Enforce ownership: authenticated users must own the project,
    // guests can only access jobs for unclaimed (null user_id) projects
    const projectUserId = (job.projects as { user_id: string | null }).user_id;
    if (userId) {
      if (projectUserId !== userId) throw AppError.forbidden();
    } else {
      if (projectUserId !== null) throw AppError.forbidden();
    }

    const step = job.step as ConversionStep;
    const status = job.status as JobStatus;

    const response: JobStatusResponse = {
      jobId: job.id,
      projectId: job.project_id,
      step,
      status,
      progress: computeProgress(step, status),
      startedAt: job.started_at ?? null,
      completedAt: job.completed_at ?? null,
      error: job.error ?? null,
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
