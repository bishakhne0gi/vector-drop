import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { convertRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { AppError } from "@/lib/types";
import { runConversionPipeline } from "@/lib/conversion/runPipeline";

const ROUTE = "POST /api/projects/[id]/frames/[idx]/convert";
const SAMPLING_FPS = 8;
const DEFAULT_FRAME_DURATION_MS = Math.round(1000 / SAMPLING_FPS);
const DEFAULT_COLOR_COUNT = 32;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; idx: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id: projectId, idx: idxStr } = await ctx.params;
    const idx = Number(idxStr);
    if (!Number.isInteger(idx) || idx < 0) {
      throw AppError.validation("Bad frame index");
    }

    const { userId: clerkUserId } = await auth();
    userId = clerkUserId;

    const rateLimitKey =
      userId ?? (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon");
    await enforceRateLimit(convertRatelimit, rateLimitKey);

    const svc = createServiceClient();

    const projectQuery = svc.from("projects").select("id, user_id, kind").eq("id", projectId);
    const finalQuery = userId
      ? projectQuery.eq("user_id", userId)
      : projectQuery.is("user_id", null);
    const { data: project, error: projErr } = await finalQuery.single();
    if (projErr || !project) throw AppError.notFound("Project");
    if (project.kind !== "video") {
      throw AppError.validation("Project is not a video project");
    }

    const form = await req.formData();
    const file = form.get("frame");
    if (!(file instanceof Blob)) {
      throw AppError.validation("Missing frame blob");
    }
    const buf = Buffer.from(await file.arrayBuffer());

    const svgContent = await runConversionPipeline(buf, DEFAULT_COLOR_COUNT);

    const framePath = `projects/${projectId}/frames/${String(idx).padStart(4, "0")}.svg`;
    const { error: upErr } = await svc.storage
      .from("images")
      .upload(framePath, new Blob([svgContent], { type: "image/svg+xml" }), {
        upsert: true,
        contentType: "image/svg+xml",
      });
    if (upErr) {
      throw AppError.storage(`Failed to upload frame SVG: ${upErr.message}`);
    }

    const { data: signed } = await svc.storage
      .from("images")
      .createSignedUrl(framePath, 60 * 60 * 24);
    const svgUrl = signed?.signedUrl ?? framePath;

    const { error: insErr } = await svc.from("project_frames").upsert(
      {
        project_id: projectId,
        frame_idx: idx,
        svg_url: svgUrl,
        duration_ms: DEFAULT_FRAME_DURATION_MS,
      },
      { onConflict: "project_id,frame_idx" },
    );
    if (insErr) throw AppError.internal(`Frame insert failed: ${insErr.message}`);

    // Flip the project to "ready" on the first frame so the dashboard card becomes clickable.
    if (idx === 0) {
      await svc.from("projects").update({ status: "ready" }).eq("id", projectId);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        projectId,
        frameIdx: idx,
        durationMs: Date.now() - start,
      }),
    );

    return Response.json({ svg_url: svgUrl });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
