import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id: projectId } = await params;
    const { supabase, user } = await requireAuth();
    userId = user.id;

    // Verify ownership via RLS
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("svg_path, status")
      .eq("id", projectId)
      .single();

    if (fetchErr || !project) throw AppError.notFound("Project");
    if (!project.svg_path) throw AppError.notFound("SVG preview");

    // Generate a short-lived signed URL (5 minutes — just for display)
    const svc = createServiceClient();
    const { data, error } = await svc.storage
      .from("images")
      .createSignedUrl(project.svg_path, 300);

    if (error || !data?.signedUrl) {
      throw AppError.storage(
        `Failed to create preview URL: ${error?.message ?? "unknown"}`,
      );
    }

    return Response.redirect(data.signedUrl, 302);
  } catch (err) {
    return handleError(err, "GET /api/projects/[id]/preview", userId, Date.now() - start);
  }
}
