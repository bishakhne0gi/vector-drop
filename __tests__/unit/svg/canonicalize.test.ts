import { describe, it, expect } from "vitest";
import { canonicalizeSvg, computeSvgHash } from "@/lib/svg/canonicalize";

const BASE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path id="path-1" d="M 10 10 L 90 90 Z" fill="#ff0000" stroke="none" stroke-width="2" opacity="1" />
</svg>`;

describe("computeSvgHash — stability", () => {
  it("is deterministic across repeated calls", () => {
    expect(computeSvgHash(BASE)).toBe(computeSvgHash(BASE));
  });

  it("ignores element ids", () => {
    // The editor generates ids when parsing; they must never cost a credit.
    const renamed = BASE.replace('id="path-1"', 'id="path-1-a9f3k2"');
    expect(computeSvgHash(renamed)).toBe(computeSvgHash(BASE));
  });

  it("ignores attribute order", () => {
    const reordered = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" height="100" width="100">
  <path opacity="1" stroke-width="2" stroke="none" fill="#ff0000" d="M 10 10 L 90 90 Z" id="path-1" />
</svg>`;
    expect(computeSvgHash(reordered)).toBe(computeSvgHash(BASE));
  });

  it("ignores whitespace and indentation", () => {
    const compact =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
      `<path id="path-1" d="M 10 10 L 90 90 Z" fill="#ff0000" stroke="none" stroke-width="2" opacity="1"/></svg>`;
    expect(computeSvgHash(compact)).toBe(computeSvgHash(BASE));
  });

  it("ignores float drift below the precision threshold", () => {
    // Pan/zoom round-trips introduce trailing-digit noise. This is the exact
    // case that would otherwise double-charge a user who changed nothing.
    const drifted = BASE.replace("M 10 10 L 90 90 Z", "M 10.0000001 9.9999998 L 90 90.0000004 Z");
    expect(computeSvgHash(drifted)).toBe(computeSvgHash(BASE));
  });

  it("ignores hex colour casing", () => {
    const upper = BASE.replace('fill="#ff0000"', 'fill="#FF0000"');
    expect(computeSvgHash(upper)).toBe(computeSvgHash(BASE));
  });

  it("ignores class and data-* attributes", () => {
    const decorated = BASE.replace(
      'id="path-1"',
      'id="path-1" class="selected" data-layer="3"',
    );
    expect(computeSvgHash(decorated)).toBe(computeSvgHash(BASE));
  });

  it("normalises -0 to 0", () => {
    const negZero = BASE.replace("M 10 10", "M -0 10");
    const posZero = BASE.replace("M 10 10", "M 0 10");
    expect(computeSvgHash(negZero)).toBe(computeSvgHash(posZero));
  });
});

describe("computeSvgHash — sensitivity", () => {
  it("changes when geometry changes", () => {
    const moved = BASE.replace("L 90 90", "L 80 90");
    expect(computeSvgHash(moved)).not.toBe(computeSvgHash(BASE));
  });

  it("changes when fill changes", () => {
    const recoloured = BASE.replace('fill="#ff0000"', 'fill="#00ff00"');
    expect(computeSvgHash(recoloured)).not.toBe(computeSvgHash(BASE));
  });

  it("changes when opacity changes", () => {
    const faded = BASE.replace('opacity="1"', 'opacity="0.5"');
    expect(computeSvgHash(faded)).not.toBe(computeSvgHash(BASE));
  });

  it("changes when stroke-width changes", () => {
    const thick = BASE.replace('stroke-width="2"', 'stroke-width="4"');
    expect(computeSvgHash(thick)).not.toBe(computeSvgHash(BASE));
  });

  it("changes when a path is added", () => {
    const extra = BASE.replace("</svg>", `<path d="M 0 0 L 5 5 Z" fill="#000000" /></svg>`);
    expect(computeSvgHash(extra)).not.toBe(computeSvgHash(BASE));
  });

  it("changes when path order changes", () => {
    const two = `<svg viewBox="0 0 10 10"><path d="M 0 0 L 1 1" fill="#111111"/><path d="M 2 2 L 3 3" fill="#222222"/></svg>`;
    const swapped = `<svg viewBox="0 0 10 10"><path d="M 2 2 L 3 3" fill="#222222"/><path d="M 0 0 L 1 1" fill="#111111"/></svg>`;
    expect(computeSvgHash(two)).not.toBe(computeSvgHash(swapped));
  });

  it("does not corrupt colours that are all digits", () => {
    // Regression guard: naive number-rounding over every attribute would turn
    // #000000 into #0 and collide black with other colours.
    const black = BASE.replace('fill="#ff0000"', 'fill="#000000"');
    const nearBlack = BASE.replace('fill="#ff0000"', 'fill="#000001"');
    expect(canonicalizeSvg(black)).toContain('fill="#000000"');
    expect(computeSvgHash(black)).not.toBe(computeSvgHash(nearBlack));
  });
});

describe("canonicalizeSvg — robustness", () => {
  it("returns a deterministic value for malformed input", () => {
    const broken = "<svg><path d='M 0 0' ";
    expect(canonicalizeSvg(broken)).toBe(canonicalizeSvg(broken));
    expect(computeSvgHash(broken)).toBe(computeSvgHash(broken));
  });

  it("handles nested groups", () => {
    const nested = `<svg viewBox="0 0 10 10"><g opacity="0.5"><path d="M 0 0 L 1 1" fill="#abcdef"/></g></svg>`;
    expect(computeSvgHash(nested)).toBe(computeSvgHash(nested));
    expect(canonicalizeSvg(nested)).toContain("<g");
  });
});
