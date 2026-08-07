// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { parseSvg } from "@/lib/parseSvg";

const NO_IDS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path d="M 0 0 L 10 10 Z" fill="#111111" />
  <path d="M 20 20 L 30 30 Z" fill="#222222" />
</svg>`;

describe("parseSvg — id determinism", () => {
  it("assigns the same ids when parsing the same SVG twice", () => {
    // Ids are written back into the saved file by serializeSvg, and the file's
    // hash decides whether an export costs a credit. Non-deterministic ids would
    // charge users for opening the editor twice and saving unchanged artwork.
    const first = parseSvg(NO_IDS).paths.map((p) => p.id);
    const second = parseSvg(NO_IDS).paths.map((p) => p.id);
    expect(first).toEqual(second);
  });

  it("generates sequential ids with no random suffix", () => {
    const ids = parseSvg(NO_IDS).paths.map((p) => p.id);
    expect(ids).toEqual(["path-1", "path-2"]);
  });

  it("preserves author-supplied ids", () => {
    const withIds = `<svg viewBox="0 0 10 10"><path id="logo-mark" d="M 0 0 L 1 1"/></svg>`;
    expect(parseSvg(withIds).paths[0].id).toBe("logo-mark");
  });

  it("does not collide with an author id that matches the generated pattern", () => {
    const tricky = `<svg viewBox="0 0 10 10">
      <path id="path-1" d="M 0 0 L 1 1"/>
      <path d="M 2 2 L 3 3"/>
    </svg>`;
    const ids = parseSvg(tricky).paths.map((p) => p.id);
    expect(ids).toEqual(["path-1", "path-2"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps ids unique across many unnamed paths", () => {
    const many =
      `<svg viewBox="0 0 10 10">` +
      Array.from({ length: 50 }, (_, i) => `<path d="M ${i} ${i} L 1 1"/>`).join("") +
      `</svg>`;
    const ids = parseSvg(many).paths.map((p) => p.id);
    expect(new Set(ids).size).toBe(50);
  });
});

describe("parseSvg — attributes", () => {
  it("reads geometry and paint attributes", () => {
    const { paths, meta } = parseSvg(NO_IDS);
    expect(paths).toHaveLength(2);
    expect(paths[0].d).toBe("M 0 0 L 10 10 Z");
    expect(paths[0].fill).toBe("#111111");
    expect(meta.viewBox).toBe("0 0 100 100");
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(100);
  });

  it("falls back to viewBox dimensions when width/height are absent", () => {
    const { meta } = parseSvg(`<svg viewBox="0 0 640 480"><path d="M 0 0"/></svg>`);
    expect(meta.width).toBe(640);
    expect(meta.height).toBe(480);
  });
});
