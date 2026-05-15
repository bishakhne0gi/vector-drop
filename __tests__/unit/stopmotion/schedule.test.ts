import { describe, it, expect } from 'vitest'
import { buildSchedule, sortPaths } from '@/lib/stopmotion/schedule'
import { DEFAULT_PARAMS, type Path } from '@/lib/stopmotion/types'

function makePath(i: number, area: number): Path {
  return {
    d: `M${i} ${i} L${i + 1} ${i + 1}`,
    fill: '#000',
    stroke: '#000',
    length: 10,
    bbox: { x: 0, y: 0, width: area, height: 1 },
  }
}

describe('sortPaths', () => {
  it('sorts by-size descending', () => {
    const ps = [makePath(0, 1), makePath(1, 10), makePath(2, 5)]
    const sorted = sortPaths(ps, 'by-size')
    expect(sorted.map((p) => p.bbox.width)).toEqual([10, 5, 1])
  })

  it('preserves document order when sortMode is document', () => {
    const ps = [makePath(0, 1), makePath(1, 10), makePath(2, 5)]
    const sorted = sortPaths(ps, 'document')
    expect(sorted).toEqual(ps)
  })
})

describe('buildSchedule', () => {
  it('sequential stagger: last path ends at totalDuration', () => {
    const ps = [makePath(0, 1), makePath(1, 1), makePath(2, 1)]
    const sched = buildSchedule(ps, {
      ...DEFAULT_PARAMS,
      totalDurationSec: 9,
      staggerMode: 'sequential',
    })
    expect(sched).toHaveLength(3)
    expect(sched[sched.length - 1].pathEndSec).toBeCloseTo(9, 5)
  })

  it('sequential stagger: each path window is contiguous', () => {
    const ps = [makePath(0, 1), makePath(1, 1), makePath(2, 1)]
    const sched = buildSchedule(ps, {
      ...DEFAULT_PARAMS,
      totalDurationSec: 6,
      staggerMode: 'sequential',
    })
    expect(sched[0].pathEndSec).toBeCloseTo(sched[1].pathStartSec, 5)
    expect(sched[1].pathEndSec).toBeCloseTo(sched[2].pathStartSec, 5)
  })

  it('overlapped stagger: window starts overlap (stride < window)', () => {
    const ps = [makePath(0, 1), makePath(1, 1), makePath(2, 1)]
    const sched = buildSchedule(ps, {
      ...DEFAULT_PARAMS,
      totalDurationSec: 6,
      staggerMode: 'overlapped',
    })
    const stride = sched[1].pathStartSec - sched[0].pathStartSec
    const window = sched[0].pathEndSec - sched[0].pathStartSec
    expect(stride).toBeLessThan(window)
  })

  it('caps the number of paths to params.maxPaths', () => {
    const ps = Array.from({ length: 500 }, (_, i) => makePath(i, 1))
    const sched = buildSchedule(ps, { ...DEFAULT_PARAMS, maxPaths: 200 })
    expect(sched).toHaveLength(200)
  })

  it('returns [] when given no paths', () => {
    expect(buildSchedule([], DEFAULT_PARAMS)).toEqual([])
  })
})
