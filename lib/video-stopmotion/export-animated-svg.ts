// Inline each frame's inner SVG content into a <g> wrapper and use <set> tags
// to flip its visibility on/off for that frame's window.
export function exportVideoAnimatedSvg(
  frames: string[],
  durationsMs: number[],
  viewBox: string,
): string {
  let cursorSec = 0
  const groups = frames.map((frame, i) => {
    const durSec = durationsMs[i] / 1000
    const inner = innerSvg(frame)
    const beginAttr = trim(cursorSec)
    const offAttr = trim(cursorSec + durSec)
    const piece =
      `<g visibility="hidden">` +
      `<set attributeName="visibility" to="visible" begin="${beginAttr}s" dur="${trim(durSec)}s" fill="freeze"/>` +
      `<set attributeName="visibility" to="hidden" begin="${offAttr}s" fill="freeze"/>` +
      inner +
      `</g>`
    cursorSec += durSec
    return piece
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${groups.join('')}</svg>`
}

function innerSvg(frame: string): string {
  const open = frame.indexOf('>')
  const close = frame.lastIndexOf('</svg>')
  if (open === -1 || close === -1) return ''
  return frame.slice(open + 1, close)
}

function trim(x: number): string {
  return Number.isFinite(x) ? String(Math.round(x * 1000) / 1000) : '0'
}
