import { describe, it, expect } from "vitest";
import { readJsonBody, BODY_ENCODING_HEADER } from "@/lib/api/readJsonBody";
import { AppError } from "@/lib/types";

async function gzipBytes(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function req(body: BodyInit, headers: Record<string, string> = {}): Request {
  return new Request("https://example.test/api", { method: "PATCH", body, headers });
}

const MAX = 10 * 1024 * 1024;

describe("readJsonBody", () => {
  it("reads a plain JSON body", async () => {
    const parsed = await readJsonBody(req(JSON.stringify({ svg_content: "<svg/>" })), MAX);
    expect(parsed).toEqual({ svg_content: "<svg/>" });
  });

  it("reads a gzipped body identically", async () => {
    const payload = { svg_content: `<svg>${"M0 0 L1 1 ".repeat(5000)}</svg>` };
    const bytes = await gzipBytes(JSON.stringify(payload));

    // The point of the whole exercise: the compressed request is a fraction of
    // the size that gets rejected at the platform edge.
    expect(bytes.byteLength).toBeLessThan(JSON.stringify(payload).length / 5);

    const parsed = await readJsonBody(
      req(bytes as unknown as BodyInit, { [BODY_ENCODING_HEADER]: "gzip" }),
      MAX,
    );
    expect(parsed).toEqual(payload);
  });

  it("rejects a gzip body that expands past the cap", async () => {
    // A small request that decompresses enormously must not be buffered whole.
    const bytes = await gzipBytes(JSON.stringify({ svg_content: "a".repeat(200_000) }));
    await expect(
      readJsonBody(req(bytes as unknown as BodyInit, { [BODY_ENCODING_HEADER]: "gzip" }), 1024),
    ).rejects.toMatchObject({ statusCode: 413 });
  });

  it("rejects an oversized uncompressed body", async () => {
    await expect(readJsonBody(req(JSON.stringify({ a: "x".repeat(5000) })), 1024)).rejects.toBeInstanceOf(AppError);
  });

  it("rejects a body claiming gzip that is not gzip", async () => {
    await expect(
      readJsonBody(req("not gzip at all", { [BODY_ENCODING_HEADER]: "gzip" }), MAX),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an unknown encoding rather than guessing", async () => {
    await expect(
      readJsonBody(req("{}", { [BODY_ENCODING_HEADER]: "br" }), MAX),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects malformed JSON", async () => {
    await expect(readJsonBody(req("{nope"), MAX)).rejects.toMatchObject({ statusCode: 400 });
  });
});
