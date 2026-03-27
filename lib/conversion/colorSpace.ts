/**
 * Perceptually-uniform CIE LAB color space conversions.
 *
 * Pipeline: sRGB → linear RGB → XYZ (D65) → CIE LAB
 * Inverse:  CIE LAB → XYZ (D65) → linear RGB → sRGB
 *
 * Clustering in LAB space uses Euclidean distance that approximates
 * perceptual ΔE, producing far more visually accurate color groupings
 * than raw RGB clustering.
 */

// D65 reference white
const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

function linearize(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function delinearize(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function labF(t: number): number {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

function labFInv(t: number): number {
  return t > 0.20689655172413793 /* cbrt(0.008856) */ ? t * t * t : (t - 16 / 116) / 7.787;
}

/**
 * Convert sRGB (0–255 each) to CIE LAB.
 * Returns [L (0–100), a (-128–127), b (-128–127)] approximately.
 */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // sRGB → linear RGB
  const rl = linearize(r / 255);
  const gl = linearize(g / 255);
  const bl = linearize(b / 255);

  // Linear RGB → XYZ (sRGB D65 matrix)
  const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;

  // XYZ → LAB
  const fx = labF(X / Xn);
  const fy = labF(Y / Yn);
  const fz = labF(Z / Zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);

  return [L, a, bLab];
}

/**
 * Convert CIE LAB back to sRGB (0–255 each), clamped and rounded.
 */
export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  // LAB → XYZ
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const X = labFInv(fx) * Xn;
  const Y = labFInv(fy) * Yn;
  const Z = labFInv(fz) * Zn;

  // XYZ → linear RGB (inverse of sRGB D65 matrix)
  const rl =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const gl = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
  const bl =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

  // Linear RGB → sRGB, clamp 0–1, scale to 0–255
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return [
    Math.round(delinearize(clamp(rl)) * 255),
    Math.round(delinearize(clamp(gl)) * 255),
    Math.round(delinearize(clamp(bl)) * 255),
  ];
}
