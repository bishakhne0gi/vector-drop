import type { Path, Schedule } from './types'

// Emit a self-contained SVG with native <animate> tags. Plays in any modern
// renderer (browser, Safari preview, design tools) with zero JS.
export function exportAnimatedSvg(
  paths: Path[],
  sched: Schedule[],
  viewBox: string,
): string {
  const n = Math.min(paths.length, sched.length)
  const body = Array.from({ length: n }, (_, i) =>
    renderAnimatedPath(paths[i], sched[i]),
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`
}

function renderAnimatedPath(p: Path, s: Schedule): string {
  const drawDur = s.pathEndSec - s.pathStartSec
  const fillStart = s.pathStartSec + drawDur * 0.7
  const fillDur = drawDur * 0.3
  return (
    `<path d="${escapeAttr(p.d)}" fill="${escapeAttr(p.fill)}" stroke="${escapeAttr(p.stroke)}"` +
    ` stroke-width="1" stroke-dasharray="${trim(p.length)}"` +
    ` stroke-dashoffset="${trim(p.length)}" fill-opacity="0">` +
    `<animate attributeName="stroke-dashoffset" from="${trim(p.length)}" to="0"` +
    ` begin="${trim(s.pathStartSec)}s" dur="${trim(drawDur)}s" fill="freeze"/>` +
    `<animate attributeName="fill-opacity" from="0" to="1"` +
    ` begin="${trim(fillStart)}s" dur="${trim(fillDur)}s" fill="freeze"/>` +
    `</path>`
  )
}

function trim(x: number): string {
  return Number.isFinite(x) ? String(Math.round(x * 1000) / 1000) : '0'
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
