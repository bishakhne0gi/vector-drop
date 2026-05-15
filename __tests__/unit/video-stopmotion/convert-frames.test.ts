import { describe, it, expect, vi } from 'vitest'
import { convertFrames } from '@/lib/video-stopmotion/convert-frames'

function makeFakeFetch(plan: Array<{ ok: boolean; bodyIdx: number }>) {
  let call = 0
  return vi.fn(async () => {
    const step = plan[call++]
    if (!step.ok) return new Response('boom', { status: 500 })
    return new Response(JSON.stringify({ svg_url: `https://x/${step.bodyIdx}.svg` }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
}

const blob = new Blob(['x'], { type: 'image/png' })

describe('convertFrames', () => {
  it('emits monotonic progress and returns one result per frame', async () => {
    const progress: number[] = []
    const fetchFn = makeFakeFetch([
      { ok: true, bodyIdx: 0 },
      { ok: true, bodyIdx: 1 },
      { ok: true, bodyIdx: 2 },
    ])
    const blobs = [blob, blob, blob]
    const results = await convertFrames({
      projectId: 'p1',
      blobs,
      fetchFn: fetchFn as unknown as typeof fetch,
      onProgress: (f) => progress.push(f),
    })
    expect(results).toHaveLength(3)
    expect(progress[0]).toBeLessThan(progress[progress.length - 1])
    expect(progress[progress.length - 1]).toBeCloseTo(1, 5)
    expect(results[0]).toEqual({ frameIdx: 0, svgUrl: 'https://x/0.svg' })
  })

  it('retries a failed frame once and continues', async () => {
    const fetchFn = makeFakeFetch([
      { ok: true, bodyIdx: 0 },
      { ok: false, bodyIdx: 0 },
      { ok: true, bodyIdx: 1 },
      { ok: true, bodyIdx: 2 },
    ])
    const results = await convertFrames({
      projectId: 'p1',
      blobs: [blob, blob, blob],
      fetchFn: fetchFn as unknown as typeof fetch,
    })
    expect(results).toHaveLength(3)
    expect(results[1].svgUrl).toBe('https://x/1.svg')
  })

  it('skips a frame that fails twice and continues', async () => {
    const fetchFn = makeFakeFetch([
      { ok: true, bodyIdx: 0 },
      { ok: false, bodyIdx: 0 },
      { ok: false, bodyIdx: 0 },
      { ok: true, bodyIdx: 2 },
    ])
    const results = await convertFrames({
      projectId: 'p1',
      blobs: [blob, blob, blob],
      fetchFn: fetchFn as unknown as typeof fetch,
    })
    expect(results.map((r) => r.frameIdx)).toEqual([0, 2])
  })

  it('aborts the loop when signal is aborted', async () => {
    const ctl = new AbortController()
    const fetchFn = vi.fn(async () => {
      ctl.abort()
      return new Response(JSON.stringify({ svg_url: 'x' }), { status: 200 })
    })
    const blobs = [blob, blob, blob, blob]
    const results = await convertFrames({
      projectId: 'p1',
      blobs,
      fetchFn: fetchFn as unknown as typeof fetch,
      signal: ctl.signal,
    })
    expect(results.length).toBeLessThan(blobs.length)
  })
})
