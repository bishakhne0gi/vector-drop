/**
 * K-means++ color quantization on raw image pixels — LAB color space edition.
 *
 * Preprocessing:
 *   - Resize to max 2048 px (fit inside) via Sharp
 *   - Flatten transparency onto white; NO blur (blur destroys edge definition)
 *   - Extract raw RGB triples, convert all pixels to CIE LAB before clustering
 *
 * K-means++:
 *   - Sample up to 100 000 pixels evenly when the image is larger
 *   - Smart initialisation: first centroid random, subsequent ones chosen
 *     with probability ∝ squared Euclidean distance in LAB space (≈ perceptual ΔE)
 *   - Max 50 iterations; early-stop when total centroid drift < 0.5
 *   - After clustering the sample, re-assign ALL pixels to the nearest centroid
 *     so that `indices` covers the full image
 *
 * Centroids are stored in LAB space during clustering; the returned `color` field
 * is converted back to RGB (potrace fill values must be RGB).
 *
 * Output clusters are sorted dark→light (by luminance) so that SVG layers stack
 * correctly when rendered in order.
 */

import { rgbToLab, labToRgb } from "./colorSpace";

export interface ColorCluster {
  color: [number, number, number]; // RGB centroid
  indices: Uint32Array; // pixel indices (into the full-image pixel array) assigned to this cluster
}

export async function quantizeColors(
  imageBuffer: Buffer,
  colorCount: number,
): Promise<{ clusters: ColorCluster[]; width: number; height: number }> {
  const sharp = (await import("sharp")).default;

  // ── 1. Pre-process ──────────────────────────────────────────────────────────
  const { data, info } = await sharp(imageBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  if (channels < 3) {
    throw new Error(`quantizeColors: expected at least 3 channels, got ${channels}`);
  }

  const totalPixels = width * height;

  // ── 2. Convert all pixels to LAB ─────────────────────────────────────────────
  // labPixels: Float32Array of [L, a, b] triples, length = totalPixels * 3
  const labPixels = new Float32Array(totalPixels * 3);
  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const [L, a, bLab] = rgbToLab(r, g, b);
    labPixels[i * 3]     = L;
    labPixels[i * 3 + 1] = a;
    labPixels[i * 3 + 2] = bLab;
  }

  // ── 3. Sample up to 100 000 pixels evenly ────────────────────────────────────
  const MAX_SAMPLE = 100_000;
  let sampleIndices: number[];
  if (totalPixels <= MAX_SAMPLE) {
    sampleIndices = Array.from({ length: totalPixels }, (_, i) => i);
  } else {
    const step = totalPixels / MAX_SAMPLE;
    sampleIndices = Array.from({ length: MAX_SAMPLE }, (_, i) => Math.floor(i * step));
  }

  const nSampled = sampleIndices.length;

  // Helper: squared Euclidean distance in LAB space (≈ perceptual ΔE²)
  function sqDistLab(
    L1: number, a1: number, b1: number,
    L2: number, a2: number, b2: number,
  ): number {
    const dL = L1 - L2;
    const da = a1 - a2;
    const db = b1 - b2;
    return dL * dL + da * da + db * db;
  }

  // ── 4. K-means++ initialisation in LAB space ─────────────────────────────────
  // centroidsLab: [L, a, b] per centroid
  const centroidsLab: [number, number, number][] = [];

  const firstIdx = sampleIndices[Math.floor(Math.random() * nSampled)];
  centroidsLab.push([
    labPixels[firstIdx * 3],
    labPixels[firstIdx * 3 + 1],
    labPixels[firstIdx * 3 + 2],
  ]);

  for (let k = 1; k < colorCount; k++) {
    const dists = new Float64Array(nSampled);
    let sumD = 0;
    for (let s = 0; s < nSampled; s++) {
      const pi = sampleIndices[s];
      const pL = labPixels[pi * 3];
      const pa = labPixels[pi * 3 + 1];
      const pb = labPixels[pi * 3 + 2];
      let minD = Infinity;
      for (const [cL, ca, cb] of centroidsLab) {
        const d = sqDistLab(pL, pa, pb, cL, ca, cb);
        if (d < minD) minD = d;
      }
      dists[s] = minD;
      sumD += minD;
    }

    // Pick next centroid with probability ∝ D²
    let rand = Math.random() * sumD;
    let chosen = nSampled - 1;
    for (let s = 0; s < nSampled; s++) {
      rand -= dists[s];
      if (rand <= 0) {
        chosen = s;
        break;
      }
    }
    const ci = sampleIndices[chosen];
    centroidsLab.push([
      labPixels[ci * 3],
      labPixels[ci * 3 + 1],
      labPixels[ci * 3 + 2],
    ]);
  }

  // ── 5. K-means iterations (on sample, in LAB space) ──────────────────────────
  const MAX_ITER = 50;
  const EARLY_STOP_DELTA = 0.5;
  const assignments = new Int32Array(nSampled);

  for (let iter = 0; iter < MAX_ITER; iter++) {
    // Assign
    for (let s = 0; s < nSampled; s++) {
      const pi = sampleIndices[s];
      const pL = labPixels[pi * 3];
      const pa = labPixels[pi * 3 + 1];
      const pb = labPixels[pi * 3 + 2];
      let minD = Infinity;
      let bestK = 0;
      for (let k = 0; k < colorCount; k++) {
        const [cL, ca, cb] = centroidsLab[k];
        const d = sqDistLab(pL, pa, pb, cL, ca, cb);
        if (d < minD) {
          minD = d;
          bestK = k;
        }
      }
      assignments[s] = bestK;
    }

    // Recompute centroids
    const sums = Array.from({ length: colorCount }, () => [0, 0, 0, 0]); // L,a,b,count
    for (let s = 0; s < nSampled; s++) {
      const k = assignments[s];
      const pi = sampleIndices[s];
      sums[k][0] += labPixels[pi * 3];
      sums[k][1] += labPixels[pi * 3 + 1];
      sums[k][2] += labPixels[pi * 3 + 2];
      sums[k][3]++;
    }

    let totalDelta = 0;
    for (let k = 0; k < colorCount; k++) {
      const count = sums[k][3] || 1;
      const newL = sums[k][0] / count;
      const newA = sums[k][1] / count;
      const newB = sums[k][2] / count;
      const [oldL, oldA, oldB] = centroidsLab[k];
      totalDelta += Math.abs(newL - oldL) + Math.abs(newA - oldA) + Math.abs(newB - oldB);
      centroidsLab[k] = [newL, newA, newB];
    }

    if (totalDelta < EARLY_STOP_DELTA) break;
  }

  // ── 6. Re-assign ALL pixels to nearest centroid ──────────────────────────────
  const clusterLists: number[][] = Array.from({ length: colorCount }, () => []);

  for (let i = 0; i < totalPixels; i++) {
    const pL = labPixels[i * 3];
    const pa = labPixels[i * 3 + 1];
    const pb = labPixels[i * 3 + 2];
    let minD = Infinity;
    let bestK = 0;
    for (let k = 0; k < colorCount; k++) {
      const [cL, ca, cb] = centroidsLab[k];
      const d = sqDistLab(pL, pa, pb, cL, ca, cb);
      if (d < minD) {
        minD = d;
        bestK = k;
      }
    }
    clusterLists[bestK].push(i);
  }

  // ── 7. Convert centroids back to RGB for the color field ─────────────────────
  const clusters: ColorCluster[] = centroidsLab.map(([L, a, b], k) => ({
    color: labToRgb(L, a, b),
    indices: new Uint32Array(clusterLists[k]),
  }));

  // ── 8. Sort dark→light by luminance (BT.601) ─────────────────────────────────
  clusters.sort((a, b) => {
    const lumA = 0.299 * a.color[0] + 0.587 * a.color[1] + 0.114 * a.color[2];
    const lumB = 0.299 * b.color[0] + 0.587 * b.color[1] + 0.114 * b.color[2];
    return lumA - lumB;
  });

  return { clusters, width, height };
}
