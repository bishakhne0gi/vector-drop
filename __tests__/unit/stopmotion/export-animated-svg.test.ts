// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { exportAnimatedSvg } from '@/lib/stopmotion/export-animated-svg'
import type { Path, Schedule } from '@/lib/stopmotion/types'

const paths: Path[] = [
  {
    d: 'M0 0 H10',
    fill: '#222',
    stroke: '#111',
    length: 10,
    bbox: { x: 0, y: 0, width: 10, height: 0 },
  },
  {
    d: 'M0 0 V10',
    fill: '#abc',
    stroke: '#9ab',
    length: 10,
    bbox: { x: 0, y: 0, width: 0, height: 10 },
  },
]
const sched: Schedule[] = [
  { pathStartSec: 0, pathEndSec: 1 },
  { pathStartSec: 1, pathEndSec: 2 },
]

describe('exportAnimatedSvg', () => {
  it('emits two <animate> tags per path (stroke-dashoffset + fill-opacity)', () => {
    const svg = exportAnimatedSvg(paths, sched, '0 0 10 10')
    const offsetCount = svg.match(/attributeName="stroke-dashoffset"/g)?.length ?? 0
    const fillCount = svg.match(/attributeName="fill-opacity"/g)?.length ?? 0
    expect(offsetCount).toBe(2)
    expect(fillCount).toBe(2)
  })

  it('begin attributes match per-path pathStartSec', () => {
    const svg = exportAnimatedSvg(paths, sched, '0 0 10 10')
    expect(svg).toContain('begin="0s"')
    expect(svg).toContain('begin="1s"')
  })

  it('the output parses as well-formed XML', () => {
    const svg = exportAnimatedSvg(paths, sched, '0 0 10 10')
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
    expect(parsed.querySelector('parsererror')).toBeNull()
    expect(parsed.documentElement.nodeName.toLowerCase()).toBe('svg')
  })

  it('returns a minimal valid SVG with no paths when given no paths', () => {
    const svg = exportAnimatedSvg([], [], '0 0 10 10')
    expect(svg).toContain('<svg')
    expect(svg).not.toContain('<path')
  })
})
