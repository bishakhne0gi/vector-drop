import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { downloadObject } from "@/lib/storage/r2";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { getVersion, getLatestVersion } from "@/lib/versions/service";
import {
  spendUnits,
  isUnlocked,
  getBalance,
  InsufficientCreditsError,
} from "@/lib/credits/service";
import { VERSION_EXPORT_UNITS } from "@/lib/credits/constants";
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

    // Resolve the target version. Defaults to the latest so existing callers
    // that pass no versionId keep working.
    const versionIdParam = url.searchParams.get("versionId");
    const version = versionIdParam
      ? await getVersion(versionIdParam, userId)
      : await getLatestVersion(projectId, userId);

    if (version.project_id !== projectId) throw AppError.notFound("Version");

    // The original traced version is included with the conversion credit.
    // Edited versions cost VERSION_EXPORT_UNITS — once, for any format.
    const cost = version.source === "conversion" ? 0 : VERSION_EXPORT_UNITS;

    // Pre-check: fail fast, before doing any work. Not authoritative — the
    // real charge happens after the bytes exist.
    if (cost > 0) {
      const unlocked = await isUnlocked(userId, "version_export", version.id);
      if (!unlocked) {
        const balance = await getBalance(userId);
        if (balance < cost) {
          throw AppError.paymentRequired("Not enough credits to export this version", {
            requiredUnits: cost,
            balanceUnits: balance,
            versionId: version.id,
          });
        }
      }
    }

    // Download SVG from the private R2 bucket, server-side
    const svgBuffer = await downloadObject(version.storage_path);

    const safeName = (project.name as string)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80);

    if (format === "svg") {
      const svgText = sanitizeSvg(svgBuffer.toString("utf8"));

      // Debit only now that the deliverable exists. Idempotent per version, so
      // a retry after a dropped response is free.
      const spend = await spendUnits({
        userId,
        kind: "version_export",
        refId: version.id,
        units: cost,
        reason: "version_export",
      });

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          route: ROUTE,
          userId,
          durationMs: Date.now() - start,
          projectId,
          format,
          versionId: version.id,
          charged: spend.charged,
          balanceUnits: spend.balanceUnits,
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
          "X-Credits-Remaining": String(spend.balanceUnits),
          "X-Credit-Charged": String(spend.charged),
        },
      });
    }

    // PNG: render SVG via Sharp
    const sharp = (await import("sharp")).default;

    let pngBuffer: Buffer;
    try {
      pngBuffer = await sharp(svgBuffer).png().toBuffer();
    } catch (err) {
      // Thrown BEFORE any debit — a failed render never costs a credit.
      throw AppError.pipeline(`Failed to render PNG: ${String(err)}`);
    }

    const spend = await spendUnits({
      userId,
      kind: "version_export",
      refId: version.id,
      units: cost,
      reason: "version_export",
    });

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
        versionId: version.id,
        charged: spend.charged,
        balanceUnits: spend.balanceUnits,
      }),
    );

    const safeFilename = safeName.replace(/"/g, "");
    return new Response(pngBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `attachment; filename="${safeFilename}.png"`,
        "Cache-Control": "private, max-age=300",
        "X-Credits-Remaining": String(spend.balanceUnits),
        "X-Credit-Charged": String(spend.charged),
      },
    });
  } catch (err) {
    // The DB raises insufficient_credits if the balance moved between the
    // pre-check and the debit. Surface it as 402, not 500.
    if (err instanceof InsufficientCreditsError) {
      return handleError(
        AppError.paymentRequired("Not enough credits to export"),
        ROUTE,
        userId,
        Date.now() - start,
      );
    }
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
