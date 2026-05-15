import type { Path } from './types'

// Parse an SVG string into Path records. `doc` must be a real Document so that
// getTotalLength()/getBBox() work. In production pass `window.document`; in tests
// pass the happy-dom document via the `@vitest-environment happy-dom` pragma.
export function parseSvg(svgString: string, doc: Document): Path[] {
  try {
    const parsed = new DOMParser().parseFromString(svgString, 'image/svg+xml')
    const root = parsed.documentElement
    if (!root || root.nodeName.toLowerCase() !== 'svg') return []
    const host = doc.createElement('div')
    host.style.position = 'absolute'
    host.style.left = '-99999px'
    host.style.width = '0'
    host.style.height = '0'
    host.style.overflow = 'hidden'
    doc.body.appendChild(host)
    host.innerHTML = svgString
    const svgEl = host.querySelector('svg') as SVGSVGElement | null
    if (!svgEl) {
      host.remove()
      return []
    }
    const els = Array.from(svgEl.querySelectorAll('path')) as SVGPathElement[]
    const out: Path[] = els.map((el) => {
      const d = el.getAttribute('d') ?? ''
      const fill = el.getAttribute('fill') ?? '#000'
      const length = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 0
      const bb =
        typeof el.getBBox === 'function'
          ? el.getBBox()
          : { x: 0, y: 0, width: 0, height: 0 }
      return {
        d,
        fill,
        stroke: darken(fill),
        length: Number.isFinite(length) ? length : 0,
        bbox: { x: bb.x, y: bb.y, width: bb.width, height: bb.height },
      }
    })
    host.remove()
    return out
  } catch {
    return []
  }
}

function darken(color: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color)
  if (!m) return color
  const n = parseInt(m[1], 16)
  const r = Math.max(0, Math.floor(((n >> 16) & 0xff) * 0.8))
  const g = Math.max(0, Math.floor(((n >> 8) & 0xff) * 0.8))
  const b = Math.max(0, Math.floor((n & 0xff) * 0.8))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}
