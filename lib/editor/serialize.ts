import type { SVGPath } from "@/stores/editorStore";

/**
 * The canonical editor -> file serialisation.
 *
 * Lives in lib/ rather than in the canvas component because it is also the
 * definition of "what is currently on screen": the editor compares this exact
 * output against the version it loaded to decide whether anything actually
 * changed, and therefore whether a save is needed at all.
 */
export function serializeSvg(
  paths: SVGPath[],
  viewBox: string,
  width: number,
  height: number,
): string {
  const pathEls = paths
    .map(
      (p) =>
        `<path id="${p.id}" d="${p.d}" fill="${p.fill}" fill-rule="${p.fillRule}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linecap="${p.strokeLinecap}" stroke-linejoin="${p.strokeLinejoin}" opacity="${p.opacity}" />`,
    )
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">\n${pathEls}\n</svg>`;
}
