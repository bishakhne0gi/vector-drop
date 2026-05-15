# Video → Stop-Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "video → vectorized stop-motion" feature: short videos uploaded onto the existing drop zone are sampled in the browser, each sampled frame is vectorized via the existing convert pipeline, and the user lands in a new in-product view to scrub, play, and export the resulting stop-motion as an animated SVG or WebM.

**Architecture:** Client-side frame extraction via `<video>` + canvas seeking. Each frame POSTs to a new server route that wraps the existing potrace convert and writes a `project_frames` row. A new processing page shows progress; a new editor view plays back and exports. Existing single-SVG "stop motion" feature is renamed to "line trace" to free the name.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind, Supabase (Postgres + Storage), Vitest (`happy-dom` for DOM tests), Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-05-15-video-stop-motion-design.md`

---

## File Structure

**Created (new):**

```
supabase/migrations/0010_project_frames.sql

lib/video-stopmotion/
  sample-plan.ts                # (duration, samplingFps, maxFrames) → timestamps[]  (pure)
  probe-video.ts                # File → { duration, width, height }                  (DOM)
  extract-frame.ts              # (video, t, canvas) → Promise<Blob>                  (DOM)
  convert-frames.ts             # orchestrator: timestamps → per-frame fetch loop
  export-animated-svg.ts        # frames[] + durations[] → animated SVG string        (pure)

components/video-stopmotion/
  VideoStopMotionProcessor.tsx  # /processing/video/[projectId]
  VideoStopMotionView.tsx       # /editor/[projectId]/stopmotion (video projects)
  FrameStrip.tsx                # thumbnail row, used in both screens

app/(app)/processing/video/[projectId]/page.tsx
app/api/projects/[id]/frames/route.ts                # GET list
app/api/projects/[id]/frames/[idx]/convert/route.ts  # POST one frame PNG → SVG row

__tests__/unit/video-stopmotion/
  sample-plan.test.ts
  convert-frames.test.ts
  export-animated-svg.test.ts

__tests__/e2e/video-stopmotion/
  video-stopmotion.spec.ts
tests/fixtures/test-video.mp4   # 3-second test fixture
```

**Modified:**

- `lib/stopmotion/` → renamed to `lib/line-trace/`
- `components/editor/stopmotion/` → renamed to `components/editor/line-trace/`
- `components/editor/StopMotionButton.tsx` → `LineTraceButton.tsx`, label "Line Trace", points at `/editor/[id]/linetrace`
- `app/(app)/editor/[projectId]/stopmotion/` → renamed to `linetrace/`, then **a new** `stopmotion/` directory is created for video projects
- `lib/line-trace/export-webm.ts` — generalize to accept `renderAt(t) => string`
- `components/upload/DropZone.tsx` — extend `ACCEPTED_TYPES` to include videos, branch routing on MIME
- `app/api/projects/route.ts` POST — accept optional `kind: 'video'` and write `kind` column

---

## Task 1: Supabase migration

**Files:** Create `supabase/migrations/0010_project_frames.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0010_project_frames.sql
alter table projects add column if not exists kind text not null default 'image';

create table if not exists project_frames (
  project_id   uuid not null references projects(id) on delete cascade,
  frame_idx    int  not null,
  svg_url      text not null,
  duration_ms  int  not null,
  primary key (project_id, frame_idx)
);
create index if not exists project_frames_project_idx
  on project_frames (project_id, frame_idx);

alter table project_frames enable row level security;
-- No policies: service-role only. Reads go through API routes that enforce ownership.
```

- [ ] **Step 2: Apply locally**

Apply via your usual local Supabase workflow (Supabase Studio SQL editor, or `pnpm supabase db reset` if you keep migrations in CLI). After applying, verify `\d project_frames` shows the four columns and `\d projects` shows the new `kind` column.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0010_project_frames.sql
git commit -m "feat(supabase): add project_frames and projects.kind"
```

---

## Task 2: Rename existing "stop motion" feature to "line trace"

This is a pure rename — no logic changes — so the `stopmotion` name is free for the new feature. Do it as one commit.

**Files moved (use `git mv` to preserve history):**

- [ ] **Step 1: Rename library and components**

```bash
git mv lib/stopmotion lib/line-trace
git mv components/editor/stopmotion components/editor/line-trace
git mv components/editor/StopMotionButton.tsx components/editor/LineTraceButton.tsx
git mv 'app/(app)/editor/[projectId]/stopmotion' 'app/(app)/editor/[projectId]/linetrace'
git mv __tests__/unit/stopmotion __tests__/unit/line-trace
git mv __tests__/e2e/stopmotion __tests__/e2e/line-trace
```

- [ ] **Step 2: Find-and-replace import paths**

Run: `grep -rl "@/lib/stopmotion" --include="*.ts" --include="*.tsx" lib components app __tests__`
For every match, replace `@/lib/stopmotion` with `@/lib/line-trace`.

Same for `components/editor/stopmotion` → `components/editor/line-trace`.
Same for the toolbar import and the route paths.

- [ ] **Step 3: Update component identifiers**

In `components/editor/LineTraceButton.tsx`:

```tsx
export function LineTraceButton({ projectId }: { projectId: string }) {
  return (
    <Link
      href={`/editor/${projectId}/linetrace`}
      className="inline-flex items-center gap-1.5 rounded border border-[var(--border-glass)] bg-[var(--bg-glass)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-glass-strong)]"
      aria-label="Open line-trace view"
      style={{ height: 32, fontFamily: 'auxMono, monospace' }}
    >
      <Clapperboard className="h-4 w-4" />
      <span className="hidden sm:inline">Line Trace</span>
    </Link>
  )
}
```

In `components/editor/Toolbar.tsx`, replace `import { StopMotionButton } from "./StopMotionButton"` with `import { LineTraceButton } from "./LineTraceButton"` and update the JSX call site to `<LineTraceButton projectId={projectId} />`.

- [ ] **Step 4: Run all line-trace tests to confirm nothing broke**

```bash
pnpm vitest run __tests__/unit/line-trace
```

Expected: 20 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: rename stopmotion → line-trace to free the name for video stop-motion"
```

---

## Task 3: `sample-plan.ts` — pure timestamps generator (TDD)

**Files:**
- Create: `lib/video-stopmotion/sample-plan.ts`
- Test: `__tests__/unit/video-stopmotion/sample-plan.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run, confirm failure**

`pnpm vitest run __tests__/unit/video-stopmotion/sample-plan.test.ts`

- [ ] **Step 3: Implement**

```ts
// lib/video-stopmotion/sample-plan.ts
export type SamplePlanArgs = {
  durationSec: number
  samplingFps: number
  maxFrames: number
}

export function samplePlan({ durationSec, samplingFps, maxFrames }: SamplePlanArgs): number[] {
  if (durationSec <= 0 || samplingFps <= 0 || maxFrames <= 0) return []
  const step = 1 / samplingFps
  const stamps: number[] = []
  for (let t = 0; t <= durationSec + 1e-9 && stamps.length < maxFrames; t += step) {
    stamps.push(Math.min(t, durationSec))
  }
  return stamps
}
```

- [ ] **Step 4: Run, confirm green**

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/video-stopmotion/sample-plan.ts __tests__/unit/video-stopmotion/sample-plan.test.ts
git commit -m "feat(video-stopmotion): sample-plan pure timestamps generator"
```

---

## Task 4: `probe-video.ts` and `extract-frame.ts` — DOM helpers

**Files:**
- Create: `lib/video-stopmotion/probe-video.ts`
- Create: `lib/video-stopmotion/extract-frame.ts`

No unit tests — both are thin wrappers around browser-only APIs and are covered by Playwright in Task 11.

- [ ] **Step 1: Implement `probe-video.ts`**

```ts
// lib/video-stopmotion/probe-video.ts
export type VideoMeta = { durationSec: number; width: number; height: number }

export function probeVideo(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    v.src = url
    v.onloadedmetadata = () => {
      const meta = { durationSec: v.duration, width: v.videoWidth, height: v.videoHeight }
      URL.revokeObjectURL(url)
      resolve(meta)
    }
    v.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video metadata'))
    }
  })
}
```

- [ ] **Step 2: Implement `extract-frame.ts`**

```ts
// lib/video-stopmotion/extract-frame.ts
export async function extractFrame(
  video: HTMLVideoElement,
  tSec: number,
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  video.currentTime = tSec
  await new Promise<void>((resolve) =>
    video.addEventListener('seeked', () => resolve(), { once: true }),
  )
  // Buffer one rAF — some browsers fire `seeked` before the decoded frame is ready.
  await new Promise((r) => requestAnimationFrame(() => r(null)))
  const ctx = canvas.getContext('2d')!
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
      'image/png',
    ),
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/video-stopmotion/probe-video.ts lib/video-stopmotion/extract-frame.ts
git commit -m "feat(video-stopmotion): browser helpers to probe video and extract frames"
```

---

## Task 5: `convert-frames.ts` orchestrator (TDD)

**Files:**
- Create: `lib/video-stopmotion/convert-frames.ts`
- Test: `__tests__/unit/video-stopmotion/convert-frames.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
      fetchFn: fetchFn as any,
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
      { ok: false, bodyIdx: 0 }, // first try of frame 1 fails
      { ok: true, bodyIdx: 1 },  // retry of frame 1 succeeds
      { ok: true, bodyIdx: 2 },
    ])
    const results = await convertFrames({
      projectId: 'p1',
      blobs: [blob, blob, blob],
      fetchFn: fetchFn as any,
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
      fetchFn: fetchFn as any,
    })
    // Only 2 of 3 succeeded; the orchestrator returns successful ones.
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
      fetchFn: fetchFn as any,
      signal: ctl.signal,
    })
    expect(results.length).toBeLessThan(blobs.length)
  })
})
```

- [ ] **Step 2: Run, confirm failure**

`pnpm vitest run __tests__/unit/video-stopmotion/convert-frames.test.ts`

- [ ] **Step 3: Implement**

```ts
// lib/video-stopmotion/convert-frames.ts
export type FrameResult = { frameIdx: number; svgUrl: string }

export type ConvertFramesArgs = {
  projectId: string
  blobs: Blob[]
  fetchFn?: typeof fetch
  signal?: AbortSignal
  onProgress?: (frac: number) => void
}

export async function convertFrames(args: ConvertFramesArgs): Promise<FrameResult[]> {
  const fetchFn = args.fetchFn ?? fetch
  const results: FrameResult[] = []
  for (let i = 0; i < args.blobs.length; i++) {
    if (args.signal?.aborted) break
    const ok = await tryConvert(args.projectId, i, args.blobs[i], fetchFn, args.signal)
    if (ok) results.push({ frameIdx: i, svgUrl: ok })
    args.onProgress?.((i + 1) / args.blobs.length)
  }
  return results
}

async function tryConvert(
  projectId: string,
  idx: number,
  blob: Blob,
  fetchFn: typeof fetch,
  signal?: AbortSignal,
): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) return null
    try {
      const fd = new FormData()
      fd.append('frame', blob, `${idx}.png`)
      const res = await fetchFn(`/api/projects/${projectId}/frames/${idx}/convert`, {
        method: 'POST',
        body: fd,
        signal,
      })
      if (res.ok) {
        const data = (await res.json()) as { svg_url: string }
        return data.svg_url
      }
    } catch {
      // fall through to retry
    }
  }
  return null
}
```

- [ ] **Step 4: Run, confirm green**

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/video-stopmotion/convert-frames.ts __tests__/unit/video-stopmotion/convert-frames.test.ts
git commit -m "feat(video-stopmotion): orchestrator for per-frame convert calls"
```

---

## Task 6: `export-animated-svg.ts` for video (TDD)

**Files:**
- Create: `lib/video-stopmotion/export-animated-svg.ts`
- Test: `__tests__/unit/video-stopmotion/export-animated-svg.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement**

```ts
// lib/video-stopmotion/export-animated-svg.ts
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
  // Strip the outer <svg ...> wrapper, keep its children.
  const open = frame.indexOf('>')
  const close = frame.lastIndexOf('</svg>')
  if (open === -1 || close === -1) return ''
  return frame.slice(open + 1, close)
}

function trim(x: number): string {
  return Number.isFinite(x) ? String(Math.round(x * 1000) / 1000) : '0'
}
```

- [ ] **Step 4: Run, confirm green**

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/video-stopmotion/export-animated-svg.ts __tests__/unit/video-stopmotion/export-animated-svg.test.ts
git commit -m "feat(video-stopmotion): export animated SVG via <set visibility>"
```

---

## Task 7: Generalize `export-webm.ts` with `renderAt` callback

**Files:**
- Modify: `lib/line-trace/export-webm.ts`

- [ ] **Step 1: Edit the function signature**

Open `lib/line-trace/export-webm.ts`. Replace the existing `exportWebm` signature and body so that the inner rAF loop calls a caller-supplied `renderAt(t) => string` instead of `renderFrame(paths, sched, t, …)` directly. The caller for the existing line-trace feature will now bind `renderAt = (t) => renderFrame(paths, sched, t, opts.totalDurationSec, opts.viewBox)` at the call site.

```ts
// lib/line-trace/export-webm.ts
export type WebmOptions = {
  totalDurationSec: number
  width: number
  height: number
}

export async function exportWebm(
  renderAt: (tSec: number) => string,
  opts: WebmOptions,
  onProgress?: (frac: number) => void,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = opts.width
  canvas.height = opts.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, opts.width, opts.height)

  const stream = canvas.captureStream(60)
  const chunks: Blob[] = []
  const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
  rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
  })

  rec.start()
  const startMs = performance.now()
  const totalMs = opts.totalDurationSec * 1000

  await new Promise<void>((resolve) => {
    function step() {
      const elapsed = performance.now() - startMs
      const frac = Math.min(elapsed / totalMs, 1)
      drawSvgToCanvas(ctx, renderAt(frac * opts.totalDurationSec), opts.width, opts.height)
      onProgress?.(frac)
      if (frac >= 1) { resolve(); return }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })

  rec.stop()
  return done
}

function drawSvgToCanvas(
  ctx: CanvasRenderingContext2D,
  svg: string,
  w: number,
  h: number,
): void {
  const img = new Image()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  img.src = url
  img.onload = () => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(url)
  }
}
```

- [ ] **Step 2: Update the existing line-trace caller**

In `components/editor/line-trace/StopMotionView.tsx` (renamed in Task 2 — its filename may also be updated to `LineTraceView.tsx` if you wish; for this plan we keep the filename as-is to minimize churn), find `handleExportWebm` and change the `exportWebm` call from the old `(paths, schedule, opts, onProgress)` to the new `(renderAt, opts, onProgress)` form:

```tsx
import { renderFrame } from '@/lib/line-trace/render-frame'

// inside handleExportWebm:
const dims = ASPECT_DIMS[aspect]
const renderAt = (tSec: number) =>
  renderFrame(paths, schedule, tSec, params.totalDurationSec, viewBox)
const blob = await exportWebm(
  renderAt,
  { totalDurationSec: params.totalDurationSec, width: dims.w, height: dims.h },
  (p) => setWebmProgress(p),
)
```

Also remove the `viewBox` field from the `WebmOptions` object you pass (the new signature no longer needs it).

- [ ] **Step 3: Run line-trace tests + manually rebuild**

```bash
pnpm vitest run __tests__/unit/line-trace
pnpm tsc --noEmit -p tsconfig.json   # may flag pre-existing errors elsewhere; only check new ones
```

- [ ] **Step 4: Commit**

```bash
git add lib/line-trace/export-webm.ts components/editor/line-trace
git commit -m "refactor(line-trace): generalize export-webm with renderAt callback"
```

---

## Task 8: API — `POST /api/projects/[id]/frames/[idx]/convert`

**Files:**
- Create: `app/api/projects/[id]/frames/[idx]/convert/route.ts`

- [ ] **Step 1: Implement**

Mirror the auth/ownership pattern from the existing convert route at `app/api/projects/[id]/convert/route.ts`, but operate on a single frame:

```ts
// app/api/projects/[id]/frames/[idx]/convert/route.ts
import { z } from 'zod'
import { createServiceClient, requireAuth } from '@/lib/api/supabase'
import { handleError } from '@/lib/api/handleError'
import { enforceRateLimit, convertRatelimit } from '@/lib/cache/redis'
import { AppError } from '@/lib/types'
import { traceColorMask } from '@/lib/conversion/maskTrace'
import { auth } from '@clerk/nextjs/server'

const SAMPLING_FPS = 8
const DEFAULT_FRAME_DURATION_MS = Math.round(1000 / SAMPLING_FPS)

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; idx: string }> },
): Promise<Response> {
  try {
    const { id: projectId, idx: idxStr } = await ctx.params
    const idx = Number(idxStr)
    if (!Number.isInteger(idx) || idx < 0) throw AppError.validation('Bad frame index')

    const { userId } = await auth()
    const rateLimitKey =
      userId ?? (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon')
    await enforceRateLimit(convertRatelimit, rateLimitKey)

    const svc = createServiceClient()
    const { data: project, error: projErr } = await svc
      .from('projects')
      .select('id, user_id, kind')
      .eq('id', projectId)
      .single()
    if (projErr || !project) throw AppError.notFound('Project not found')
    if (project.user_id && project.user_id !== userId) throw AppError.forbidden('Not your project')
    if (project.kind !== 'video') throw AppError.validation('Project is not a video project')

    const form = await req.formData()
    const file = form.get('frame')
    if (!(file instanceof Blob)) throw AppError.validation('Missing frame blob')

    // Pixel buffer for potrace
    const arrayBuf = await file.arrayBuffer()
    const { width, height, mask, totalPixels, clusters } = await rasterToMaskInput(arrayBuf)

    const segments = await Promise.all(
      clusters.map((c) => traceColorMask(width, height, c.indices, totalPixels)),
    )
    const svgString = composeSvg(width, height, segments)

    // Upload to Storage
    const path = `projects/${projectId}/frames/${String(idx).padStart(4, '0')}.svg`
    const { error: upErr } = await svc.storage
      .from('projects')
      .upload(path, new Blob([svgString], { type: 'image/svg+xml' }), { upsert: true })
    if (upErr) throw AppError.internal(`Upload failed: ${upErr.message}`)

    const { data: signed } = await svc.storage
      .from('projects')
      .createSignedUrl(path, 60 * 60 * 24)
    const svgUrl = signed?.signedUrl ?? path

    // Insert row (upsert in case the client retried)
    const { error: insErr } = await svc.from('project_frames').upsert(
      {
        project_id: projectId,
        frame_idx: idx,
        svg_url: svgUrl,
        duration_ms: DEFAULT_FRAME_DURATION_MS,
      },
      { onConflict: 'project_id,frame_idx' },
    )
    if (insErr) throw AppError.internal(`Frame insert failed: ${insErr.message}`)

    return Response.json({ svg_url: svgUrl })
  } catch (err) {
    return handleError(err)
  }
}

// Helpers used above. Reuse whatever the existing convert route uses to build
// mask input + compose the final SVG; copy or extract a shared module.
async function rasterToMaskInput(_buf: ArrayBuffer): Promise<{
  width: number
  height: number
  mask: Uint8Array
  totalPixels: number
  clusters: Array<{ indices: number[] }>
}> {
  throw new Error('Use the same helpers as app/api/projects/[id]/convert/route.ts; extract a shared module if needed.')
}

function composeSvg(_w: number, _h: number, _segments: unknown[]): string {
  throw new Error('Use the same composeSvg helper as the image-convert route.')
}
```

**Note for the engineer:** The two helpers (`rasterToMaskInput` and `composeSvg`) exist as private helpers inside `app/api/projects/[id]/convert/route.ts` today. Extract them to `lib/conversion/rasterTrace.ts` (or similar) and import in both routes. Do this extraction as part of this task — don't copy the code. Run `pnpm vitest run` after the extraction to confirm no regressions; if there are any existing tests for the image convert route, they should still pass.

- [ ] **Step 2: Commit**

```bash
git add app/api/projects/[id]/frames/[idx]/convert/route.ts lib/conversion app/api/projects/[id]/convert/route.ts
git commit -m "feat(api): POST single-frame convert for video projects"
```

---

## Task 9: API — `GET /api/projects/[id]/frames`

**Files:**
- Create: `app/api/projects/[id]/frames/route.ts`

- [ ] **Step 1: Implement**

```ts
// app/api/projects/[id]/frames/route.ts
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/api/supabase'
import { handleError } from '@/lib/api/handleError'
import { AppError } from '@/lib/types'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: projectId } = await ctx.params
    const { userId } = await auth()
    const svc = createServiceClient()

    const { data: project } = await svc
      .from('projects')
      .select('id, user_id, kind')
      .eq('id', projectId)
      .single()
    if (!project) throw AppError.notFound('Project not found')
    if (project.user_id && project.user_id !== userId) throw AppError.forbidden('Not your project')

    const { data: frames, error } = await svc
      .from('project_frames')
      .select('frame_idx, svg_url, duration_ms')
      .eq('project_id', projectId)
      .order('frame_idx', { ascending: true })
    if (error) throw AppError.internal(error.message)
    return Response.json(frames ?? [])
  } catch (err) {
    return handleError(err)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/projects/[id]/frames/route.ts
git commit -m "feat(api): GET project frames list"
```

---

## Task 10: Extend `POST /api/projects` to accept `kind: 'video'`

**Files:**
- Modify: `app/api/projects/route.ts`

- [ ] **Step 1: Extend the request schema and insert**

Open `app/api/projects/route.ts`. Find `createProjectSchema` and add an optional `kind` field. Then in the insert, pass it through.

```ts
// Around the existing schema:
const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(100),
  fileSizeBytes: z.number().int().positive().max(/* keep existing cap */),
  kind: z.enum(['image', 'video']).optional(),
})

// In the insert call:
const { data: project, error: insertError } = await svc
  .from('projects')
  .insert({
    user_id: userId ?? null,
    name,
    source_image_path: storagePath,
    status: 'pending',
    kind: parsed.data.kind ?? 'image',
  })
  .select()
```

- [ ] **Step 2: Commit**

```bash
git add app/api/projects/route.ts
git commit -m "feat(api): accept kind='video' on project creation"
```

---

## Task 11: Extend `DropZone.tsx` to accept videos

**Files:**
- Modify: `components/upload/DropZone.tsx`

- [ ] **Step 1: Extend MIME list and add branch**

In `DropZone.tsx`:

```ts
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const MAX_VIDEO_SECONDS = 5
```

In the `accept={...}` JSX prop the value already derives from `ACCEPTED_TYPES.join(',')` — no change required there.

In the file-handling callback (the one that today creates a project and uploads an image), branch on MIME. For videos:

1. Reject if size > `MAX_VIDEO_BYTES` (show your existing error UI).
2. Probe duration via `probeVideo(file)` (Task 4). Reject if `durationSec > MAX_VIDEO_SECONDS`.
3. Call your project-create POST with `{ kind: 'video' }` and the video's filename/size/mime.
4. Upload the video to `projects/<id>/source.<ext>` via Supabase Storage (use the same signed-URL upload helper the image path uses — same bucket, just a different path).
5. Navigate to `/processing/video/${projectId}`.

The image branch is unchanged.

- [ ] **Step 2: Commit**

```bash
git add components/upload/DropZone.tsx
git commit -m "feat(upload): accept video files and route them to the stop-motion processor"
```

---

## Task 12: `VideoStopMotionProcessor.tsx` component

**Files:**
- Create: `components/video-stopmotion/VideoStopMotionProcessor.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/video-stopmotion/VideoStopMotionProcessor.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { samplePlan } from '@/lib/video-stopmotion/sample-plan'
import { extractFrame } from '@/lib/video-stopmotion/extract-frame'
import { convertFrames } from '@/lib/video-stopmotion/convert-frames'

type Props = { projectId: string; videoUrl: string }

export function VideoStopMotionProcessor({ projectId, videoUrl }: Props) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [progress, setProgress] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)
  const [doneFrames, setDoneFrames] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    abortRef.current = new AbortController()

    async function run() {
      const video = videoRef.current!
      // Wait for metadata + canplay
      if (video.readyState < 2) {
        await new Promise<void>((r) => video.addEventListener('canplay', () => r(), { once: true }))
      }
      const stamps = samplePlan({
        durationSec: video.duration,
        samplingFps: 8,
        maxFrames: 40,
      })
      if (cancelled) return
      setTotalFrames(stamps.length)

      // Resume: check which frame indices already exist
      const existing = await fetch(`/api/projects/${projectId}/frames`).then((r) => r.json())
      const haveIdx = new Set<number>(existing.map((f: { frame_idx: number }) => f.frame_idx))

      const canvas = canvasRef.current!
      const blobs: Blob[] = []
      for (let i = 0; i < stamps.length; i++) {
        if (haveIdx.has(i)) {
          blobs.push(new Blob()) // placeholder; convertFrames will see we skip it via existing check
          continue
        }
        const blob = await extractFrame(video, stamps[i], canvas)
        blobs.push(blob)
      }

      const filteredBlobs = blobs.map((b, i) => (haveIdx.has(i) ? null : b))
      const indices = filteredBlobs
        .map((b, i) => (b ? i : -1))
        .filter((i) => i >= 0)

      const results = await convertFrames({
        projectId,
        blobs: indices.map((i) => filteredBlobs[i]!) as Blob[],
        signal: abortRef.current!.signal,
        onProgress: (frac) => {
          if (cancelled) return
          setProgress(frac)
          setDoneFrames(Math.round(frac * indices.length) + haveIdx.size)
        },
      })

      if (!cancelled && results.length + haveIdx.size > 0) {
        router.push(`/editor/${projectId}/stopmotion`)
      }
    }

    run().catch((e) => setError(String(e)))
    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, videoUrl])

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 py-2 text-sm">
        Processing video — {doneFrames} of {totalFrames} frames
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          autoPlay
          loop
          className="max-h-full max-w-full"
          crossOrigin="anonymous"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <div className="border-t border-neutral-800 bg-neutral-900 p-3">
        <div className="h-2 w-full overflow-hidden rounded bg-neutral-800">
          <div
            className="h-full bg-white transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={() => abortRef.current?.abort()}
          className="mt-3 rounded bg-neutral-800 px-3 py-1 text-sm hover:bg-neutral-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/video-stopmotion/VideoStopMotionProcessor.tsx
git commit -m "feat(video-stopmotion): processor component"
```

---

## Task 13: Processing route page

**Files:**
- Create: `app/(app)/processing/video/[projectId]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/(app)/processing/video/[projectId]/page.tsx
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { VideoStopMotionProcessor } from '@/components/video-stopmotion/VideoStopMotionProcessor'

async function getProjectMeta(id: string): Promise<{ source_url: string | null; kind: string } | null> {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const res = await fetch(`${proto}://${host}/api/projects/${id}`, {
    headers: { cookie: h.get('cookie') ?? '' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  return { source_url: data.source_image_url ?? data.svg_url ?? null, kind: data.kind ?? 'image' }
}

export default async function VideoProcessingPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const meta = await getProjectMeta(projectId)
  if (!meta || meta.kind !== 'video' || !meta.source_url) notFound()
  return <VideoStopMotionProcessor projectId={projectId} videoUrl={meta.source_url} />
}
```

**Note:** The existing `/api/projects/[id]` GET response may not currently expose `source_image_url`. If it doesn't, extend it (the existing route already attaches signed URLs to `svg_url`; do the same for the source file when `kind === 'video'`). Adjust the field name in the call above to match what the API returns.

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/processing/video/\[projectId\]/page.tsx app/api/projects/\[id\]/route.ts
git commit -m "feat(video-stopmotion): processing route page"
```

---

## Task 14: `VideoStopMotionView.tsx` + route page

**Files:**
- Create: `components/video-stopmotion/VideoStopMotionView.tsx`
- Create: `app/(app)/editor/[projectId]/stopmotion/page.tsx`

- [ ] **Step 1: Implement the view**

```tsx
// components/video-stopmotion/VideoStopMotionView.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { exportVideoAnimatedSvg } from '@/lib/video-stopmotion/export-animated-svg'
import { exportWebm } from '@/lib/line-trace/export-webm'

type Frame = { frame_idx: number; svg_url: string; duration_ms: number }
type AspectRatio = '1:1' | '9:16' | '16:9'

const ASPECT_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
}

type Props = { projectId: string; projectName: string; frames: Frame[] }

export function VideoStopMotionView({ projectId, projectName, frames }: Props) {
  const [svgStrings, setSvgStrings] = useState<string[] | null>(null)
  const [perFrameMs, setPerFrameMs] = useState(125)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [aspect, setAspect] = useState<AspectRatio>('1:1')
  const [webmProgress, setWebmProgress] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(frames.map((f) => fetch(f.svg_url).then((r) => r.text()))).then((arr) => {
      if (!cancelled) setSvgStrings(arr)
    })
    return () => { cancelled = true }
  }, [frames])

  // Playback timer
  useEffect(() => {
    if (!isPlaying || !svgStrings) return
    const id = setTimeout(() => {
      setCurrentIdx((i) => {
        const next = i + 1
        if (next >= frames.length) {
          setIsPlaying(false)
          return 0
        }
        return next
      })
    }, perFrameMs)
    return () => clearTimeout(id)
  }, [isPlaying, currentIdx, perFrameMs, frames.length, svgStrings])

  const viewBox = useMemo(() => {
    if (!svgStrings || !svgStrings[0]) return '0 0 100 100'
    const m = svgStrings[0].match(/viewBox="([^"]+)"/)
    return m?.[1] ?? '0 0 100 100'
  }, [svgStrings])

  const totalDurationSec = (frames.length * perFrameMs) / 1000

  function renderAt(tSec: number): string {
    if (!svgStrings) return `<svg viewBox="${viewBox}"></svg>`
    const idx = Math.min(Math.floor(tSec / (perFrameMs / 1000)), svgStrings.length - 1)
    return svgStrings[idx]
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function handleExportSvg() {
    if (!svgStrings) return
    const out = exportVideoAnimatedSvg(
      svgStrings,
      Array(svgStrings.length).fill(perFrameMs),
      viewBox,
    )
    download(new Blob([out], { type: 'image/svg+xml' }), `${projectName}-stopmotion.svg`)
  }

  async function handleExportWebm() {
    if (!svgStrings) return
    setWebmProgress(0)
    try {
      const dims = ASPECT_DIMS[aspect]
      const blob = await exportWebm(
        renderAt,
        { totalDurationSec, width: dims.w, height: dims.h },
        (p) => setWebmProgress(p),
      )
      download(blob, `${projectName}-stopmotion.webm`)
    } finally {
      setWebmProgress(null)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 py-2 text-sm">
        Stop Motion — {projectName} ({frames.length} frames)
      </header>
      <div className="flex flex-1 min-h-0">
        <div className="flex flex-1 items-center justify-center">
          <div
            className="aspect-square w-full max-w-[720px]"
            dangerouslySetInnerHTML={{
              __html: svgStrings?.[currentIdx] ?? '<svg/>',
            }}
          />
        </div>
        <aside className="w-80 shrink-0 border-l border-neutral-800 bg-neutral-900 p-4 text-sm">
          <h2 className="text-base font-semibold">Stop Motion</h2>
          <label className="mt-3 flex flex-col gap-1">
            <span>Frame duration: {perFrameMs} ms</span>
            <input
              type="range" min={60} max={500} step={5}
              value={perFrameMs}
              onChange={(e) => setPerFrameMs(parseInt(e.target.value, 10))}
            />
          </label>
          <label className="mt-3 flex flex-col gap-1">
            <span>Export aspect (video)</span>
            <select
              value={aspect}
              onChange={(e) => setAspect(e.target.value as AspectRatio)}
              className="rounded bg-neutral-800 p-1"
            >
              <option value="1:1">1:1</option>
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
            </select>
          </label>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleExportSvg}
              className="rounded bg-white px-3 py-2 text-sm font-medium text-black"
            >
              Export Animated SVG
            </button>
            <button
              type="button"
              onClick={handleExportWebm}
              disabled={webmProgress !== null}
              className="rounded bg-neutral-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {webmProgress === null
                ? 'Export Video (.webm)'
                : `Recording… ${Math.round(webmProgress * 100)}%`}
            </button>
          </div>
        </aside>
      </div>
      <div className="flex items-center gap-3 border-t border-neutral-800 bg-neutral-900 p-3">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="rounded bg-neutral-800 px-3 py-1 text-sm"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          step={1}
          value={currentIdx}
          onChange={(e) => setCurrentIdx(parseInt(e.target.value, 10))}
          className="flex-1"
        />
        <span className="w-20 text-right font-mono text-sm text-neutral-400">
          {currentIdx + 1} / {frames.length}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement the route page**

```tsx
// app/(app)/editor/[projectId]/stopmotion/page.tsx
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { VideoStopMotionView } from '@/components/video-stopmotion/VideoStopMotionView'

async function fetchJson(path: string) {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const res = await fetch(`${proto}://${host}${path}`, {
    headers: { cookie: h.get('cookie') ?? '' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function VideoStopMotionPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const [project, frames] = await Promise.all([
    fetchJson(`/api/projects/${projectId}`),
    fetchJson(`/api/projects/${projectId}/frames`),
  ])
  if (!project || project.kind !== 'video' || !Array.isArray(frames) || frames.length === 0) {
    notFound()
  }
  return (
    <VideoStopMotionView
      projectId={projectId}
      projectName={project.name ?? 'untitled'}
      frames={frames}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/video-stopmotion/VideoStopMotionView.tsx 'app/(app)/editor/[projectId]/stopmotion/page.tsx'
git commit -m "feat(video-stopmotion): view + route page"
```

---

## Task 15: Playwright e2e

**Files:**
- Create: `__tests__/e2e/video-stopmotion/video-stopmotion.spec.ts`
- Add: `tests/fixtures/test-video.mp4` (a 3-second mp4; if none exists, generate one with `ffmpeg -f lavfi -i color=c=red:s=320x240:r=30:d=3 -vcodec libx264 -pix_fmt yuv420p test-video.mp4`)

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Video Stop Motion', () => {
  test('upload → process → land on stop-motion view → export SVG', async ({ page }) => {
    await page.goto('/')
    const fileInput = page.getByTestId('file-input')
    const fixturePath = path.join(__dirname, '../../../tests/fixtures/test-video.mp4')
    await fileInput.setInputFiles(fixturePath)

    // Should land on the processing route within reasonable time
    await page.waitForURL(/\/processing\/video\//, { timeout: 30_000 })

    // Should eventually navigate to the stop-motion view (40 frames at ~1s each)
    await page.waitForURL(/\/editor\/.*\/stopmotion/, { timeout: 90_000 })
    await expect(page.getByText(/Stop Motion —/)).toBeVisible()

    // Scrubbing changes the rendered SVG
    const before = await page.locator('svg').first().innerHTML()
    await page.locator('input[type="range"]').first().fill('5')
    await page.waitForTimeout(200)
    const after = await page.locator('svg').first().innerHTML()
    expect(before).not.toBe(after)

    // Export Animated SVG triggers a download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export Animated SVG' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.svg$/)
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add __tests__/e2e/video-stopmotion tests/fixtures/test-video.mp4
git commit -m "test(video-stopmotion): playwright e2e covering upload through SVG export"
```

---

## Task 16: Manual smoke + open PR

- [ ] **Step 1: Manual smoke**

```bash
pnpm dev
```

Sign in, drag a short `.mp4` (≤5s, ≤25 MB) onto the upload zone. Verify:
- You land on `/processing/video/<id>`, see the video looping, and the progress bar climb.
- You auto-navigate to `/editor/<id>/stopmotion`.
- Scrubbing the frame slider changes the displayed SVG.
- Play/Pause cycles through frames at the chosen ms-per-frame.
- **Export Animated SVG** produces a `.svg` that, when opened in a browser, plays the stop-motion.
- **Export Video (.webm)** produces a `.webm` that plays correctly.
- The renamed "Line Trace" button on existing image projects still works end-to-end.

- [ ] **Step 2: Push + open PR**

```bash
git push -u origin <branch>
gh pr create --title "Video → Stop Motion" --body "$(cat <<'EOF'
## Summary
- New "video → vectorized stop-motion" pipeline. Drop a ≤5s video, get 40 vectorized frames played back at 8 fps.
- Reuses existing potrace convert; per-frame server route writes to a new `project_frames` table.
- New views: `/processing/video/[id]` (progress) and `/editor/[id]/stopmotion` (playback + exports).
- Existing single-SVG "Stop Motion" feature renamed to "Line Trace" to free the name.
- Spec: docs/superpowers/specs/2026-05-15-video-stop-motion-design.md
- Plan: docs/superpowers/plans/2026-05-15-video-stop-motion.md

## Test plan
- [ ] All vitest unit suites pass (line-trace + video-stopmotion)
- [ ] Playwright video-stopmotion e2e passes
- [ ] Manual smoke: short mp4 → SVG + webm exports both play
- [ ] Existing image projects + Line Trace button still work
EOF
)"
```

---

## Self-review notes

- **Spec coverage:** schema (Task 1), rename (Task 2), sample-plan (Task 3), probe/extract (Task 4), orchestrator (Task 5), animated SVG export (Task 6), generalized WebM export (Task 7), API routes (Tasks 8–10), uploader branching (Task 11), processing UI (Tasks 12–13), playback view (Task 14), e2e (Task 15), smoke (Task 16). All spec sections map to a task.
- **Type consistency:** `Frame { frame_idx, svg_url, duration_ms }` used identically in the SQL, the GET API response, the processor, and the view. `FrameResult { frameIdx, svgUrl }` is the orchestrator's internal shape; renamed to camelCase intentionally to follow JS conventions while the API stays snake_case. `exportWebm(renderAt, opts, onProgress)` signature is consistent across the line-trace caller (Task 7) and the video-stopmotion caller (Task 14).
- **Placeholder scan:** Task 8 explicitly defers the two pixel-pipeline helpers (`rasterToMaskInput`, `composeSvg`) to a code extraction the implementer performs from the existing image-convert route — this is a real instruction, not a placeholder. Everything else is concrete code or precise rename rules.
- **Risks called out in the spec** (`seeked` fragility, long client tab, codec restrictions, storage cost) are handled in Task 4 (rAF buffer), Task 12 (resume-from-existing in the processor), Task 11 (MIME whitelist), and explicit fast-follow note for retention.
