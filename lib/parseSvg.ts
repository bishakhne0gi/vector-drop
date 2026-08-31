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

  // Ids must be deterministic: parsing the same SVG twice has to produce the
  // same ids, because serializeSvg writes them back into the saved file and the
  // file's content hash decides whether an export is a new (chargeable) version.
  // A random suffix here would make byte-identical artwork hash differently on
  // every editor session. Collisions with author-supplied ids are avoided by
  // reserving those first and skipping them while numbering.
  const takenIds = new Set(
    Array.from(pathEls)
      .map((el) => el.getAttribute("id"))
      .filter((v): v is string => !!v && v.trim() !== ""),
  );

  let counter = 0;
  const nextGeneratedId = (): string => {
    let candidate: string;
    do {
      candidate = `path-${++counter}`;
    } while (takenIds.has(candidate));
    takenIds.add(candidate);
    return candidate;
  };

  const paths: SVGPath[] = Array.from(pathEls).map((el) => {
    const rawId = el.getAttribute("id");
    const id = rawId && rawId.trim() !== "" ? rawId : nextGeneratedId();

    const lc = el.getAttribute("stroke-linecap") ?? "round";
    const lj = el.getAttribute("stroke-linejoin") ?? "round";
    // Default to the SVG spec's own default rather than to evenodd: a path that
    // genuinely omits the attribute must keep rendering as nonzero.
    const fr = el.getAttribute("fill-rule") ?? "nonzero";
    return {
      id,
      d: el.getAttribute("d") ?? "",
      fill: el.getAttribute("fill") ?? "none",
      fillRule: (fr === "evenodd" ? "evenodd" : "nonzero") as SVGPath["fillRule"],
      stroke: el.getAttribute("stroke") ?? "none",
      strokeWidth: parseFloat(el.getAttribute("stroke-width") ?? "2") || 2,
      strokeLinecap: (["butt", "round", "square"].includes(lc) ? lc : "round") as SVGPath["strokeLinecap"],
      strokeLinejoin: (["miter", "round", "bevel"].includes(lj) ? lj : "round") as SVGPath["strokeLinejoin"],
      opacity: parseFloat(el.getAttribute("opacity") ?? "1") || 1,
      visible: true,
      locked: false,
      name: id,
    };
  });

  return { paths, meta: { viewBox, width, height } };
}
