/**
 * Per-color binary mask creation and Potrace tracing.
 *
 * For a given set of pixel indices (from quantize.ts), this module:
 *   1. Builds a grayscale bitmap: 0 (black) at the cluster's pixels, 255 (white) elsewhere
 *   2. Dilates each black region by 1 pixel (8-connected) to close hairline gaps
 *      between adjacent color regions in the assembled SVG
 *   3. Converts the bitmap to a PNG via Sharp (potrace requires image file / PNG buffer)
 *   4. Calls potrace with high-quality settings
 *   5. Extracts the `d=` path attribute from the resulting SVG
 *
 * Returns null when potrace produces no path (empty / too-small region).
 */

import { trace as potraceTrace } from "potrace";

export async function traceColorMask(
  width: number,
  height: number,
  pixelIndices: Uint32Array,
  totalPixels: number,
): Promise<string | null> {
  // ── 1. Build grayscale mask buffer ──────────────────────────────────────────
  const mask = Buffer.alloc(totalPixels, 255); // fill white
  for (let i = 0; i < pixelIndices.length; i++) {
    mask[pixelIndices[i]] = 0; // black = this color's region
  }

  // ── 2. Dilate: expand each black region by 1 pixel (8-connected) ────────────
  // This closes the tiny white hairline gaps that appear between adjacent
  // color regions when the SVG layers are stacked.
  const dilated = Buffer.from(mask); // copy
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 0) {
        // Set all 8 neighbors to black in the dilated buffer
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              dilated[ny * width + nx] = 0;
            }
          }
        }
      }
    }
  }

  // ── 3. Convert dilated raw grayscale to PNG (potrace needs a decodable image) ─
  const sharp = (await import("sharp")).default;
  const pngBuffer = await sharp(dilated, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  // ── 4. Potrace ───────────────────────────────────────────────────────────────
  const svg = await new Promise<string>((resolve, reject) => {
    potraceTrace(
      pngBuffer,
      {
        threshold: 128,
        turdSize: 0,        // keep all regions, no matter how small
        alphaMax: 0.75,
        optCurve: true,
        optTolerance: 0.05, // tighter curve fitting (was 0.1)
      },
      (err: Error | null, result: string) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });

  // ── 5. Extract the d= attribute ─────────────────────────────────────────────
  const match = svg.match(/\bd="([^"]*)"/);
  if (!match || !match[1]) return null;

  const pathD = match[1].trim();
  return pathD.length > 0 ? pathD : null;
}
