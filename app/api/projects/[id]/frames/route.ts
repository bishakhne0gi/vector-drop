import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError } from "@/lib/types";

const ROUTE = "GET /api/projects/[id]/frames";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  let userId: string | null = null;
  try {
    const { id: projectId } = await ctx.params;
    const { userId: clerkUserId } = await auth();
    userId = clerkUserId;

    const svc = createServiceClient();
    const projectQuery = svc
      .from("projects")
      .select("id, user_id, kind")
      .eq("id", projectId);
    const finalQuery = userId
      ? projectQuery.eq("user_id", userId)
      : projectQuery.is("user_id", null);
    const { data: project, error: projErr } = await finalQuery.single();
    if (projErr || !project) throw AppError.notFound("Project");

    const { data: frames, error } = await svc
      .from("project_frames")
      .select("frame_idx, svg_url, duration_ms")
      .eq("project_id", projectId)
      .order("frame_idx", { ascending: true });
    if (error) throw AppError.internal(error.message);

    return Response.json(frames ?? []);
  } catch (err) {
    return handleError(err, ROUTE, userId, 0);
  }
}
