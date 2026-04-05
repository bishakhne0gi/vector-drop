/**
 * One-shot script: convert public/stairs.png → public/vectors/stairs.svg
 * Uses the same pipeline as the app: quantize → trace → assemble
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── load conversion modules (compiled TS via tsx) ────────────────────────────
const { quantizeColors } = await import(resolve(root, "lib/conversion/quantize.ts"));
const { traceColorMask } = await import(resolve(root, "lib/conversion/maskTrace.ts"));
const { assembleSvg }    = await import(resolve(root, "lib/conversion/assembleSvg.ts"));

const inputPath  = resolve(root, "public/stairs.png");
const outputPath = resolve(root, "public/vectors/stairs.svg");

console.log("Reading", inputPath);
const imageBuffer = readFileSync(inputPath);

// B&W image — 8 shades captures all tonal variation
const COLOR_COUNT = 8;

console.log(`Quantizing to ${COLOR_COUNT} colors…`);
const { clusters, width, height } = await quantizeColors(imageBuffer, COLOR_COUNT);
console.log(`  → ${clusters.length} clusters, image ${width}×${height}px`);

console.log("Tracing color masks…");
const layers = [];
for (let i = 0; i < clusters.length; i++) {
  const { color, indices } = clusters[i];
  process.stdout.write(`  [${i + 1}/${clusters.length}] rgb(${color.join(",")}) — ${indices.length} px … `);
  const pathD = await traceColorMask(width, height, indices, width * height);
  if (pathD) {
    layers.push({ pathD, color });
    process.stdout.write("ok\n");
  } else {
    process.stdout.write("skip (empty)\n");
  }
}

console.log(`Assembling SVG (${layers.length} layers)…`);
const svg = assembleSvg(layers, width, height);

writeFileSync(outputPath, svg);
console.log("✓ Saved to", outputPath);
console.log(`  SVG size: ${(svg.length / 1024).toFixed(1)} KB`);
