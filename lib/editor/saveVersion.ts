import { BODY_ENCODING_HEADER } from "@/lib/api/readJsonBody";
import type { ProjectVersion } from "@/lib/types";

/**
 * Bodies below this go up as plain JSON — gzipping a small payload costs more
 * in latency than it saves in bytes. Above it, compression is what keeps the
 * request under the platform's body limit at all.
 */
const COMPRESS_ABOVE_BYTES = 256 * 1024;

async function gzip(text: string): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    // Never let a compression failure become a save failure — the uncompressed
    // request may still be small enough to succeed.
    return null;
  }
}

/**
 * Saves SVG content as a project version.
 *
 * Large traces are gzipped in the browser. A 2048px trace is several megabytes
 * of path data, which the platform rejects outright with a 413 before the route
 * runs; compressed it is a few hundred kilobytes. See lib/api/readJsonBody.
 */
export async function saveSvgVersion(
  projectId: string,
  svgContent: string,
): Promise<ProjectVersion | null> {
  const json = JSON.stringify({ svg_content: svgContent });

  const headers: Record<string, string> = {};
  let body: BodyInit = json;

  if (json.length > COMPRESS_ABOVE_BYTES) {
    const compressed = await gzip(json);
    if (compressed) {
      headers[BODY_ENCODING_HEADER] = "gzip";
      headers["Content-Type"] = "application/octet-stream";
      body = compressed as unknown as BodyInit;
    }
  }
  if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers, body });

  if (!res.ok) {
    const parsed = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      message?: string;
    };
    // The API wraps failures as { error: { code, message } }; reading only the
    // top-level `message` reported every real cause as a bare status code.
    throw new Error(parsed.error?.message ?? parsed.message ?? `Save failed (${res.status})`);
  }

  const { version } = (await res.json()) as { version: ProjectVersion | null };
  return version;
}
