/**
 * Deterministic topographic-contour artwork for Open Graph images.
 *
 * The motif is not arbitrary decoration: nested closed contours are exactly what
 * VectorDrop produces when it traces a raster image. Each OG image therefore
 * carries a small piece of the product's own output.
 *
 * Everything is seeded from a string (usually the page slug), so a given page
 * always renders the identical shape — OG images are cached hard by social
 * platforms, and a shape that drifted between builds would look like a bug.
 */

/** Mulberry32 — small, fast, and stable across Node versions. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Harmonic = { k: number; amp: number; phase: number };

type BlobOptions = {
  cx: number;
  cy: number;
  /** Radius of the outermost ring. */
  radius: number;
  /** Number of nested rings. More rings reads as steeper terrain. */
  rings: number;
  /** Rotation of the whole form, in radians. */
  rotation: number;
  /** Horizontal squash — values below 1 elongate the blob vertically. */
  squash: number;
};

/**
 * Build one closed contour as an SVG path.
 *
 * The outline is a polar function r(t) perturbed by a few sine harmonics, which
 * is what gives the organic, map-like edge rather than a plain ellipse.
 * `inset` shrinks the ring toward the centre while drifting the harmonic phases
 * slightly, so inner rings are not merely scaled copies of the outer ones.
 */
function contourPath(
  o: BlobOptions,
  harmonics: Harmonic[],
  inset: number,
  segments = 220,
): string {
  const cos = Math.cos(o.rotation);
  const sin = Math.sin(o.rotation);
  const parts: string[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;

    // Inner rings pick up a touch more wobble, mimicking tighter elevation lines.
    const wobbleGain = 1 + inset * 0.55;
    let deviation = 0;
    for (const h of harmonics) {
      deviation += h.amp * wobbleGain * Math.sin(h.k * t + h.phase + inset * 0.9);
    }

    const r = o.radius * (1 - inset) * (1 + deviation);
    const px = Math.cos(t) * r * o.squash;
    const py = Math.sin(t) * r;

    const x = o.cx + px * cos - py * sin;
    const y = o.cy + px * sin + py * cos;

    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  parts.push("Z");
  return parts.join("");
}

/** One nested-contour form, returned as SVG `<path>` markup. */
function blob(seed: string, o: BlobOptions, stroke: string): string {
  const rand = mulberry32(hashString(seed));

  const harmonics: Harmonic[] = Array.from({ length: 4 }, (_, i) => ({
    k: 2 + i + Math.floor(rand() * 2),
    amp: (0.13 - i * 0.025) * (0.7 + rand() * 0.6),
    phase: rand() * Math.PI * 2,
  }));

  const paths: string[] = [];
  for (let ring = 0; ring < o.rings; ring++) {
    const inset = ring / o.rings;

    // Outer rings sit brightest; the falloff keeps the centre from going muddy.
    const opacity = (0.58 - inset * 0.38).toFixed(3);
    const width = (1.45 - inset * 0.5).toFixed(2);

    paths.push(
      `<path d="${contourPath(o, harmonics, inset * 0.86)}" fill="none" ` +
        `stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}" ` +
        `stroke-linejoin="round"/>`,
    );
  }

  return paths.join("");
}

export type ContourFieldOptions = {
  /** Seed string — pass the page slug so each page owns a distinct form. */
  seed: string;
  width: number;
  height: number;
  /** Stroke colour. Defaults to the dark-mode accent teal. */
  stroke?: string;
  /** Spacing of the vertical hairline texture, in px. Set 0 to omit it. */
  hairlineGap?: number;
};

/**
 * Vertical hairlines, as SVG lines rather than a tiled CSS gradient.
 *
 * Satori does not tile `background-size` reliably here, so a CSS approach
 * renders nothing at all. Emitting real lines is verifiable and cheap.
 */
function hairlines(width: number, height: number, gap: number): string {
  if (gap <= 0) return "";
  const lines: string[] = [];
  for (let x = gap; x < width; x += gap) {
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" ` +
        `stroke="#ffffff" stroke-width="1" stroke-opacity="0.05"/>`,
    );
  }
  return lines.join("");
}

/**
 * Render the full two-blob contour field as an SVG string.
 *
 * Returned as markup rather than JSX because Satori renders SVG far more
 * reliably through an `<img>` data URI than as inline elements.
 */
export function contourFieldSvg({
  seed,
  width,
  height,
  stroke = "#14b8a6",
  hairlineGap = 26,
}: ContourFieldOptions): string {
  const rand = mulberry32(hashString(`${seed}::layout`));

  // Top-left and bottom-right, mirroring the diagonal balance of the layout —
  // both are pushed partly off-canvas so they read as a crop of something larger.
  const topLeft = blob(
    `${seed}::a`,
    {
      cx: width * (0.17 + rand() * 0.06),
      cy: height * (0.1 + rand() * 0.06),
      radius: Math.min(width, height) * (0.29 + rand() * 0.05),
      rings: 26,
      rotation: (rand() - 0.5) * 1.4,
      squash: 0.78 + rand() * 0.2,
    },
    stroke,
  );

  const bottomRight = blob(
    `${seed}::b`,
    {
      cx: width * (0.84 + rand() * 0.05),
      cy: height * (0.87 + rand() * 0.06),
      radius: Math.min(width, height) * (0.31 + rand() * 0.05),
      rings: 28,
      rotation: (rand() - 0.5) * 1.4,
      squash: 0.72 + rand() * 0.22,
    },
    stroke,
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">` +
    `${hairlines(width, height, hairlineGap)}${topLeft}${bottomRight}</svg>`
  );
}

/** Same field, encoded as a data URI ready for `<img src>` inside Satori. */
export function contourFieldDataUri(options: ContourFieldOptions): string {
  const svg = contourFieldSvg(options);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
