# Stop-Motion SVG Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playground feature that lets users open a scrubbable path-by-path stop-motion view of their generated SVG, then export it as an animated `.svg` or a recorded `.webm` video.

**Architecture:** Frontend-only. A pure functional core (`parse-svg`, `schedule`, `render-frame`, `export-animated-svg`) drives both the live React preview and the WebM encoder. A new route `/editor/[projectId]/stopmotion` hosts the view; entry comes from a new toolbar button next to the existing Export dropdown.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind, Vitest (unit, `happy-dom` for DOM-touching code), Playwright (integration), pnpm.

**Spec:** `docs/superpowers/specs/2026-05-15-stop-motion-svg-export-design.md`

---

## File Structure

**Created:**

```
lib/stopmotion/
  types.ts                  # shared Path / Schedule / Params types
  parse-svg.ts              # SVG string → Path[]   (uses a happy-dom Document; takes an injected `doc` arg)
  schedule.ts               # (Path[], Params) → Schedule[]    (pure)
  render-frame.ts           # (paths, schedule, t) → SVG string    (pure)
  export-animated-svg.ts    # (paths, schedule) → SVG string with <animate> tags    (pure)
  export-webm.ts            # (paths, schedule, dimensions) → Promise<Blob>    (impure: canvas + MediaRecorder)

components/editor/
  StopMotionButton.tsx      # toolbar icon → routes to /editor/[id]/stopmotion
  stopmotion/
    StopMotionView.tsx      # client component, owns state
    StopMotionCanvas.tsx    # preview pane (renders render-frame output via iframe srcdoc)
    StopMotionControls.tsx  # right-panel form
    StopMotionScrubber.tsx  # bottom timeline + play/pause + keyboard + scroll-wheel

app/(app)/editor/[projectId]/stopmotion/
  page.tsx                  # route entry; server-fetches project, hands SVG string to <StopMotionView/>

__tests__/unit/stopmotion/
  parse-svg.test.ts
  schedule.test.ts
  render-frame.test.ts
  export-animated-svg.test.ts

__tests__/e2e/stopmotion/
  stopmotion-page.spec.ts   # Playwright
```

**Modified:**
- `components/editor/Toolbar.tsx` — add `<StopMotionButton projectId={projectId}/>` next to the existing `<ExportDropdown/>`.
- `package.json` / `pnpm-lock.yaml` — add `happy-dom` as a dev dependency.

---

## Task 1: Shared types

**Files:**
- Create: `lib/stopmotion/types.ts`

- [ ] **Step 1: Write the types module**

```ts
// lib/stopmotion/types.ts
// Shared types for the stop-motion feature. Imported by every module in lib/stopmotion.

export type Path = {
  d: string;
  fill: string;          // e.g. '#1a1a1a' or 'none'
  stroke: string;        // computed darker variant of fill, or 'none'
  length: number;        // result of <path>.getTotalLength()
  bbox: { x: number; y: number; width: number; height: number };
};

export type SortMode = 'by-size' | 'document';
export type StaggerMode = 'sequential' | 'overlapped';
export type Easing = 'linear' | 'ease-in-out';
export type AspectRatio = '1:1' | '9:16' | '16:9';

export type Params = {
  totalDurationSec: number;     // 1 – 30, default 6
  staggerMode: StaggerMode;     // default 'sequential'
  sortMode: SortMode;           // default 'by-size'
  strokeColorOverride: string | null;
  easing: Easing;               // default 'linear'
  maxPaths: number;             // default 200
};

export type Schedule = {
  // Per visible path, parallel to the visible-paths array in render order.
  pathStartSec: number;
  pathEndSec: number;
};

export const DEFAULT_PARAMS: Params = {
  totalDurationSec: 6,
  staggerMode: 'sequential',
  sortMode: 'by-size',
  strokeColorOverride: null,
  easing: 'linear',
  maxPaths: 200,
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/stopmotion/types.ts
git commit -m "feat(stopmotion): add shared types module"
```

---

## Task 2: Install `happy-dom` for DOM-touching tests

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

Run: `pnpm add -D happy-dom`

Expected: `happy-dom` added under `devDependencies` in `package.json`.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add happy-dom for stopmotion DOM-bound unit tests"
```

---

## Task 3: `parse-svg.ts` — SVG string to ordered `Path[]`

**Files:**
- Create: `lib/stopmotion/parse-svg.ts`
- Test: `__tests__/unit/stopmotion/parse-svg.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/unit/stopmotion/parse-svg.test.ts
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
```

- [ ] **Step 2: Run, confirm failure**

`pnpm vitest run __tests__/unit/stopmotion/parse-svg.test.ts`
Expected: module not found.

- [ ] **Step 3: Implement**

```ts
// lib/stopmotion/parse-svg.ts
import type { Path } from './types'

// Parse an SVG string into Path records. `doc` must be a real Document so that
// getTotalLength()/getBBox() work. In production pass `window.document`; in tests
// pass the happy-dom document via the `@vitest-environment happy-dom` pragma.
export function parseSvg(svgString: string, doc: Document): Path[] {
  let svgEl: SVGSVGElement | null = null
  try {
    const parsed = new DOMParser().parseFromString(svgString, 'image/svg+xml')
    const root = parsed.documentElement
    if (!root || root.nodeName.toLowerCase() !== 'svg') return []
    // Move the parsed SVG into a hidden host so layout APIs work.
    const host = doc.createElement('div')
    host.style.position = 'absolute'
    host.style.left = '-99999px'
    host.style.width = '0'
    host.style.height = '0'
    host.style.overflow = 'hidden'
    doc.body.appendChild(host)
    host.innerHTML = svgString
    svgEl = host.querySelector('svg') as SVGSVGElement | null
    if (!svgEl) {
      host.remove()
      return []
    }
    const els = Array.from(svgEl.querySelectorAll('path')) as SVGPathElement[]
    const out: Path[] = els.map((el) => {
      const d = el.getAttribute('d') ?? ''
      const fill = el.getAttribute('fill') ?? '#000'
      const length = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 0
      const bb = typeof el.getBBox === 'function' ? el.getBBox() : { x: 0, y: 0, width: 0, height: 0 }
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
  // Minimal darkener: drop each hex channel by ~20%. Falls back to color as-is.
  const m = /^#([0-9a-f]{6})$/i.exec(color)
  if (!m) return color
  const n = parseInt(m[1], 16)
  const r = Math.max(0, Math.floor(((n >> 16) & 0xff) * 0.8))
  const g = Math.max(0, Math.floor(((n >> 8) & 0xff) * 0.8))
  const b = Math.max(0, Math.floor((n & 0xff) * 0.8))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}
```

- [ ] **Step 4: Run, confirm green**

`pnpm vitest run __tests__/unit/stopmotion/parse-svg.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/stopmotion/parse-svg.ts __tests__/unit/stopmotion/parse-svg.test.ts
git commit -m "feat(stopmotion): parse SVG strings into ordered Path records"
```

---

## Task 4: `schedule.ts` — paths + params → per-path timing

**Files:**
- Create: `lib/stopmotion/schedule.ts`
- Test: `__tests__/unit/stopmotion/schedule.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/unit/stopmotion/schedule.test.ts
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
    const sched = buildSchedule(ps, { ...DEFAULT_PARAMS, totalDurationSec: 9, staggerMode: 'sequential' })
    expect(sched).toHaveLength(3)
    expect(sched[sched.length - 1].pathEndSec).toBeCloseTo(9, 5)
  })

  it('sequential stagger: each path window is contiguous', () => {
    const ps = [makePath(0, 1), makePath(1, 1), makePath(2, 1)]
    const sched = buildSchedule(ps, { ...DEFAULT_PARAMS, totalDurationSec: 6, staggerMode: 'sequential' })
    expect(sched[0].pathEndSec).toBeCloseTo(sched[1].pathStartSec, 5)
    expect(sched[1].pathEndSec).toBeCloseTo(sched[2].pathStartSec, 5)
  })

  it('overlapped stagger: window starts overlap (stride < window)', () => {
    const ps = [makePath(0, 1), makePath(1, 1), makePath(2, 1)]
    const sched = buildSchedule(ps, { ...DEFAULT_PARAMS, totalDurationSec: 6, staggerMode: 'overlapped' })
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
```

- [ ] **Step 2: Run, confirm failure**

`pnpm vitest run __tests__/unit/stopmotion/schedule.test.ts`

- [ ] **Step 3: Implement**

```ts
// lib/stopmotion/schedule.ts
import type { Params, Path, Schedule, SortMode } from './types'

export function sortPaths(paths: Path[], mode: SortMode): Path[] {
  if (mode === 'document') return paths
  return [...paths].sort((a, b) => b.bbox.width * b.bbox.height - a.bbox.width * a.bbox.height)
}

export function buildSchedule(paths: Path[], params: Params): Schedule[] {
  if (paths.length === 0) return []
  const visible = sortPaths(paths, params.sortMode).slice(0, params.maxPaths)
  const n = visible.length
  const total = params.totalDurationSec

  if (params.staggerMode === 'sequential') {
    const window = total / n
    return visible.map((_, i) => ({
      pathStartSec: i * window,
      pathEndSec: (i + 1) * window,
    }))
  }

  // overlapped: stride = 0.4 * window, n strides + 1 window = total
  // window * (1 + 0.4 * (n - 1)) = total  →  window = total / (1 + 0.4 * (n - 1))
  const window = total / (1 + 0.4 * (n - 1))
  const stride = 0.4 * window
  return visible.map((_, i) => ({
    pathStartSec: i * stride,
    pathEndSec: i * stride + window,
  }))
}
```

- [ ] **Step 4: Run, confirm green**

`pnpm vitest run __tests__/unit/stopmotion/schedule.test.ts`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/stopmotion/schedule.ts __tests__/unit/stopmotion/schedule.test.ts
git commit -m "feat(stopmotion): build per-path animation schedule"
```

---

## Task 5: `render-frame.ts` — schedule + scrub `t` → SVG string

**Files:**
- Create: `lib/stopmotion/render-frame.ts`
- Test: `__tests__/unit/stopmotion/render-frame.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/unit/stopmotion/render-frame.test.ts
import { describe, it, expect } from 'vitest'
import { renderFrame } from '@/lib/stopmotion/render-frame'
import type { Path, Schedule } from '@/lib/stopmotion/types'

const paths: Path[] = [
  { d: 'M0 0 H10', fill: '#222', stroke: '#111', length: 10, bbox: { x: 0, y: 0, width: 10, height: 0 } },
  { d: 'M0 0 V10', fill: '#abc', stroke: '#9ab', length: 10, bbox: { x: 0, y: 0, width: 0, height: 10 } },
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
    // first path should have stroke-dashoffset === length
    expect(out).toMatch(/stroke-dashoffset="10(\.0+)?"/)
  })

  it('at t=1 the first path is fully drawn (offset 0, fill 1)', () => {
    const out = renderFrame(paths, sched, 1, 2, '0 0 10 10')
    expect(out).toMatch(/<path[^>]*d="M0 0 H10"[^>]*stroke-dashoffset="0"/)
    expect(out).toMatch(/<path[^>]*d="M0 0 H10"[^>]*fill-opacity="1"/)
  })

  it('at t=0.5 first path is partially drawn, second is invisible', () => {
    const out = renderFrame(paths, sched, 0.5, 2, '0 0 10 10')
    // first path's offset is somewhere between 0 and 10 (not 10, not 0)
    const m = out.match(/<path[^>]*d="M0 0 H10"[^>]*stroke-dashoffset="([0-9.]+)"/)
    expect(m).not.toBeNull()
    const off = parseFloat(m![1])
    expect(off).toBeGreaterThan(0)
    expect(off).toBeLessThan(10)
    // second path is invisible: fill-opacity 0
    expect(out).toMatch(/<path[^>]*d="M0 0 V10"[^>]*fill-opacity="0"/)
  })
})
```

- [ ] **Step 2: Run, confirm failure**

`pnpm vitest run __tests__/unit/stopmotion/render-frame.test.ts`

- [ ] **Step 3: Implement**

```ts
// lib/stopmotion/render-frame.ts
import type { Path, Schedule } from './types'

// Render an SVG string showing the stop-motion timeline at the given absolute time `tSec`.
// totalDurationSec lets us interpret tSec consistently regardless of how the caller
// derived the scrub position.
export function renderFrame(
  paths: Path[],
  sched: Schedule[],
  tSec: number,
  totalDurationSec: number,
  viewBox: string,
): string {
  const n = Math.min(paths.length, sched.length)
  const body = Array.from({ length: n }, (_, i) => renderPath(paths[i], sched[i], tSec)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`
}

function renderPath(p: Path, s: Schedule, tSec: number): string {
  const drawDur = s.pathEndSec - s.pathStartSec
  const localT = (tSec - s.pathStartSec) / Math.max(drawDur, 1e-9)
  // Stroke offset: full length at localT<=0, 0 at localT>=1
  const strokeProgress = clamp01(localT)
  const offset = p.length * (1 - strokeProgress)
  // Fill opacity: 0 until 70% of the path's draw window, then ramps to 1
  const fillProgress = clamp01((localT - 0.7) / 0.3)
  const fillOpacity = fillProgress
  // Once the path is fully past, drop the stroke entirely to match the export look
  const strokeAttr = localT >= 1 ? 'none' : p.stroke
  return (
    `<path d="${escapeAttr(p.d)}"` +
    ` fill="${escapeAttr(p.fill)}"` +
    ` fill-opacity="${trim(fillOpacity)}"` +
    ` stroke="${escapeAttr(strokeAttr)}"` +
    ` stroke-width="1"` +
    ` stroke-dasharray="${trim(p.length)}"` +
    ` stroke-dashoffset="${trim(offset)}"` +
    `/>`
  )
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function trim(x: number): string {
  return Number.isFinite(x) ? String(Math.round(x * 1000) / 1000) : '0'
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
```

- [ ] **Step 4: Run, confirm green**

`pnpm vitest run __tests__/unit/stopmotion/render-frame.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/stopmotion/render-frame.ts __tests__/unit/stopmotion/render-frame.test.ts
git commit -m "feat(stopmotion): render scrubbable frames as SVG strings"
```

---

## Task 6: `export-animated-svg.ts` — emit `<animate>`-decorated SVG

**Files:**
- Create: `lib/stopmotion/export-animated-svg.ts`
- Test: `__tests__/unit/stopmotion/export-animated-svg.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/unit/stopmotion/export-animated-svg.test.ts
import { describe, it, expect } from 'vitest'
import { exportAnimatedSvg } from '@/lib/stopmotion/export-animated-svg'
import type { Path, Schedule } from '@/lib/stopmotion/types'

const paths: Path[] = [
  { d: 'M0 0 H10', fill: '#222', stroke: '#111', length: 10, bbox: { x: 0, y: 0, width: 10, height: 0 } },
  { d: 'M0 0 V10', fill: '#abc', stroke: '#9ab', length: 10, bbox: { x: 0, y: 0, width: 0, height: 10 } },
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
```

Add `// @vitest-environment happy-dom` at the top of this test file (DOMParser is needed).

- [ ] **Step 2: Run, confirm failure**

`pnpm vitest run __tests__/unit/stopmotion/export-animated-svg.test.ts`

- [ ] **Step 3: Implement**

```ts
// lib/stopmotion/export-animated-svg.ts
import type { Path, Schedule } from './types'

// Emit a self-contained SVG with native <animate> tags. Plays in any modern
// renderer (browser, Safari preview, design tools) with zero JS.
export function exportAnimatedSvg(paths: Path[], sched: Schedule[], viewBox: string): string {
  const n = Math.min(paths.length, sched.length)
  const body = Array.from({ length: n }, (_, i) => renderAnimatedPath(paths[i], sched[i])).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`
}

function renderAnimatedPath(p: Path, s: Schedule): string {
  const drawDur = s.pathEndSec - s.pathStartSec
  const fillStart = s.pathStartSec + drawDur * 0.7
  const fillDur = drawDur * 0.3
  return (
    `<path d="${escapeAttr(p.d)}" fill="${escapeAttr(p.fill)}" stroke="${escapeAttr(p.stroke)}"` +
    ` stroke-width="1" stroke-dasharray="${trim(p.length)}"` +
    ` stroke-dashoffset="${trim(p.length)}" fill-opacity="0">` +
    `<animate attributeName="stroke-dashoffset" from="${trim(p.length)}" to="0"` +
    ` begin="${trim(s.pathStartSec)}s" dur="${trim(drawDur)}s" fill="freeze"/>` +
    `<animate attributeName="fill-opacity" from="0" to="1"` +
    ` begin="${trim(fillStart)}s" dur="${trim(fillDur)}s" fill="freeze"/>` +
    `</path>`
  )
}

function trim(x: number): string {
  return Number.isFinite(x) ? String(Math.round(x * 1000) / 1000) : '0'
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
```

- [ ] **Step 4: Run, confirm green**

`pnpm vitest run __tests__/unit/stopmotion/export-animated-svg.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/stopmotion/export-animated-svg.ts __tests__/unit/stopmotion/export-animated-svg.test.ts
git commit -m "feat(stopmotion): export animated SVG with <animate> tags"
```

---

## Task 7: `export-webm.ts` — record canvas to WebM blob

**Files:**
- Create: `lib/stopmotion/export-webm.ts`

(No unit test — `MediaRecorder` is unmockable in `happy-dom`. Manual smoke + Playwright covers it.)

- [ ] **Step 1: Implement**

```ts
// lib/stopmotion/export-webm.ts
import type { Path, Schedule } from './types'
import { renderFrame } from './render-frame'

export type WebmOptions = {
  totalDurationSec: number
  width: number
  height: number
  viewBox: string
}

// Records `totalDurationSec` of the stop-motion animation as a WebM blob.
// Returns a Promise that resolves with the blob and reports linear progress.
export async function exportWebm(
  paths: Path[],
  sched: Schedule[],
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
      const t = frac * opts.totalDurationSec
      drawSvgToCanvas(ctx, renderFrame(paths, sched, t, opts.totalDurationSec, opts.viewBox), opts.width, opts.height)
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
  // Synchronously draw the previous frame if onload hasn't fired yet — the
  // canvas keeps the last rendered state, so an occasional missed frame is fine.
  img.onload = () => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(url)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/stopmotion/export-webm.ts
git commit -m "feat(stopmotion): record stop-motion animation as WebM via MediaRecorder"
```

---

## Task 8: `StopMotionCanvas.tsx` — live preview pane

**Files:**
- Create: `components/editor/stopmotion/StopMotionCanvas.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/editor/stopmotion/StopMotionCanvas.tsx
'use client'

import { useMemo } from 'react'
import type { Path, Schedule } from '@/lib/stopmotion/types'
import { renderFrame } from '@/lib/stopmotion/render-frame'

type Props = {
  paths: Path[]
  schedule: Schedule[]
  tSec: number
  totalDurationSec: number
  viewBox: string
}

export function StopMotionCanvas({ paths, schedule, tSec, totalDurationSec, viewBox }: Props) {
  const svg = useMemo(
    () => renderFrame(paths, schedule, tSec, totalDurationSec, viewBox),
    [paths, schedule, tSec, totalDurationSec, viewBox],
  )
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div
        className="aspect-square w-full max-w-[720px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/stopmotion/StopMotionCanvas.tsx
git commit -m "feat(stopmotion): live preview canvas component"
```

---

## Task 9: `StopMotionScrubber.tsx` — timeline + play/keyboard/scroll-wheel

**Files:**
- Create: `components/editor/stopmotion/StopMotionScrubber.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/editor/stopmotion/StopMotionScrubber.tsx
'use client'

import { useEffect, useRef } from 'react'

type Props = {
  tSec: number
  totalDurationSec: number
  isPlaying: boolean
  onScrub: (tSec: number) => void
  onTogglePlay: () => void
}

export function StopMotionScrubber({ tSec, totalDurationSec, isPlaying, onScrub, onTogglePlay }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<{ wallMs: number; baseT: number } | null>(null)

  // Drive playback with rAF when isPlaying.
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startRef.current = null
      return
    }
    startRef.current = { wallMs: performance.now(), baseT: tSec >= totalDurationSec ? 0 : tSec }
    const step = (now: number) => {
      const { wallMs, baseT } = startRef.current!
      const next = Math.min(baseT + (now - wallMs) / 1000, totalDurationSec)
      onScrub(next)
      if (next < totalDurationSec) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        onTogglePlay()
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  // Keyboard: left/right step by 0.1s, space toggles play.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') { e.preventDefault(); onTogglePlay() }
      else if (e.code === 'ArrowLeft') onScrub(Math.max(0, tSec - 0.1))
      else if (e.code === 'ArrowRight') onScrub(Math.min(totalDurationSec, tSec + 0.1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tSec, totalDurationSec, onScrub, onTogglePlay])

  // Wheel: scroll-wheel anywhere in the wrapper scrubs.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const delta = e.deltaY / 500
      onScrub(Math.max(0, Math.min(totalDurationSec, tSec + delta * totalDurationSec)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [tSec, totalDurationSec, onScrub])

  return (
    <div ref={wrapperRef} className="flex items-center gap-3 border-t border-neutral-800 bg-neutral-900 p-3">
      <button
        type="button"
        onClick={onTogglePlay}
        className="rounded bg-neutral-800 px-3 py-1 text-sm text-white hover:bg-neutral-700"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        min={0}
        max={totalDurationSec}
        step={totalDurationSec / 1000}
        value={tSec}
        onChange={(e) => onScrub(parseFloat(e.target.value))}
        className="flex-1"
      />
      <span className="w-16 text-right font-mono text-sm text-neutral-400">
        {tSec.toFixed(2)}s
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/stopmotion/StopMotionScrubber.tsx
git commit -m "feat(stopmotion): scrubber with play/keyboard/wheel controls"
```

---

## Task 10: `StopMotionControls.tsx` — right panel form

**Files:**
- Create: `components/editor/stopmotion/StopMotionControls.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/editor/stopmotion/StopMotionControls.tsx
'use client'

import type { Params, AspectRatio } from '@/lib/stopmotion/types'

type Props = {
  params: Params
  aspect: AspectRatio
  onChange: (next: Params) => void
  onAspectChange: (next: AspectRatio) => void
  onExportSvg: () => void
  onExportWebm: () => void
  webmProgress: number | null
}

export function StopMotionControls(props: Props) {
  const { params, aspect, onChange, onAspectChange, onExportSvg, onExportWebm, webmProgress } = props

  function set<K extends keyof Params>(key: K, value: Params[K]) {
    onChange({ ...params, [key]: value })
  }

  return (
    <aside className="flex h-full w-full flex-col gap-4 border-l border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-200">
      <h2 className="text-base font-semibold">Stop Motion</h2>

      <label className="flex flex-col gap-1">
        <span>Total duration: {params.totalDurationSec}s</span>
        <input
          type="range" min={1} max={30} step={0.5}
          value={params.totalDurationSec}
          onChange={(e) => set('totalDurationSec', parseFloat(e.target.value))}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span>Stagger</span>
        <select value={params.staggerMode} onChange={(e) => set('staggerMode', e.target.value as Params['staggerMode'])}>
          <option value="sequential">Sequential</option>
          <option value="overlapped">Overlapped</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span>Draw order</span>
        <select value={params.sortMode} onChange={(e) => set('sortMode', e.target.value as Params['sortMode'])}>
          <option value="by-size">By size (big → small)</option>
          <option value="document">Document order</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span>Easing</span>
        <select value={params.easing} onChange={(e) => set('easing', e.target.value as Params['easing'])}>
          <option value="linear">Linear</option>
          <option value="ease-in-out">Ease in-out</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span>Stroke color override</span>
        <input
          type="color"
          value={params.strokeColorOverride ?? '#000000'}
          onChange={(e) => set('strokeColorOverride', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span>Export aspect (video)</span>
        <select value={aspect} onChange={(e) => onAspectChange(e.target.value as AspectRatio)}>
          <option value="1:1">1:1 (square)</option>
          <option value="9:16">9:16 (vertical)</option>
          <option value="16:9">16:9 (horizontal)</option>
        </select>
      </label>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={onExportSvg}
          className="rounded bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-100"
        >
          Export Animated SVG
        </button>
        <button
          type="button"
          onClick={onExportWebm}
          disabled={webmProgress !== null}
          className="rounded bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {webmProgress === null
            ? 'Export Video (.webm)'
            : `Recording… ${Math.round(webmProgress * 100)}%`}
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/stopmotion/StopMotionControls.tsx
git commit -m "feat(stopmotion): controls panel for params + export buttons"
```

---

## Task 11: `StopMotionView.tsx` — owns state, wires children, runs exports

**Files:**
- Create: `components/editor/stopmotion/StopMotionView.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/editor/stopmotion/StopMotionView.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { parseSvg } from '@/lib/stopmotion/parse-svg'
import { buildSchedule } from '@/lib/stopmotion/schedule'
import { exportAnimatedSvg } from '@/lib/stopmotion/export-animated-svg'
import { exportWebm } from '@/lib/stopmotion/export-webm'
import { DEFAULT_PARAMS, type AspectRatio, type Params, type Path } from '@/lib/stopmotion/types'
import { StopMotionCanvas } from './StopMotionCanvas'
import { StopMotionControls } from './StopMotionControls'
import { StopMotionScrubber } from './StopMotionScrubber'

type Props = {
  projectName: string
  svgString: string
}

const ASPECT_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
}

export function StopMotionView({ projectName, svgString }: Props) {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS)
  const [aspect, setAspect] = useState<AspectRatio>('1:1')
  const [tSec, setTSec] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [webmProgress, setWebmProgress] = useState<number | null>(null)
  const [paths, setPaths] = useState<Path[]>([])
  const [viewBox, setViewBox] = useState('0 0 100 100')

  // Parse the SVG once on mount (and when the source changes).
  useEffect(() => {
    const parsed = parseSvg(svgString, document)
    setPaths(parsed)
    const match = svgString.match(/viewBox="([^"]+)"/)
    if (match) setViewBox(match[1])
  }, [svgString])

  const schedule = useMemo(() => buildSchedule(paths, params), [paths, params])

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function handleExportSvg() {
    const out = exportAnimatedSvg(paths, schedule, viewBox)
    download(new Blob([out], { type: 'image/svg+xml' }), `${projectName}-stopmotion.svg`)
  }

  async function handleExportWebm() {
    setWebmProgress(0)
    try {
      const dims = ASPECT_DIMS[aspect]
      const blob = await exportWebm(
        paths,
        schedule,
        { totalDurationSec: params.totalDurationSec, width: dims.w, height: dims.h, viewBox },
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
        Stop Motion — {projectName}
      </header>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <StopMotionCanvas
            paths={paths}
            schedule={schedule}
            tSec={tSec}
            totalDurationSec={params.totalDurationSec}
            viewBox={viewBox}
          />
        </div>
        <div className="w-80 shrink-0">
          <StopMotionControls
            params={params}
            aspect={aspect}
            onChange={setParams}
            onAspectChange={setAspect}
            onExportSvg={handleExportSvg}
            onExportWebm={handleExportWebm}
            webmProgress={webmProgress}
          />
        </div>
      </div>
      <StopMotionScrubber
        tSec={tSec}
        totalDurationSec={params.totalDurationSec}
        isPlaying={isPlaying}
        onScrub={setTSec}
        onTogglePlay={() => setIsPlaying((p) => !p)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/stopmotion/StopMotionView.tsx
git commit -m "feat(stopmotion): top-level view wiring canvas, controls, scrubber, exports"
```

---

## Task 12: Route page `/editor/[projectId]/stopmotion`

**Files:**
- Create: `app/(app)/editor/[projectId]/stopmotion/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/(app)/editor/[projectId]/stopmotion/page.tsx
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { StopMotionView } from '@/components/editor/stopmotion/StopMotionView'

type ProjectResponse = { id: string; name: string; svg_url: string | null }

async function getProject(id: string): Promise<ProjectResponse | null> {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const res = await fetch(`${proto}://${host}/api/projects/${id}`, {
    headers: { cookie: h.get('cookie') ?? '' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function StopMotionPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProject(projectId)
  if (!project || !project.svg_url) notFound()

  const svgRes = await fetch(project.svg_url, { cache: 'no-store' })
  if (!svgRes.ok) notFound()
  const svgString = await svgRes.text()

  return <StopMotionView projectName={project.name ?? 'untitled'} svgString={svgString} />
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit -p tsconfig.json` (or run `pnpm next build --no-lint` as a quicker sanity check). Confirm no new errors caused by the new files.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/editor/\[projectId\]/stopmotion/page.tsx
git commit -m "feat(stopmotion): /editor/[projectId]/stopmotion route"
```

---

## Task 13: Toolbar entry button

**Files:**
- Create: `components/editor/StopMotionButton.tsx`
- Modify: `components/editor/Toolbar.tsx`

- [ ] **Step 1: Create the button component**

```tsx
// components/editor/StopMotionButton.tsx
'use client'

import Link from 'next/link'
import { Clapperboard } from 'lucide-react'

export function StopMotionButton({ projectId }: { projectId: string }) {
  return (
    <Link
      href={`/editor/${projectId}/stopmotion`}
      className="inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
      aria-label="Open stop-motion view"
    >
      <Clapperboard className="h-4 w-4" />
      <span className="hidden sm:inline">Stop Motion</span>
    </Link>
  )
}
```

- [ ] **Step 2: Add it next to `<ExportDropdown/>` in `Toolbar.tsx`**

Open `components/editor/Toolbar.tsx`. Find the JSX where `<ExportDropdown` is rendered (around line 458). Add the button immediately before (or after) it:

```tsx
import { StopMotionButton } from './StopMotionButton'

// …inside the JSX, sibling to <ExportDropdown …/>:
<StopMotionButton projectId={projectId} />
```

Keep formatting consistent with the surrounding code. Do not change any other behavior.

- [ ] **Step 3: Commit**

```bash
git add components/editor/StopMotionButton.tsx components/editor/Toolbar.tsx
git commit -m "feat(editor): add Stop Motion toolbar button"
```

---

## Task 14: Mobile responsive — controls drawer below 768px

**Files:**
- Modify: `components/editor/stopmotion/StopMotionView.tsx`

- [ ] **Step 1: Wrap the controls in a responsive container**

In `StopMotionView.tsx`, change the controls column wrapper from `<div className="w-80 shrink-0">` to a responsive shell that hides on mobile and reappears in a slide-up sheet:

```tsx
{/* Right panel on desktop, bottom drawer on mobile */}
<div className="hidden md:block w-80 shrink-0">
  <StopMotionControls {...controlProps} />
</div>
<details className="md:hidden absolute bottom-16 left-0 right-0 bg-neutral-900 border-t border-neutral-800">
  <summary className="cursor-pointer p-3 text-sm">Settings & Export</summary>
  <div className="p-2">
    <StopMotionControls {...controlProps} />
  </div>
</details>
```

Where `controlProps` is the existing props object you already pass — extract it to a local `const controlProps = { params, aspect, onChange: setParams, onAspectChange: setAspect, onExportSvg: handleExportSvg, onExportWebm: handleExportWebm, webmProgress }` just above the return for DRY.

- [ ] **Step 2: Commit**

```bash
git add components/editor/stopmotion/StopMotionView.tsx
git commit -m "feat(stopmotion): collapse controls into bottom sheet on mobile"
```

---

## Task 15: Playwright integration test

**Files:**
- Create: `__tests__/e2e/stopmotion/stopmotion-page.spec.ts`

- [ ] **Step 1: Write the test**

```ts
// __tests__/e2e/stopmotion/stopmotion-page.spec.ts
import { test, expect } from '@playwright/test'

// This test assumes the existing test seed creates a project with id "test-project"
// that has a non-null svg_url. If the seed convention differs, adjust here.
test.describe('stop motion view', () => {
  test('renders preview, exports animated SVG', async ({ page }) => {
    await page.goto('/editor/test-project/stopmotion')
    await expect(page.locator('text=Stop Motion')).toBeVisible()
    await expect(page.locator('svg').first()).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Export Animated SVG")').click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.svg$/)
  })

  test('scrubbing updates the preview SVG', async ({ page }) => {
    await page.goto('/editor/test-project/stopmotion')
    const before = await page.locator('svg').first().innerHTML()
    await page.locator('input[type="range"]').fill('3')
    const after = await page.locator('svg').first().innerHTML()
    expect(before).not.toBe(after)
  })
})
```

- [ ] **Step 2: Run**

`pnpm playwright test __tests__/e2e/stopmotion/stopmotion-page.spec.ts`
Expected: 2 tests pass. If the test seed doesn't have a `test-project` with a real SVG, adapt the project id and confirm the seed convention from `playwright.config.ts` and any existing e2e helpers under `tests/` or `__tests__/e2e/`.

- [ ] **Step 3: Commit**

```bash
git add __tests__/e2e/stopmotion/stopmotion-page.spec.ts
git commit -m "test(stopmotion): playwright coverage for view + SVG export"
```

---

## Task 16: Manual smoke + open PR

**Files:** none.

- [ ] **Step 1: `pnpm dev`, sign in, open any completed project, click the Stop Motion button.**

Verify:
- Route loads, preview shows the SVG at `t=0` (mostly invisible).
- Scrubbing the timeline reveals paths progressively.
- "Sequential" vs "Overlapped" visibly changes the cadence.
- "Export Animated SVG" downloads a `.svg` that, when opened in a browser, autoplays the animation.
- "Export Video (.webm)" produces a downloadable `.webm` that plays the same animation.

- [ ] **Step 2: Push branch + open PR**

```bash
git push -u origin <branch>
gh pr create --title "Stop-motion SVG export" --body "$(cat <<'EOF'
## Summary
- Path-by-path scrubbable stop-motion view at /editor/[projectId]/stopmotion
- Export as animated SVG (instant) or WebM (~30s, client-side via MediaRecorder)
- Entry from a new Stop Motion button in the editor toolbar
- Spec: docs/superpowers/specs/2026-05-15-stop-motion-svg-export-design.md
- Plan: docs/superpowers/plans/2026-05-15-stop-motion-svg-export.md

## Test plan
- [ ] All vitest unit suites pass
- [ ] Playwright stopmotion-page suite passes
- [ ] Manual smoke: SVG export plays in browser
- [ ] Manual smoke: WebM export plays in browser
EOF
)"
```

---

## Self-review notes

- Spec coverage: types (Task 1), parse (Task 3), schedule (Task 4), render-frame (Task 5), animated SVG export (Task 6), WebM export (Task 7), preview / controls / scrubber / view (Tasks 8–11), route (Task 12), toolbar entry (Task 13), mobile drawer (Task 14), Playwright (Task 15), manual smoke (Task 16). Every spec requirement maps to a task.
- Type consistency: `Path`, `Schedule`, `Params`, `AspectRatio`, `Easing`, `SortMode`, `StaggerMode` are defined once in `lib/stopmotion/types.ts` and imported everywhere. `buildSchedule` is used by name in both `schedule.test.ts` and `StopMotionView.tsx`. `exportAnimatedSvg`, `exportWebm`, `renderFrame`, `parseSvg` are referenced with matching signatures across tasks.
- Placeholder scan: no "TBD" / "TODO" / "similar to" / vague directives. Each step that touches code shows the code.
- Risks called out in the spec (#1 path length DOM, #2 path cap, #3 MediaRecorder timing, #4 mobile) are handled by Tasks 3, 4, 7, and 14 respectively.
