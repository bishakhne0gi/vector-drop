import { describe, it, expect } from 'vitest'
import { renderFrame } from '@/lib/stopmotion/render-frame'
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

describe('renderFrame', () => {
  it('returns a string containing the <svg> root', () => {
    const out = renderFrame(paths, sched, 0, 2, '0 0 10 10')
    expect(out).toContain('<svg')
    expect(out).toContain('viewBox="0 0 10 10"')
  })

  it('at t=0 the first path is invisible (full dash offset)', () => {
    const out = renderFrame(paths, sched, 0, 2, '0 0 10 10')
    expect(out).toMatch(/stroke-dashoffset="10(\.0+)?"/)
  })

  it('at t=1 the first path is fully drawn (offset 0, fill 1)', () => {
    const out = renderFrame(paths, sched, 1, 2, '0 0 10 10')
    expect(out).toMatch(/<path[^>]*d="M0 0 H10"[^>]*stroke-dashoffset="0"/)
    expect(out).toMatch(/<path[^>]*d="M0 0 H10"[^>]*fill-opacity="1"/)
  })

  it('at t=0.5 first path is partially drawn, second is invisible', () => {
    const out = renderFrame(paths, sched, 0.5, 2, '0 0 10 10')
    const m = out.match(
      /<path[^>]*d="M0 0 H10"[^>]*stroke-dashoffset="([0-9.]+)"/,
    )
    expect(m).not.toBeNull()
    const off = parseFloat(m![1])
    expect(off).toBeGreaterThan(0)
    expect(off).toBeLessThan(10)
    expect(out).toMatch(/<path[^>]*d="M0 0 V10"[^>]*fill-opacity="0"/)
  })
})
