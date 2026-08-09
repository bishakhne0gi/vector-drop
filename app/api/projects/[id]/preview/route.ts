import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { objectExists, signedDownloadUrl } from "@/lib/storage/r2";
import { AppError } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id: projectId } = await params;
    const auth = await requireAuth();
    userId = auth.userId;

    const svc = createServiceClient();

    // Verify ownership
    const { data: project, error: fetchErr } = await svc
      .from("projects")
      .select("svg_path, status")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !project) throw AppError.notFound("Project");
    if (!project.svg_path) throw AppError.notFound("SVG preview");

    // Presigning never fails for a missing key, so confirm the object is
    // actually there — otherwise this redirects to a URL that 404s.
    if (!(await objectExists(project.svg_path))) {
      throw AppError.notFound("SVG preview");
    }

    // Short-lived signed URL (5 minutes — just for display)
    const url = await signedDownloadUrl(project.svg_path, 300);

    return Response.redirect(url, 302);
  } catch (err) {
    return handleError(err, "GET /api/projects/[id]/preview", userId, Date.now() - start);
  }
}
