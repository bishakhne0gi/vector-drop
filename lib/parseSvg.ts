import type { SVGPath, SVGMeta } from "@/stores/editorStore";

/**
 * Parse an SVG string into SVGPath[] and SVGMeta.
 * Uses DOMParser — must only be called in a browser context.
 */
export function parseSvg(text: string): { paths: SVGPath[]; meta: SVGMeta } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  const viewBox = svgEl?.getAttribute("viewBox") ?? "0 0 800 600";
  const widthAttr = svgEl?.getAttribute("width");
  const heightAttr = svgEl?.getAttribute("height");

  const parseUnit = (val: string | null | undefined, fallback: number): number => {
    if (!val) return fallback;
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const vbParts = viewBox.split(/[\s,]+/).map(Number);
  const vbW = vbParts[2] ?? 800;
  const vbH = vbParts[3] ?? 600;

  const width = parseUnit(widthAttr, vbW);
  const height = parseUnit(heightAttr, vbH);

  const pathEls = doc.querySelectorAll("path");
  let counter = 0;

  const paths: SVGPath[] = Array.from(pathEls).map((el) => {
    const rawId = el.getAttribute("id");
    const id =
      rawId && rawId.trim() !== ""
        ? rawId
        : `path-${++counter}-${Math.random().toString(36).slice(2, 8)}`;

    const lc = el.getAttribute("stroke-linecap") ?? "round";
    const lj = el.getAttribute("stroke-linejoin") ?? "round";
    return {
      id,
      d: el.getAttribute("d") ?? "",
      fill: el.getAttribute("fill") ?? "none",
      stroke: el.getAttribute("stroke") ?? "none",
      strokeWidth: parseFloat(el.getAttribute("stroke-width") ?? "2") || 2,
      strokeLinecap: (["butt", "round", "square"].includes(lc) ? lc : "round") as SVGPath["strokeLinecap"],
      strokeLinejoin: (["miter", "round", "bevel"].includes(lj) ? lj : "round") as SVGPath["strokeLinejoin"],
      opacity: parseFloat(el.getAttribute("opacity") ?? "1") || 1,
    };
  });

  return { paths, meta: { viewBox, width, height } };
}
