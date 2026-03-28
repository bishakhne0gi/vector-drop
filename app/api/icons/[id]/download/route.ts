import { createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { aiRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { AppError } from "@/lib/types";

const ROUTE = "GET /api/icons/[id]/download";

const VALID_SIZES = new Set([16, 24, 32, 48, 64, 128, 256, 512]);

// Maximum SVG size we are willing to rasterize (4 MB).
const MAX_SVG_BYTES = 4 * 1024 * 1024;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  // Download is intentionally unauthenticated for public icons, so userId is
  // only available if the user is logged in. Rate-limit by IP instead.
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

    // Rate-limit by IP to prevent CPU-bound Sharp abuse.
    // We use the AI rate-limiter (10/min) as a shared budget — a dedicated
    // download limiter would be better in production.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    const { remaining } = await enforceRateLimit(aiRatelimit, `dl:${ip}`);

    // Fetch public icon only
    const supabase = createServiceClient();
    const { data: icon, error } = await supabase
      .from("icons")
      .select("svg_content")
      .eq("id", id)
      .eq("is_public", true)
      .single();

    if (error || !icon) {
      throw AppError.notFound("Icon");
    }

    // Sanitize AI-generated SVG before serving (defense against stored XSS).
    const rawSvg: string = (icon as { svg_content: string }).svg_content;

    if (Buffer.byteLength(rawSvg, "utf8") > MAX_SVG_BYTES) {
      throw AppError.validation("SVG content exceeds maximum allowed size");
    }

    const svgContent = sanitizeSvg(rawSvg);

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

    const securityHeaders = {
      // Prevent browsers from MIME-sniffing the SVG as HTML.
      "X-Content-Type-Options": "nosniff",
      // Ensure SVG is treated as an image, not a navigable document.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-RateLimit-Remaining": String(remaining),
    };

    if (format === "svg") {
      return new Response(svgContent, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="icon-${id}.svg"`,
          ...securityHeaders,
        },
      });
    }

    // PNG: rasterize via Sharp — no XSS risk in binary output.
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
        "X-Content-Type-Options": "nosniff",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
