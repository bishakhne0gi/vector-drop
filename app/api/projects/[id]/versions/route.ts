import { requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { listVersions } from "@/lib/versions/service";
import { isUnlocked } from "@/lib/credits/service";
import type { ProjectVersionWithUnlock } from "@/lib/types";

const ROUTE = "GET /api/projects/[id]/versions";

/**
 * Version history for a project, newest first.
 *
 * Each version carries `unlocked`, so the editor can show the export cost
 * BEFORE the user clicks rather than surprising them with a charge after.
 * The original converted version is always free — it is included with the
 * conversion credit.
 */
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

    const versions = await listVersions(projectId, userId);

    const withUnlocks: ProjectVersionWithUnlock[] = await Promise.all(
      versions.map(async (v) => ({
        ...v,
        unlocked:
          v.source === "conversion" ||
          (await isUnlocked(userId as string, "version_export", v.id)),
      })),
    );

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        projectId,
        versionCount: withUnlocks.length,
      }),
    );

    return Response.json(withUnlocks, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
