import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { AppError } from "@/lib/types";

const ROUTE = "GET /api/projects/[id]/export";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { id: projectId } = await params;
    const url = new URL(req.url);
    const format = url.searchParams.get("format") ?? "svg"; // "svg" | "png"

    if (format !== "svg" && format !== "png") {
      throw AppError.validation('format must be "svg" or "png"');
    }

    const auth = await requireAuth();
    userId = auth.userId;

    const svc = createServiceClient();

    // Fetch project — verify ownership
    const { data: project, error: fetchErr } = await svc
      .from("projects")
      .select("id, status, svg_path, name")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !project) throw AppError.notFound("Project");
    if (project.status !== "ready") {
      throw AppError.conflict("Project conversion is not complete yet");
    }
    if (!project.svg_path) {
      throw AppError.notFound("SVG output");
    }

    // Download SVG from storage using service client (private bucket)
    const { data: svgBlob, error: dlErr } = await svc.storage
      .from("images")
      .download(project.svg_path);

    if (dlErr || !svgBlob) {
      throw AppError.storage(`Failed to retrieve SVG: ${dlErr?.message ?? "unknown"}`, {
        svgPath: project.svg_path,
      });
    }

    const safeName = (project.name as string)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80);

    if (format === "svg") {
      const svgText = sanitizeSvg(await svgBlob.text());

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          route: ROUTE,
          userId,
          durationMs: Date.now() - start,
          projectId,
          format,
        }),
      );

      const isDownload = url.searchParams.get("download") === "1";
      const safeFilename = safeName.replace(/"/g, "");
      return new Response(svgText, {
        headers: {
          "Content-Type": "image/svg+xml",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
          "Content-Disposition": isDownload
            ? `attachment; filename="${safeFilename}.svg"`
            : `inline; filename="${safeFilename}.svg"`,
          "Cache-Control": "private, max-age=300",
        },
      });
    }

    // PNG: render SVG via Sharp
    const sharp = (await import("sharp")).default;
    const svgBuffer = Buffer.from(await svgBlob.arrayBuffer());

    let pngBuffer: Buffer;
    try {
      pngBuffer = await sharp(svgBuffer).png().toBuffer();
    } catch (err) {
      throw AppError.pipeline(`Failed to render PNG: ${String(err)}`);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        projectId,
        format,
        pngBytes: pngBuffer.length,
      }),
    );

    const safeFilename = safeName.replace(/"/g, "");
    return new Response(pngBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `attachment; filename="${safeFilename}.png"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
