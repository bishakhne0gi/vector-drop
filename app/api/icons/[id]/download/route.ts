import { createRouteClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError } from "@/lib/types";

const ROUTE = "GET /api/icons/[id]/download";

const VALID_SIZES = new Set([16, 24, 32, 48, 64, 128, 256, 512]);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  const userId: string | null = null;

  try {
    const { id } = await params;
    const url = new URL(req.url);
    const format = url.searchParams.get("format") ?? "svg";
    const sizeParam = url.searchParams.get("size");

    if (format !== "svg" && format !== "png") {
      throw AppError.validation("format must be 'svg' or 'png'");
    }

    let size = 24;
    if (format === "png") {
      size = parseInt(sizeParam ?? "24", 10);
      if (!VALID_SIZES.has(size)) {
        throw AppError.validation(
          `size must be one of: ${[...VALID_SIZES].join(", ")}`,
        );
      }
    }

    // Fetch icon — RLS "Public icons viewable by everyone" handles visibility.
    const supabase = await createRouteClient();
    const { data: icon, error } = await supabase
      .from("icons")
      .select("svg_content")
      .eq("id", id)
      .single();

    if (error || !icon) {
      throw AppError.notFound("Icon");
    }

    const svgContent: string = (icon as { svg_content: string }).svg_content;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        iconId: id,
        format,
        size,
      }),
    );

    if (format === "svg") {
      return new Response(svgContent, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="icon-${id}.svg"`,
        },
      });
    }

    // PNG: rasterize via Sharp
    const sharp = (await import("sharp")).default;
    const png = await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toBuffer();

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="icon-${id}-${size}px.png"`,
        "Content-Length": String(png.byteLength),
      },
    });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
