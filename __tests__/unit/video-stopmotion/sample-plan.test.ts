import { describe, it, expect } from 'vitest'
import { samplePlan } from '@/lib/video-stopmotion/sample-plan'

describe('samplePlan', () => {
  it('produces ~samplingFps * duration timestamps for a typical case', () => {
    const stamps = samplePlan({ durationSec: 5, samplingFps: 8, maxFrames: 40 })
    expect(stamps.length).toBeGreaterThan(35)
    expect(stamps.length).toBeLessThanOrEqual(40)
    expect(stamps[0]).toBe(0)
    expect(stamps[stamps.length - 1]).toBeLessThanOrEqual(5)
  })

  it('caps at maxFrames even if duration would yield more', () => {
    const stamps = samplePlan({ durationSec: 30, samplingFps: 8, maxFrames: 40 })
    expect(stamps.length).toBe(40)
  })

  it('returns evenly spaced timestamps', () => {
    const stamps = samplePlan({ durationSec: 4, samplingFps: 8, maxFrames: 40 })
    const gaps = stamps.slice(1).map((t, i) => t - stamps[i])
    for (const g of gaps) expect(g).toBeCloseTo(1 / 8, 5)
  })

  it('handles a very short duration (< 1 frame interval)', () => {
    const stamps = samplePlan({ durationSec: 0.1, samplingFps: 8, maxFrames: 40 })
    expect(stamps.length).toBeGreaterThanOrEqual(1)
    expect(stamps[0]).toBe(0)
  })

  it('returns [] for zero/negative duration', () => {
    expect(samplePlan({ durationSec: 0, samplingFps: 8, maxFrames: 40 })).toEqual([])
    expect(samplePlan({ durationSec: -1, samplingFps: 8, maxFrames: 40 })).toEqual([])
  })
})
