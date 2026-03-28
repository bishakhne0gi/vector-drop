import { z } from "zod";
import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError, Icon } from "@/lib/types";

const ROUTE_GET = "GET /api/icons/[id]";
const ROUTE_PATCH = "PATCH /api/icons/[id]";
const ROUTE_DELETE = "DELETE /api/icons/[id]";

const patchIconSchema = z.object({
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id } = await params;

    const svc = createServiceClient();

    // Fetch public icon only
    const { data: icon, error } = await svc
      .from("icons")
      .select("*")
      .eq("id", id)
      .eq("is_public", true)
      .single();

    if (error || !icon) {
      throw AppError.notFound("Icon");
    }

    // Increment download_count atomically
    void (async () => {
      try {
        const { error: updateErr } = await svc.rpc("increment_download_count", { icon_id: id });
        if (updateErr) {
          console.warn(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: "warn",
              route: ROUTE_GET,
              userId,
              error: { code: "INTERNAL_ERROR", message: updateErr.message },
            }),
          );
        }
      } catch (err: unknown) {
        console.warn(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "warn",
            route: ROUTE_GET,
            userId,
            error: {
              code: "INTERNAL_ERROR",
              message: err instanceof Error ? err.message : String(err),
            },
          }),
        );
      }
    })();

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE_GET,
        userId,
        durationMs: Date.now() - start,
        iconId: id,
      }),
    );

    return Response.json({ icon });
  } catch (err) {
    return handleError(err, ROUTE_GET, userId, Date.now() - start);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id } = await params;
    const auth = await requireAuth();
    userId = auth.userId;

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const parsed = patchIconSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid request body", {
        issues: parsed.error.issues,
      });
    }

    const { isPublic, tags } = parsed.data;

    if (isPublic === undefined && tags === undefined) {
      throw AppError.validation("Provide at least one field to update: isPublic or tags");
    }

    const updates: Record<string, unknown> = {};
    if (isPublic !== undefined) updates.is_public = isPublic;
    if (tags !== undefined) updates.tags = tags;

    const svc = createServiceClient();
    const { data: icon, error } = await svc
      .from("icons")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !icon) {
      throw AppError.notFound("Icon");
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE_PATCH,
        userId,
        durationMs: Date.now() - start,
        iconId: id,
      }),
    );

    return Response.json({ icon });
  } catch (err) {
    return handleError(err, ROUTE_PATCH, userId, Date.now() - start);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id } = await params;
    const auth = await requireAuth();
    userId = auth.userId;

    const svc = createServiceClient();
    const { error } = await svc
      .from("icons")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw AppError.internal(`Failed to delete icon: ${error.message}`);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE_DELETE,
        userId,
        durationMs: Date.now() - start,
        iconId: id,
      }),
    );

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleError(err, ROUTE_DELETE, userId, Date.now() - start);
  }
}
