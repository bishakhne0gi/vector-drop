// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { parseSvg } from '@/lib/stopmotion/parse-svg'

const TWO_PATH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M0 0 H 100 V 100 H 0 Z" fill="#222"/>
  <path d="M20 20 L80 20 L80 80 Z" fill="#ff0000"/>
</svg>`

describe('parseSvg', () => {
  it('returns one Path record per <path>', () => {
    const paths = parseSvg(TWO_PATH_SVG, globalThis.document)
    expect(paths).toHaveLength(2)
    expect(paths[0].d).toContain('M0 0')
    expect(paths[0].fill).toBe('#222')
    expect(paths[1].fill).toBe('#ff0000')
  })

  it('computes a non-negative length and a bbox per path', () => {
    const paths = parseSvg(TWO_PATH_SVG, globalThis.document)
    for (const p of paths) {
      expect(p.length).toBeGreaterThanOrEqual(0)
      expect(p.bbox.width).toBeGreaterThanOrEqual(0)
      expect(p.bbox.height).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns [] for an SVG with no <path> elements', () => {
    const empty = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
    expect(parseSvg(empty, globalThis.document)).toEqual([])
  })

  it('returns [] for malformed input (does not throw)', () => {
    expect(parseSvg('not-an-svg', globalThis.document)).toEqual([])
  })

  it('preserves document order in the returned array', () => {
    const paths = parseSvg(TWO_PATH_SVG, globalThis.document)
    expect(paths[0].fill).toBe('#222')
    expect(paths[1].fill).toBe('#ff0000')
  })
})
