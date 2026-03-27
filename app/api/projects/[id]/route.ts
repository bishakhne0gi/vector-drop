import { z } from "zod";
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

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error || !project) throw AppError.notFound("Project");

    // Generate signed URL if svg_path exists but no svg_url
    if (project.svg_path && !project.svg_url) {
      const svc = createServiceClient();
      const { data: signed } = await svc.storage
        .from("images")
        .createSignedUrl(project.svg_path, 3600);
      if (signed?.signedUrl) project.svg_url = signed.signedUrl;
    }

    return Response.json(project);
  } catch (err) {
    return handleError(err, "GET /api/projects/[id]", userId, Date.now() - start);
  }
}

const ROUTE = "PATCH /api/projects/[id]";

const patchProjectSchema = z.object({
  svg_content: z.string().min(1).optional(),
  name: z.string().min(1).max(200).optional(),
}).refine((d) => d.svg_content !== undefined || d.name !== undefined, {
  message: "At least one of svg_content or name must be provided",
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id: projectId } = await params;

    const { supabase, user } = await requireAuth();
    userId = user.id;

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const parsed = patchProjectSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid request body", { issues: parsed.error.issues });
    }
    const { svg_content, name } = parsed.data;

    // Verify project exists and belongs to user (RLS enforces ownership)
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("id, status, svg_path")
      .eq("id", projectId)
      .single();

    if (fetchErr || !project) throw AppError.notFound("Project");

    // Build update payload
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) update.name = name;

    // If SVG content provided, upload to storage and update path
    if (svg_content) {
      if (project.status !== "ready") {
        throw AppError.conflict(
          "Cannot save SVG edits — project is not in ready state",
        );
      }

      const svgPath = project.svg_path ?? `projects/${projectId}/output.svg`;
      const blob = new Blob([svg_content], { type: "image/svg+xml" });

      const { error: uploadErr } = await supabase.storage
        .from("images")
        .upload(svgPath, blob, { upsert: true, contentType: "image/svg+xml" });

      if (uploadErr) {
        throw AppError.storage(
          `Failed to save SVG: ${uploadErr.message}`,
          { svgPath },
        );
      }

      update.svg_path = svgPath;
    }

    const { data: updated, error: updateErr } = await supabase
      .from("projects")
      .update(update)
      .eq("id", projectId)
      .select()
      .single();

    if (updateErr || !updated) {
      throw AppError.internal(`Failed to update project: ${updateErr?.message ?? "unknown"}`);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        projectId,
        updatedFields: Object.keys(update),
      }),
    );

    return Response.json({ project: updated });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
