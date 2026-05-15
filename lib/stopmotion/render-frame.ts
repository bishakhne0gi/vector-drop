import type { Path, Schedule } from './types'

// Render an SVG string showing the stop-motion timeline at absolute time `tSec`.
export function renderFrame(
  paths: Path[],
  sched: Schedule[],
  tSec: number,
  _totalDurationSec: number,
  viewBox: string,
): string {
  const n = Math.min(paths.length, sched.length)
  const body = Array.from({ length: n }, (_, i) =>
    renderPath(paths[i], sched[i], tSec),
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`
}

function renderPath(p: Path, s: Schedule, tSec: number): string {
  const drawDur = s.pathEndSec - s.pathStartSec
  const localT = (tSec - s.pathStartSec) / Math.max(drawDur, 1e-9)
  const strokeProgress = clamp01(localT)
  const offset = p.length * (1 - strokeProgress)
  const fillProgress = clamp01((localT - 0.7) / 0.3)
  const fillOpacity = fillProgress
  const strokeAttr = localT >= 1 ? 'none' : p.stroke
  return (
    `<path d="${escapeAttr(p.d)}"` +
    ` fill="${escapeAttr(p.fill)}"` +
    ` fill-opacity="${trim(fillOpacity)}"` +
    ` stroke="${escapeAttr(strokeAttr)}"` +
    ` stroke-width="1"` +
    ` stroke-dasharray="${trim(p.length)}"` +
    ` stroke-dashoffset="${trim(offset)}"` +
    `/>`
  )
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function trim(x: number): string {
  return Number.isFinite(x) ? String(Math.round(x * 1000) / 1000) : '0'
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
