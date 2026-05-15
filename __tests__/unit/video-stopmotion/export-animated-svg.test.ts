// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { exportVideoAnimatedSvg } from '@/lib/video-stopmotion/export-animated-svg'

const frames = [
  '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>',
  '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="green"/></svg>',
  '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="blue"/></svg>',
]
const durationsMs = [125, 125, 125]

describe('exportVideoAnimatedSvg', () => {
  it('emits one <g> per frame', () => {
    const svg = exportVideoAnimatedSvg(frames, durationsMs, '0 0 10 10')
    expect(svg.match(/<g [^>]*visibility="hidden"/g)?.length).toBe(3)
  })

  it('begin times are contiguous and cover the full timeline', () => {
    const svg = exportVideoAnimatedSvg(frames, durationsMs, '0 0 10 10')
    expect(svg).toContain('begin="0s"')
    expect(svg).toContain('begin="0.125s"')
    expect(svg).toContain('begin="0.25s"')
  })

  it('parses as well-formed XML', () => {
    const svg = exportVideoAnimatedSvg(frames, durationsMs, '0 0 10 10')
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
    expect(parsed.querySelector('parsererror')).toBeNull()
    expect(parsed.documentElement.nodeName.toLowerCase()).toBe('svg')
  })

  it('handles empty input', () => {
    const svg = exportVideoAnimatedSvg([], [], '0 0 10 10')
    expect(svg).toContain('<svg')
    expect(svg).not.toContain('<g')
  })
})
