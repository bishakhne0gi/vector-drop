import { z } from "zod";
import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { writeRatelimit, enforceRateLimit } from "@/lib/cache/redis";
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
    const { data: project, error } = await svc
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (error || !project) throw AppError.notFound("Project");

    // Always generate a fresh signed URL — stored svg_url may be expired
    if (project.svg_path) {
      const { data: signed } = await svc.storage
        .from("images")
        .createSignedUrl(project.svg_path, 3600); // 1 hour, fresh every request
      if (signed?.signedUrl) project.svg_url = signed.signedUrl;
    }

    return Response.json(project);
  } catch (err) {
    return handleError(err, "GET /api/projects/[id]", userId, Date.now() - start);
  }
}

const ROUTE = "PATCH /api/projects/[id]";

// 10 MB cap — generous for a real SVG, but prevents memory-exhaustion attacks.
const MAX_SVG_BYTES = 10 * 1024 * 1024;

const patchProjectSchema = z.object({
  svg_content: z.string().min(1).max(MAX_SVG_BYTES, "svg_content exceeds 10 MB limit").optional(),
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

    const auth = await requireAuth();
    userId = auth.userId;

    await enforceRateLimit(writeRatelimit, userId);

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

    const svc = createServiceClient();

    // Verify project exists and belongs to user
    const { data: project, error: fetchErr } = await svc
      .from("projects")
      .select("id, status, svg_path")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !project) throw AppError.notFound("Project");

    // Build update payload
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) update.name = name;

    // If SVG content provided, sanitize then upload to storage and update path
    if (svg_content) {
      if (project.status !== "ready") {
        throw AppError.conflict(
          "Cannot save SVG edits — project is not in ready state",
        );
      }

      const sanitized = sanitizeSvg(svg_content);
      const svgPath = project.svg_path ?? `projects/${projectId}/output.svg`;
      const blob = new Blob([sanitized], { type: "image/svg+xml" });

      const { error: uploadErr } = await svc.storage
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

    const { data: updated, error: updateErr } = await svc
      .from("projects")
      .update(update)
      .eq("id", projectId)
      .eq("user_id", userId)
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
