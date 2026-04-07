/**
 * Standalone pre-conversion script.
 * Run with: npx tsx scripts/preconvert.ts
 *
 * Reads each source PNG from public/, runs the full conversion pipeline
 * (quantize → maskTrace → assembleSvg) with colorCount=24, and writes
 * the resulting SVG to public/vectors/.
 */

import fs from "fs";
import path from "path";
import { quantizeColors } from "../lib/conversion/quantize";
import { traceColorMask } from "../lib/conversion/maskTrace";
import { assembleSvg } from "../lib/conversion/assembleSvg";

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const VECTORS_DIR = path.join(PUBLIC_DIR, "vectors");
const COLOR_COUNT = 24;

const IMAGES: Array<{ src: string; dest: string }> = [
  { src: path.join(PUBLIC_DIR, "beigh.png"),  dest: path.join(VECTORS_DIR, "beigh.svg") },
  { src: path.join(PUBLIC_DIR, "flower.png"), dest: path.join(VECTORS_DIR, "flower.svg") },
  { src: path.join(PUBLIC_DIR, "planet.png"), dest: path.join(VECTORS_DIR, "planet.svg") },
  { src: path.join(PUBLIC_DIR, "yellow.png"), dest: path.join(VECTORS_DIR, "yellow.svg") },
];

async function convertImage(srcPath: string, destPath: string): Promise<void> {
  const label = path.basename(srcPath);
  console.log(`[${label}] Reading source image…`);

  const imageBuffer = fs.readFileSync(srcPath);

  // ── Step 1: Quantize ─────────────────────────────────────────────────────────
  console.log(`[${label}] Quantizing to ${COLOR_COUNT} colors…`);
  const { clusters, width, height } = await quantizeColors(imageBuffer, COLOR_COUNT);
  console.log(`[${label}] Image dimensions: ${width}x${height}, clusters: ${clusters.length}`);

  const totalPixels = width * height;

  // ── Step 2: Trace each color cluster mask ────────────────────────────────────
  console.log(`[${label}] Tracing ${clusters.length} color layers…`);
  const layers: Array<{ pathD: string; color: [number, number, number] }> = [];

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    const pathD = await traceColorMask(width, height, cluster.indices, totalPixels);
    if (pathD !== null) {
      layers.push({ pathD, color: cluster.color });
    }
    // Progress indicator every 4 layers
    if ((i + 1) % 4 === 0 || i === clusters.length - 1) {
      process.stdout.write(`\r[${label}] Traced ${i + 1}/${clusters.length} layers`);
    }
  }
  process.stdout.write("\n");
  console.log(`[${label}] ${layers.length}/${clusters.length} layers produced a path`);

  // ── Step 3: Assemble SVG ─────────────────────────────────────────────────────
  console.log(`[${label}] Assembling SVG…`);
  const svg = assembleSvg(layers, width, height);

  // ── Write output ─────────────────────────────────────────────────────────────
  fs.writeFileSync(destPath, svg, "utf8");
  const sizeKB = (fs.statSync(destPath).size / 1024).toFixed(1);
  console.log(`[${label}] Written → ${destPath} (${sizeKB} KB)\n`);
}

async function main(): Promise<void> {
  // Ensure output directory exists
  fs.mkdirSync(VECTORS_DIR, { recursive: true });

  const results: Array<{ name: string; sizeBytes: number; ok: boolean; error?: string }> = [];

  for (const { src, dest } of IMAGES) {
    const name = path.basename(src);
    if (!fs.existsSync(src)) {
      console.error(`SKIP: ${src} does not exist`);
      results.push({ name, sizeBytes: 0, ok: false, error: "source file not found" });
      continue;
    }

    const start = Date.now();
    try {
      await convertImage(src, dest);
      const sizeBytes = fs.statSync(dest).size;
      results.push({ name, sizeBytes, ok: true });
      console.log(`[${name}] Completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${name}] FAILED: ${message}`);
      results.push({ name, sizeBytes: 0, ok: false, error: message });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  for (const r of results) {
    if (r.ok) {
      console.log(`  ${r.name.padEnd(14)} → ${(r.sizeBytes / 1024).toFixed(1).padStart(8)} KB`);
    } else {
      console.log(`  ${r.name.padEnd(14)} → FAILED: ${r.error}`);
    }
  }

  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
