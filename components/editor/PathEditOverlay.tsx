"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore, type EditTool } from "@/stores/editorStore";
import {
  parsePath,
  serializePath,
  splitSegment,
  closestTOnSegment,
  type Subpath,
  type Anchor,
  type Point,
} from "@/lib/editor/pathModel";

interface Props {
  zoom: number;
  viewBox: string;
}

type DragKind =
  | { kind: "anchor"; sp: number; idx: number }
  | { kind: "in"; sp: number; idx: number }
  | { kind: "out"; sp: number; idx: number }
  | {
      // Figma-style segment bend: drag anywhere on a segment to deform it.
      // We record the original handles + click point so each pointermove
      // derives absolute handle positions from the total drag delta (no
      // accumulation error). b1/b2 are the Bernstein weights at t so the
      // drag point tracks the cursor exactly.
      kind: "bend";
      sp: number;
      endIdx: number;
      t: number;
      b1: number;
      b2: number;
      origPrevOut: Point | null;
      origCurrIn: Point | null;
      origPrevPt: Point;
      origCurrPt: Point;
      origClickPt: Point;
    };

// Editor selection is drawn in neutral grays so the teal accent can be
// reserved for the "Soon" / Icon Gen badge. Canvas background is always
// white, so we pick dark-grays that stay readable against it.
const ACCENT = "#6b7280";
const ACCENT_STRONG = "#1f2937";

// Custom scissors cursor so Cut mode reads unambiguously. Hotspot sits where
// the blades cross (12, 12) — i.e. the cutting point of the scissors.
const CUT_CURSOR = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <g stroke='white' stroke-width='4'>
      <circle cx='6' cy='7' r='3'/>
      <circle cx='6' cy='17' r='3'/>
      <line x1='8.5' y1='8.5' x2='22' y2='22'/>
      <line x1='8.5' y1='15.5' x2='22' y2='2'/>
    </g>
    <g stroke='black' stroke-width='1.6'>
      <circle cx='6' cy='7' r='3' fill='white'/>
      <circle cx='6' cy='17' r='3' fill='white'/>
      <line x1='8.5' y1='8.5' x2='22' y2='22'/>
      <line x1='8.5' y1='15.5' x2='22' y2='2'/>
    </g>
  </svg>`,
)}") 12 12, crosshair`;

export function PathEditOverlay({ zoom, viewBox }: Props) {
  const editingPathId = useEditorStore((s) => s.editingPathId);
  const editTool = useEditorStore((s) => s.editTool);
  const selectedAnchorKey = useEditorStore((s) => s.selectedAnchorKey);
  const setSelectedAnchor = useEditorStore((s) => s.setSelectedAnchor);
  const exitPathEdit = useEditorStore((s) => s.exitPathEdit);
  const paths = useEditorStore((s) => s.paths);
  const updatePath = useEditorStore((s) => s.updatePath);

  const path = editingPathId ? paths.find((p) => p.id === editingPathId) : null;

  // Local working copy: parse once, apply drags in-place, commit back to store
  // on drag end (single history entry per gesture).
  const [local, setLocal] = useState<Subpath[] | null>(null);

  useEffect(() => {
    if (!path) {
      setLocal(null);
      return;
    }
    setLocal(parsePath(path.d));
    // Re-parse when path id or raw d changes (undo, etc.)
  }, [path?.id, path?.d]);

  // Keyboard: Esc to exit, Delete/Backspace to cut selected anchor.
  useEffect(() => {
    if (!editingPathId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        exitPathEdit();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedAnchorKey) {
        e.preventDefault();
        cutSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPathId, selectedAnchorKey, local]);

  const drag = useRef<{ kind: DragKind; lastPt: Point } | null>(null);

  if (!path || !local) return null;

  // ─── Geometry helpers ─────────────────────────────────────────────────────

  function anchorKey(sp: number, a: Anchor): string {
    return `${sp}:${a.id}`;
  }

  function commit(next: Subpath[]) {
    if (!path) return;
    updatePath(path.id, { d: serializePath(next) });
  }

  function screenToSvg(e: React.PointerEvent<SVGElement>): Point {
    // Use the overlay SVG's CTM to map client coords to viewBox coords.
    const svg = e.currentTarget.ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
    const pt = (svg as SVGSVGElement).createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = (svg as SVGSVGElement).getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const out = pt.matrixTransform(inv);
    return { x: out.x, y: out.y };
  }

  // ─── Drag handlers ────────────────────────────────────────────────────────

  function onPointerDown(
    e: React.PointerEvent<SVGElement>,
    kind: DragKind,
  ) {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const pt = screenToSvg(e);
    drag.current = { kind, lastPt: pt };
    if (kind.kind === "anchor") {
      const a = local![kind.sp].anchors[kind.idx];
      setSelectedAnchor(anchorKey(kind.sp, a));
    }
  }

  function onPointerMove(e: React.PointerEvent<SVGElement>) {
    if (!drag.current || !local) return;
    const pt = screenToSvg(e);
    const { kind } = drag.current;

    if (kind.kind === "bend") {
      const delta = { x: pt.x - kind.origClickPt.x, y: pt.y - kind.origClickPt.y };
      const denom = kind.b1 * kind.b1 + kind.b2 * kind.b2;
      const k1 = kind.b1 / denom;
      const k2 = kind.b2 / denom;
      const basePrevOut = kind.origPrevOut ?? kind.origPrevPt;
      const baseCurrIn = kind.origCurrIn ?? kind.origCurrPt;
      const newPrevOut = {
        x: basePrevOut.x + delta.x * k1,
        y: basePrevOut.y + delta.y * k1,
      };
      const newCurrIn = {
        x: baseCurrIn.x + delta.x * k2,
        y: baseCurrIn.y + delta.y * k2,
      };
      const next = local.map((sp, i) => {
        if (i !== kind.sp) return sp;
        const startIdx =
          kind.endIdx === 0 ? sp.anchors.length - 1 : kind.endIdx - 1;
        const anchors = sp.anchors.map((a, j) => {
          if (j === startIdx) return { ...a, outHandle: newPrevOut };
          if (j === kind.endIdx) return { ...a, inHandle: newCurrIn };
          return a;
        });
        return { ...sp, anchors };
      });
      setLocal(next);
      return;
    }

    // kind is narrowed to anchor | in | out here (bend returned above).
    const k = kind;
    const dx = pt.x - drag.current.lastPt.x;
    const dy = pt.y - drag.current.lastPt.y;
    drag.current.lastPt = pt;

    const next = local.map((sp, i) => ({
      ...sp,
      anchors: sp.anchors.map((a, j) =>
        i === k.sp && j === k.idx
          ? applyDrag(a, k.kind, dx, dy)
          : a,
      ),
    }));
    setLocal(next);
  }

  function onPointerUp(e: React.PointerEvent<SVGElement>) {
    if (!drag.current || !local) return;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    drag.current = null;
    commit(local);
  }

  // Single-click on an anchor: select. Cut no longer targets anchors — it
  // targets the segment between two anchors, handled by the segment hit-path.
  function onAnchorClick(e: React.MouseEvent<SVGElement>, sp: number, idx: number) {
    e.stopPropagation();
    if (!local) return;
    const a = local[sp].anchors[idx];
    setSelectedAnchor(anchorKey(sp, a));
  }

  // Double-click an anchor: toggle between corner (no handles) and smooth (auto handles).
  function onAnchorDoubleClick(e: React.MouseEvent<SVGElement>, sp: number, idx: number) {
    e.stopPropagation();
    if (!local) return;
    const next = toggleAnchorType(local, sp, idx);
    setLocal(next);
    commit(next);
  }

  // Click on segment mid-line: insert an anchor there.
  function onSegmentClick(e: React.MouseEvent<SVGElement>, sp: number, endIdx: number) {
    e.stopPropagation();
    if (!local) return;
    if (editTool !== "add" && editTool !== "move") return;
    const pt = screenToSvg(e as unknown as React.PointerEvent<SVGElement>);
    const startIdx = endIdx === 0 ? local[sp].anchors.length - 1 : endIdx - 1;
    const prev = local[sp].anchors[startIdx];
    const curr = local[sp].anchors[endIdx];
    const { t } = closestTOnSegment(prev, curr, pt);
    const { prev: newPrev, mid, curr: newCurr } = splitSegment(prev, curr, t);

    const next = local.map((s, i) => {
      if (i !== sp) return s;
      const anchors = [...s.anchors];
      anchors[startIdx] = newPrev;
      anchors[endIdx] = newCurr;
      // Insert mid between startIdx and endIdx, respecting wrap-around.
      if (endIdx === 0) {
        anchors.push(mid);
      } else {
        anchors.splice(endIdx, 0, mid);
      }
      return { ...s, anchors };
    });
    setLocal(next);
    commit(next);
    setSelectedAnchor(anchorKey(sp, mid));
  }

  function cutSelected() {
    if (!selectedAnchorKey || !local) return;
    const [spStr, ...rest] = selectedAnchorKey.split(":");
    const anchorId = rest.join(":");
    const sp = parseInt(spStr, 10);
    const idx = local[sp]?.anchors.findIndex((a) => a.id === anchorId);
    if (idx === undefined || idx < 0) return;
    const next = cutAnchorAt(local, sp, idx);
    setLocal(next);
    commit(next);
    setSelectedAnchor(null);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // Dynamic handle sizes so they stay crisp regardless of canvas zoom.
  const hsz = 6 / zoom;     // anchor side length
  const csz = 4 / zoom;     // handle dot diameter
  const stroke = 1 / zoom;
  const segHitStroke = 10 / zoom;

  // A transparent hit-rect over the whole canvas so that clicking *off* an
  // anchor but inside the overlay doesn't exit edit mode (we intercept clicks
  // that reach the base container only).
  return (
    <svg
      viewBox={viewBox}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {local.map((sp, spIdx) => (
        <g key={spIdx} style={{ pointerEvents: "auto" }}>
          {/* Selection outline — draw the whole subpath in accent. */}
          <path
            d={serializePath([sp])}
            fill="none"
            stroke={ACCENT}
            strokeWidth={stroke * 1.25}
            style={{ pointerEvents: "none" }}
          />

          {/* Segment hit areas — mounted for Add (click to insert a point),
              Cut (slice the segment), and Bend (drag to curve the segment).
              Rendering a hit-path per anchor is expensive on dense paths, so
              we skip it when inert. */}
          {(editTool === "add" ||
            editTool === "cut" ||
            editTool === "bend") &&
            sp.anchors.map((a, idx) => {
              if (idx === 0 && !sp.closed) return null;
              const prevIdx = idx === 0 ? sp.anchors.length - 1 : idx - 1;
              const prev = sp.anchors[prevIdx];
              const segD = buildSegmentD(prev, a);
              return (
                <path
                  key={`seg-${idx}`}
                  d={segD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={segHitStroke}
                  style={{
                    cursor:
                      editTool === "cut"
                        ? CUT_CURSOR
                        : editTool === "bend"
                          ? "grab"
                          : "copy",
                    pointerEvents: "auto",
                  }}
                  onPointerDown={(e) => {
                    if (editTool === "cut") {
                      e.stopPropagation();
                      if (!local) return;
                      const next = cutSegmentAt(local, spIdx, idx);
                      setLocal(next);
                      commit(next);
                      setSelectedAnchor(null);
                      return;
                    }
                    if (editTool === "bend") {
                      e.stopPropagation();
                      if (!local) return;
                      (e.currentTarget as Element).setPointerCapture(e.pointerId);
                      const pt = screenToSvg(e);
                      const startIdx =
                        idx === 0 ? local[spIdx].anchors.length - 1 : idx - 1;
                      const prevA = local[spIdx].anchors[startIdx];
                      const currA = local[spIdx].anchors[idx];
                      const { t } = closestTOnSegment(prevA, currA, pt);
                      // Clamp t away from the endpoints so the bend weights
                      // stay well-conditioned (no div-by-near-zero).
                      const tc = Math.max(0.08, Math.min(0.92, t));
                      const u = 1 - tc;
                      const b1 = 3 * u * u * tc;
                      const b2 = 3 * u * tc * tc;
                      drag.current = {
                        kind: {
                          kind: "bend",
                          sp: spIdx,
                          endIdx: idx,
                          t: tc,
                          b1,
                          b2,
                          origPrevOut: prevA.outHandle,
                          origCurrIn: currA.inHandle,
                          origPrevPt: prevA.point,
                          origCurrPt: currA.point,
                          origClickPt: pt,
                        },
                        lastPt: pt,
                      };
                    }
                  }}
                  onClick={(e) => {
                    if (editTool === "add") onSegmentClick(e, spIdx, idx);
                  }}
                />
              );
            })}

          {/* Handles — only for the currently selected anchor. Showing them
              for every anchor at once (e.g. in Bend mode) spikes DOM cost and
              makes clicks on the anchor squares unreliable on dense paths. */}
          {sp.anchors.map((a, idx) => {
            const key = anchorKey(spIdx, a);
            const showHandles = selectedAnchorKey === key;
            if (!showHandles) return null;
            return (
              <g key={`h-${idx}`} style={{ pointerEvents: "auto" }}>
                {a.inHandle && (
                  <>
                    <line
                      x1={a.point.x}
                      y1={a.point.y}
                      x2={a.inHandle.x}
                      y2={a.inHandle.y}
                      stroke={ACCENT}
                      strokeWidth={stroke}
                      opacity={0.7}
                    />
                    <circle
                      cx={a.inHandle.x}
                      cy={a.inHandle.y}
                      r={csz}
                      fill="#fff"
                      stroke={ACCENT_STRONG}
                      strokeWidth={stroke}
                      style={{ cursor: "grab" }}
                      onPointerDown={(e) =>
                        onPointerDown(e, { kind: "in", sp: spIdx, idx })
                      }
                    />
                  </>
                )}
                {a.outHandle && (
                  <>
                    <line
                      x1={a.point.x}
                      y1={a.point.y}
                      x2={a.outHandle.x}
                      y2={a.outHandle.y}
                      stroke={ACCENT}
                      strokeWidth={stroke}
                      opacity={0.7}
                    />
                    <circle
                      cx={a.outHandle.x}
                      cy={a.outHandle.y}
                      r={csz}
                      fill="#fff"
                      stroke={ACCENT_STRONG}
                      strokeWidth={stroke}
                      style={{ cursor: "grab" }}
                      onPointerDown={(e) =>
                        onPointerDown(e, { kind: "out", sp: spIdx, idx })
                      }
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Anchor squares on top. */}
          {sp.anchors.map((a, idx) => {
            const key = anchorKey(spIdx, a);
            const sel = selectedAnchorKey === key;
            return (
              <rect
                key={`a-${idx}`}
                x={a.point.x - hsz / 2}
                y={a.point.y - hsz / 2}
                width={hsz}
                height={hsz}
                fill={sel ? ACCENT_STRONG : "#fff"}
                stroke={ACCENT_STRONG}
                strokeWidth={stroke}
                style={{
                  cursor:
                    editTool === "cut"
                      ? CUT_CURSOR
                      : editTool === "move"
                        ? "grab"
                        : editTool === "bend"
                          ? "grab"
                          : "pointer",
                  // In Cut and Bend modes the anchor square becomes inert so
                  // clicks fall through to the segment hit-paths beneath it.
                  pointerEvents:
                    editTool === "cut" || editTool === "bend" ? "none" : "auto",
                }}
                onPointerDown={(e) => {
                  onPointerDown(e, { kind: "anchor", sp: spIdx, idx });
                }}
                onClick={(e) => onAnchorClick(e, spIdx, idx)}
                onDoubleClick={(e) => onAnchorDoubleClick(e, spIdx, idx)}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

// ─── Pure helpers ────────────────────────────────────────────────────────────

function applyDrag(
  a: Anchor,
  kind: "anchor" | "in" | "out",
  dx: number,
  dy: number,
): Anchor {
  if (kind === "anchor") {
    return {
      ...a,
      point: { x: a.point.x + dx, y: a.point.y + dy },
      inHandle: a.inHandle ? { x: a.inHandle.x + dx, y: a.inHandle.y + dy } : null,
      outHandle: a.outHandle ? { x: a.outHandle.x + dx, y: a.outHandle.y + dy } : null,
    };
  }
  if (kind === "in" && a.inHandle) {
    const newIn = { x: a.inHandle.x + dx, y: a.inHandle.y + dy };
    // Mirror opposite handle to keep smooth curvature when the anchor has both.
    const newOut =
      a.outHandle !== null
        ? reflect(a.point, newIn)
        : a.outHandle;
    return { ...a, inHandle: newIn, outHandle: newOut };
  }
  if (kind === "out" && a.outHandle) {
    const newOut = { x: a.outHandle.x + dx, y: a.outHandle.y + dy };
    const newIn =
      a.inHandle !== null
        ? reflect(a.point, newOut)
        : a.inHandle;
    return { ...a, outHandle: newOut, inHandle: newIn };
  }
  return a;
}

function reflect(anchor: Point, h: Point): Point {
  return { x: 2 * anchor.x - h.x, y: 2 * anchor.y - h.y };
}

function cutAnchorAt(subpaths: Subpath[], sp: number, idx: number): Subpath[] {
  return subpaths.map((s, i) => {
    if (i !== sp) return s;
    if (s.anchors.length <= 2) return s; // don't collapse to degenerate path
    const anchors = s.anchors.filter((_, j) => j !== idx);
    return { ...s, anchors };
  });
}

// Cut the segment ending at `endIdx` (segment = anchors[startIdx] → anchors[endIdx]).
// Closed subpath: open it, rotating anchors so the cut lies at the ends.
// Open subpath:   split into two open subpaths at the cut.
function cutSegmentAt(
  subpaths: Subpath[],
  sp: number,
  endIdx: number,
): Subpath[] {
  return subpaths.flatMap((s, i) => {
    if (i !== sp) return [s];
    const n = s.anchors.length;
    if (n < 2) return [s];
    const startIdx = endIdx === 0 ? n - 1 : endIdx - 1;

    if (s.closed) {
      const rotated = [...s.anchors.slice(endIdx), ...s.anchors.slice(0, endIdx)];
      rotated[0] = { ...rotated[0], inHandle: null };
      const last = rotated.length - 1;
      rotated[last] = { ...rotated[last], outHandle: null };
      return [{ anchors: rotated, closed: false }];
    }

    if (startIdx < 0 || endIdx <= 0 || endIdx >= n) return [s];
    const leftRaw = s.anchors.slice(0, endIdx);
    const rightRaw = s.anchors.slice(endIdx);
    const left = leftRaw.map((a, j) =>
      j === leftRaw.length - 1 ? { ...a, outHandle: null } : a,
    );
    const right = rightRaw.map((a, j) =>
      j === 0 ? { ...a, inHandle: null } : a,
    );
    const out: Subpath[] = [];
    if (left.length >= 2) out.push({ anchors: left, closed: false });
    if (right.length >= 2) out.push({ anchors: right, closed: false });
    return out.length > 0 ? out : [s];
  });
}

function toggleAnchorType(
  subpaths: Subpath[],
  sp: number,
  idx: number,
): Subpath[] {
  return subpaths.map((s, i) => {
    if (i !== sp) return s;
    const anchors = s.anchors.map((a, j) => {
      if (j !== idx) return a;
      if (a.inHandle || a.outHandle) {
        // → corner
        return { ...a, inHandle: null, outHandle: null };
      }
      // → smooth, synthesize handles from neighbors
      const prevIdx = j === 0 ? (s.closed ? s.anchors.length - 1 : j) : j - 1;
      const nextIdx = j === s.anchors.length - 1 ? (s.closed ? 0 : j) : j + 1;
      const prev = s.anchors[prevIdx];
      const next = s.anchors[nextIdx];
      const tx = (next.point.x - prev.point.x) * 0.25;
      const ty = (next.point.y - prev.point.y) * 0.25;
      return {
        ...a,
        inHandle: { x: a.point.x - tx, y: a.point.y - ty },
        outHandle: { x: a.point.x + tx, y: a.point.y + ty },
      };
    });
    return { ...s, anchors };
  });
}

function buildSegmentD(prev: Anchor, curr: Anchor): string {
  const hasCurve = prev.outHandle !== null || curr.inHandle !== null;
  if (hasCurve) {
    const c1 = prev.outHandle ?? prev.point;
    const c2 = curr.inHandle ?? curr.point;
    return `M ${prev.point.x} ${prev.point.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${curr.point.x} ${curr.point.y}`;
  }
  return `M ${prev.point.x} ${prev.point.y} L ${curr.point.x} ${curr.point.y}`;
}

// Not referenced externally — exported for potential future use.
export type { EditTool };
