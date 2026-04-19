// ─── Anchor-based path model ────────────────────────────────────────────────
//
// SVG path `d` strings are a sequence of drawing commands. For interactive
// editing we need a denser, anchor-centric representation: each anchor holds
// its own point plus optional in/out handles (absolute coordinates) that
// determine the bezier shape of the segment arriving/leaving it.
//
// We support M, L, H, V, C, S, Q, T, Z (both absolute and relative). Arcs (A)
// are intentionally not first-class — we pass their raw tokens through as an
// opaque `L`-to segment which means arcs get flattened to straight lines on
// round-trip. Traced SVG output from our pipeline does not emit arcs, so this
// is an acceptable simplification.

export interface Point {
  x: number;
  y: number;
}

export interface Anchor {
  id: string;
  point: Point;
  /** Incoming handle (absolute). null = no curve on the segment ending here. */
  inHandle: Point | null;
  /** Outgoing handle (absolute). null = no curve on the segment leaving here. */
  outHandle: Point | null;
}

export interface Subpath {
  anchors: Anchor[];
  closed: boolean;
}

// ─── Tokeniser ──────────────────────────────────────────────────────────────

const CMD_RE = /[MmLlHhVvCcSsQqTtZzAa]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

function tokenize(d: string): string[] {
  return d.match(CMD_RE) ?? [];
}

function isCommand(t: string): boolean {
  return /^[MmLlHhVvCcSsQqTtZzAa]$/.test(t);
}

// ─── Parse ──────────────────────────────────────────────────────────────────

let anchorCounter = 0;
function nextId(): string {
  anchorCounter = (anchorCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `a${anchorCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export function parsePath(d: string): Subpath[] {
  const tokens = tokenize(d);
  const subpaths: Subpath[] = [];
  let current: Subpath | null = null;

  let i = 0;
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let lastCmd = "";
  let lastC2: Point | null = null; // previous C/S control-2 (for S reflection)
  let lastQ1: Point | null = null; // previous Q/T control-1 (for T reflection)

  const num = () => parseFloat(tokens[i++]);

  function ensureSubpath(): Subpath {
    if (!current) {
      current = { anchors: [], closed: false };
      subpaths.push(current);
    }
    return current;
  }

  function pushAnchor(pt: Point): Anchor {
    const sp = ensureSubpath();
    const a: Anchor = { id: nextId(), point: pt, inHandle: null, outHandle: null };
    sp.anchors.push(a);
    return a;
  }

  while (i < tokens.length) {
    let tok = tokens[i];
    let cmd: string;
    if (isCommand(tok)) {
      cmd = tok;
      i++;
    } else {
      // Implicit continuation: repeat last command, with M→L promotion.
      if (!lastCmd) break;
      cmd = lastCmd === "M" ? "L" : lastCmd === "m" ? "l" : lastCmd;
    }

    const abs = cmd === cmd.toUpperCase();

    switch (cmd.toUpperCase()) {
      case "M": {
        const x = num();
        const y = num();
        const nx = abs ? x : cx + x;
        const ny = abs ? y : cy + y;
        // M starts a new subpath.
        current = { anchors: [], closed: false };
        subpaths.push(current);
        pushAnchor({ x: nx, y: ny });
        cx = nx;
        cy = ny;
        startX = nx;
        startY = ny;
        lastC2 = null;
        lastQ1 = null;
        break;
      }
      case "L": {
        const x = num();
        const y = num();
        const nx = abs ? x : cx + x;
        const ny = abs ? y : cy + y;
        pushAnchor({ x: nx, y: ny });
        cx = nx;
        cy = ny;
        lastC2 = null;
        lastQ1 = null;
        break;
      }
      case "H": {
        const x = num();
        const nx = abs ? x : cx + x;
        pushAnchor({ x: nx, y: cy });
        cx = nx;
        lastC2 = null;
        lastQ1 = null;
        break;
      }
      case "V": {
        const y = num();
        const ny = abs ? y : cy + y;
        pushAnchor({ x: cx, y: ny });
        cy = ny;
        lastC2 = null;
        lastQ1 = null;
        break;
      }
      case "C": {
        const x1 = num();
        const y1 = num();
        const x2 = num();
        const y2 = num();
        const x = num();
        const y = num();
        const c1 = { x: abs ? x1 : cx + x1, y: abs ? y1 : cy + y1 };
        const c2 = { x: abs ? x2 : cx + x2, y: abs ? y2 : cy + y2 };
        const nx = abs ? x : cx + x;
        const ny = abs ? y : cy + y;
        const sp = ensureSubpath();
        const prev = sp.anchors[sp.anchors.length - 1];
        if (prev) prev.outHandle = c1;
        const a = pushAnchor({ x: nx, y: ny });
        a.inHandle = c2;
        cx = nx;
        cy = ny;
        lastC2 = c2;
        lastQ1 = null;
        break;
      }
      case "S": {
        const x2 = num();
        const y2 = num();
        const x = num();
        const y = num();
        const c2 = { x: abs ? x2 : cx + x2, y: abs ? y2 : cy + y2 };
        const nx = abs ? x : cx + x;
        const ny = abs ? y : cy + y;
        // c1 = reflection of previous C/S c2 over current point; else current point.
        const c1 = lastC2
          ? { x: 2 * cx - lastC2.x, y: 2 * cy - lastC2.y }
          : { x: cx, y: cy };
        const sp = ensureSubpath();
        const prev = sp.anchors[sp.anchors.length - 1];
        if (prev) prev.outHandle = c1;
        const a = pushAnchor({ x: nx, y: ny });
        a.inHandle = c2;
        cx = nx;
        cy = ny;
        lastC2 = c2;
        lastQ1 = null;
        break;
      }
      case "Q": {
        // Convert quadratic Q to cubic C for uniformity: c1 = P0 + 2/3*(Q1-P0), c2 = P3 + 2/3*(Q1-P3).
        const qx = num();
        const qy = num();
        const x = num();
        const y = num();
        const q1 = { x: abs ? qx : cx + qx, y: abs ? qy : cy + qy };
        const nx = abs ? x : cx + x;
        const ny = abs ? y : cy + y;
        const c1 = { x: cx + (2 / 3) * (q1.x - cx), y: cy + (2 / 3) * (q1.y - cy) };
        const c2 = { x: nx + (2 / 3) * (q1.x - nx), y: ny + (2 / 3) * (q1.y - ny) };
        const sp = ensureSubpath();
        const prev = sp.anchors[sp.anchors.length - 1];
        if (prev) prev.outHandle = c1;
        const a = pushAnchor({ x: nx, y: ny });
        a.inHandle = c2;
        cx = nx;
        cy = ny;
        lastC2 = null;
        lastQ1 = q1;
        break;
      }
      case "T": {
        const x = num();
        const y = num();
        const q1: Point = lastQ1
          ? { x: 2 * cx - lastQ1.x, y: 2 * cy - lastQ1.y }
          : { x: cx, y: cy };
        const nx = abs ? x : cx + x;
        const ny = abs ? y : cy + y;
        const c1 = { x: cx + (2 / 3) * (q1.x - cx), y: cy + (2 / 3) * (q1.y - cy) };
        const c2 = { x: nx + (2 / 3) * (q1.x - nx), y: ny + (2 / 3) * (q1.y - ny) };
        const sp = ensureSubpath();
        const prev = sp.anchors[sp.anchors.length - 1];
        if (prev) prev.outHandle = c1;
        const a = pushAnchor({ x: nx, y: ny });
        a.inHandle = c2;
        cx = nx;
        cy = ny;
        lastC2 = null;
        lastQ1 = q1;
        break;
      }
      case "A": {
        // Flatten arcs to a straight line to the end point. We don't edit arcs.
        /* rx */ num(); /* ry */ num(); /* rot */ num(); /* lf */ num(); /* sf */ num();
        const x = num();
        const y = num();
        const nx = abs ? x : cx + x;
        const ny = abs ? y : cy + y;
        pushAnchor({ x: nx, y: ny });
        cx = nx;
        cy = ny;
        lastC2 = null;
        lastQ1 = null;
        break;
      }
      case "Z": {
        if (current) {
          current.closed = true;
          // If the last anchor equals the starting point, drop it — Z implies it.
          const last = current.anchors[current.anchors.length - 1];
          const first = current.anchors[0];
          if (
            current.anchors.length > 1 &&
            last &&
            first &&
            Math.abs(last.point.x - first.point.x) < 1e-6 &&
            Math.abs(last.point.y - first.point.y) < 1e-6 &&
            last.inHandle === null
          ) {
            current.anchors.pop();
          }
        }
        cx = startX;
        cy = startY;
        lastC2 = null;
        lastQ1 = null;
        current = null;
        break;
      }
    }
    lastCmd = cmd;
  }

  return subpaths;
}

// ─── Serialize ──────────────────────────────────────────────────────────────

function fmt(n: number): string {
  // Clamp silly precision but keep enough for pixel-accurate round-trip.
  const r = Math.round(n * 1000) / 1000;
  return String(r);
}

export function serializePath(subpaths: Subpath[]): string {
  const out: string[] = [];

  for (const sp of subpaths) {
    if (sp.anchors.length === 0) continue;
    const first = sp.anchors[0];
    out.push(`M ${fmt(first.point.x)} ${fmt(first.point.y)}`);

    for (let i = 1; i < sp.anchors.length; i++) {
      const prev = sp.anchors[i - 1];
      const curr = sp.anchors[i];
      const hasCurve = prev.outHandle !== null || curr.inHandle !== null;
      if (hasCurve) {
        const c1 = prev.outHandle ?? prev.point;
        const c2 = curr.inHandle ?? curr.point;
        out.push(
          `C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(curr.point.x)} ${fmt(curr.point.y)}`,
        );
      } else {
        out.push(`L ${fmt(curr.point.x)} ${fmt(curr.point.y)}`);
      }
    }

    if (sp.closed && sp.anchors.length > 1) {
      // Closing segment back to first anchor may also be a curve.
      const last = sp.anchors[sp.anchors.length - 1];
      const hasCurve = last.outHandle !== null || first.inHandle !== null;
      if (hasCurve) {
        const c1 = last.outHandle ?? last.point;
        const c2 = first.inHandle ?? first.point;
        out.push(
          `C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(first.point.x)} ${fmt(first.point.y)}`,
        );
      }
      out.push("Z");
    }
  }

  return out.join(" ");
}

// ─── Editing helpers ────────────────────────────────────────────────────────

/** Cubic bezier sample at t ∈ [0,1] between two anchors. */
export function sampleCubic(prev: Anchor, curr: Anchor, t: number): Point {
  const p0 = prev.point;
  const p1 = prev.outHandle ?? prev.point;
  const p2 = curr.inHandle ?? curr.point;
  const p3 = curr.point;
  const mt = 1 - t;
  const b0 = mt * mt * mt;
  const b1 = 3 * mt * mt * t;
  const b2 = 3 * mt * t * t;
  const b3 = t * t * t;
  return {
    x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
    y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
  };
}

/** De Casteljau split of the segment between prev→curr at t. Returns the new
 *  mid-anchor and mutated copies of prev/curr with updated handles. */
export function splitSegment(
  prev: Anchor,
  curr: Anchor,
  t: number,
): { prev: Anchor; mid: Anchor; curr: Anchor } {
  const p0 = prev.point;
  const p1 = prev.outHandle ?? prev.point;
  const p2 = curr.inHandle ?? curr.point;
  const p3 = curr.point;

  const q0 = lerp(p0, p1, t);
  const q1 = lerp(p1, p2, t);
  const q2 = lerp(p2, p3, t);
  const r0 = lerp(q0, q1, t);
  const r1 = lerp(q1, q2, t);
  const mid = lerp(r0, r1, t);

  const hasCurve = prev.outHandle !== null || curr.inHandle !== null;

  return {
    prev: { ...prev, outHandle: hasCurve ? q0 : null },
    mid: {
      id: nextId(),
      point: mid,
      inHandle: hasCurve ? r0 : null,
      outHandle: hasCurve ? r1 : null,
    },
    curr: { ...curr, inHandle: hasCurve ? q2 : null },
  };
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Distance from point p to cubic bezier segment, sampled. Returns {t, dist}. */
export function closestTOnSegment(
  prev: Anchor,
  curr: Anchor,
  p: Point,
  samples = 32,
): { t: number; dist: number; point: Point } {
  let bestT = 0;
  let bestDist = Infinity;
  let bestPoint = prev.point;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = sampleCubic(prev, curr, t);
    const dx = pt.x - p.x;
    const dy = pt.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      bestT = t;
      bestPoint = pt;
    }
  }
  return { t: bestT, dist: Math.sqrt(bestDist), point: bestPoint };
}
