import { AppError } from "@/lib/types";

/**
 * Marks a request body as compressed.
 *
 * Deliberately NOT `Content-Encoding`: that header has meaning to every proxy
 * on the path, and a proxy that decides to decompress (or to reject) on our
 * behalf turns a working upload into an opaque failure. A private header is
 * invisible to intermediaries and decoded in exactly one place — here.
 */
export const BODY_ENCODING_HEADER = "x-vd-encoding";

/**
 * Reads a JSON request body, transparently decompressing gzipped ones.
 *
 * WHY THIS EXISTS
 *
 * A traced SVG is large — a 2048px trace routinely lands between 5 and 10 MB —
 * and the platform rejects request bodies past a few megabytes with a bare 413
 * before the route ever runs. That made saving (and therefore exporting, which
 * saves first) impossible for exactly the detailed artwork people care most
 * about. Path data is highly repetitive, so gzip takes those megabytes down by
 * roughly an order of magnitude and puts them back inside the limit.
 *
 * `maxBytes` is enforced on the DECOMPRESSED stream and checked as it is read,
 * so a small body that expands enormously is aborted partway rather than
 * buffered first.
 */
export async function readJsonBody(req: Request, maxBytes: number): Promise<unknown> {
  const encoding = req.headers.get(BODY_ENCODING_HEADER);

  let text: string;

  if (encoding === "gzip") {
    if (!req.body) throw AppError.validation("Request body is empty");
    text = await readCapped(req.body.pipeThrough(new DecompressionStream("gzip")), maxBytes);
  } else if (encoding) {
    throw AppError.validation(`Unsupported ${BODY_ENCODING_HEADER}: ${encoding}`);
  } else {
    text = await req.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw AppError.payloadTooLarge(`Request body exceeds ${maxBytes} bytes`);
    }
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw AppError.validation("Request body must be valid JSON");
  }
}

/** Drains a stream to a string, refusing to buffer more than `maxBytes`. */
async function readCapped(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let out = "";
  let bytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        throw AppError.payloadTooLarge(`Request body exceeds ${maxBytes} bytes`);
      }
      out += decoder.decode(value, { stream: true });
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    // A truncated or corrupt gzip frame surfaces here, not at pipeThrough().
    throw AppError.validation("Request body is not valid gzip");
  } finally {
    void reader.cancel().catch(() => {});
  }

  return out + decoder.decode();
}
