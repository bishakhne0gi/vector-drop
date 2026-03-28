import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError } from "@/lib/types";

const ROUTE = "POST /api/projects/claim";
const MAX_CLAIM = 20;

/**
 * Called after login to reassign guest-created projects to the authenticated user.
 * Body: { projectIds: string[] }
 */
export async function POST(req: Request): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const auth = await requireAuth();
    userId = auth.userId;

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const body = raw as { projectIds?: unknown };
    if (!Array.isArray(body.projectIds)) {
      throw AppError.validation("projectIds must be an array");
    }

    const ids = (body.projectIds as unknown[])
      .filter((id): id is string => typeof id === "string")
      .slice(0, MAX_CLAIM);

    if (ids.length === 0) {
      return Response.json({ claimed: 0 });
    }

    const svc = createServiceClient();

    // Only claim projects that have no owner (guest-created)
    const { error } = await svc
      .from("projects")
      .update({ user_id: userId })
      .in("id", ids)
      .is("user_id", null);

    if (error) {
      throw AppError.internal(`Failed to claim projects: ${error.message}`);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        claimed: ids.length,
      }),
    );

    return Response.json({ claimed: ids.length });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
