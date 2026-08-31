// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { parseSvg } from "@/lib/parseSvg";
import { serializeSvg } from "@/components/editor/EditorCanvas";

/**
 * Opening a conversion in the editor and saving it must not change how the
 * artwork renders.
 *
 * Regression: `fill-rule` was parsed away and never written back. Potrace emits
 * an outer contour and its holes as a single `d`, which is only correct under
 * even-odd winding, so every save silently re-rendered traced artwork as solid
 * blocks — the saved and downloaded file was corrupt, not just the preview.
 */
const TRACED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path fill="#fff" d="M0 0h100v100H0z"/><path fill="#040608" fill-rule="evenodd" d="M10 10h80v80H10zM30 30h40v40H30z"/></svg>`;

describe("editor round trip", () => {
  it("preserves fill-rule through parse → serialize", () => {
    const { paths, meta } = parseSvg(TRACED);
    expect(paths[1].fillRule).toBe("evenodd");

    const out = serializeSvg(paths, meta.viewBox, meta.width, meta.height);
    expect(out).toContain('fill-rule="evenodd"');
  });

  it("survives repeated round trips", () => {
    // Users open and save the same project many times; the attribute must not
    // decay after the first pass.
    const { paths, meta } = parseSvg(TRACED);
    let svg = serializeSvg(paths, meta.viewBox, meta.width, meta.height);
    for (let i = 0; i < 3; i++) {
      const again = parseSvg(svg);
      svg = serializeSvg(again.paths, again.meta.viewBox, again.meta.width, again.meta.height);
    }
    expect(parseSvg(svg).paths[1].fillRule).toBe("evenodd");
  });

  it("defaults to nonzero when the source omits fill-rule", () => {
    // The SVG spec's default. Assuming evenodd here would corrupt hand-authored
    // artwork in the opposite direction.
    const plain = `<svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z" fill="#000"/></svg>`;
    const { paths } = parseSvg(plain);
    expect(paths[0].fillRule).toBe("nonzero");
  });
});
