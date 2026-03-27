/**
 * Assemble a multi-layer SVG from traced color layers.
 *
 * Layer ordering: dark→light (as produced by quantize.ts).
 * A background rect filled with white is inserted behind all path layers
 * so the SVG is fully opaque.
 *
 * shape-rendering="geometricPrecision" is set on the root element for
 * crisper edges at all zoom levels. fill-rule="evenodd" matches potrace's
 * even-odd winding convention.
 */

export function assembleSvg(
  layers: Array<{ pathD: string; color: [number, number, number] }>,
  width: number,
  height: number,
): string {
  if (layers.length === 0) {
    // Degenerate: return a blank white SVG
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="geometricPrecision"><rect width="${width}" height="${height}" fill="white"/></svg>`;
  }

  // White background — transparency was flattened onto white during preprocessing
  const bgFill = `white`;

  // Skip the lightest cluster as a path layer — it's essentially the background
  // (avoids a solid white rect covering everything)
  const lightness = (r: number, g: number, b: number) =>
    0.299 * r + 0.587 * g + 0.114 * b;
  const pathLayers = layers.filter(
    ({ color: [r, g, b] }) => lightness(r, g, b) < 240,
  );

  const pathElements = pathLayers
    .map(
      ({ pathD, color: [r, g, b] }) =>
        `  <path d="${pathD}" fill="rgb(${r},${g},${b})" fill-rule="evenodd" />`,
    )
    .join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="geometricPrecision">`,
    `  <rect width="${width}" height="${height}" fill="${bgFill}"/>`,
    pathElements,
    `</svg>`,
  ].join("\n");
}
