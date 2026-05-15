# Stop-Motion SVG Export

**Date:** 2026-05-15
**Status:** Design approved, ready for implementation plan
**Scope:** New playground feature. Users open a stop-motion view from the editor, scrub through a path-by-path self-drawing reconstruction of their SVG, tweak animation parameters, and export the result as an animated SVG or a WebM video.

## Background

VectorDrop converts raster images to clean SVGs. Once an SVG is generated it is static — a single still asset. Users (designers, marketers, content creators) repeatedly ask for shareable "logo draws itself" animations. We can produce these directly from the SVG we already have, with no extra AI cost, by replaying the paths in sequence using a classic `stroke-dasharray` self-draw effect.

This feature ships in two halves:
1. An in-product **scrubbable preview** so the user can author the animation visually (pick duration, stagger, draw order, etc.).
2. Two **export paths** — animated SVG (instant, pure XML) and WebM video (client-side via MediaRecorder).

No backend, DB, or AI pipeline changes are required. The animation is reconstructed at view time from the existing SVG.

## User flow

1. User finishes converting an image; the editor view shows the result.
2. A new **Stop Motion** icon button appears in the editor's right toolbar/actions strip, beside the existing Export action. It is disabled until the conversion has finished.
3. Clicking the button navigates to `/editor/[projectId]/stopmotion` — a full-screen, deep-linkable route.
4. The view shows:
   - Left two-thirds: the live preview canvas.
   - Right one-third: animation controls and export buttons.
   - Bottom: a scrubbable timeline with a play button.
5. Scrub by dragging the timeline, scrolling the mouse wheel over the preview, or pressing arrow keys.
6. Two export buttons: **Export Animated SVG** (instant download) and **Export Video (.webm)** (records for the animation duration, then downloads).

A dedicated route is used rather than a modal so exports survive accidental dismissal and so the preview is shareable as a URL.

## Animation engine

At any scrub position `t ∈ [0, 1]` each path is in one of three states determined by per-path `pathStart[i]` and `pathEnd[i]` derived from the chosen animation parameters:

- `t < pathStart[i]` → invisible.
- `pathStart[i] ≤ t ≤ pathEnd[i]` → drawing: `stroke-dashoffset` animates from `getTotalLength()` down to `0`. Fill opacity ramps `0 → 1` during the last 30% of the path's window, so the outline lands first and then "fills in".
- `t > pathEnd[i]` → fully painted; no stroke, full fill.

**Draw order.** Default: descending by `getBBox().width * height` (big shapes block in first, small details land last — the natural "stop-motion" silhouette-to-detail rhythm). Override: original document order.

**Stagger.** Two presets:
- *Sequential* (default) — `stagger = pathDuration`, paths draw one after another. Mechanical, frame-by-frame feel.
- *Overlapped* — `stagger = pathDuration * 0.4`, smoother flow.

**Easing.** Default linear (preserves the mechanical stop-motion cadence). Ease-in-out available.

**Controls exposed:**

| Control | Range / values | Default |
|---|---|---|
| Total duration | 1 – 30 s | 6 s |
| Stagger preset | Sequential / Overlapped | Sequential |
| Draw order | By size / Document order | By size |
| Stroke color | Color picker | Path fill, darkened |
| Easing | Linear / Ease-in-out | Linear |
| Export aspect | 1:1 / 9:16 / 16:9 (video only) | 1:1 |

No FPS knob in v1. FPS only enters at video export and is fixed at 60.

## Export pipeline

### Animated SVG (instant, pure string generation)

Walk the parsed paths and emit `<animate>` tags directly:

```xml
<path d="..." fill="..." stroke="..." stroke-width="2"
      stroke-dasharray="L" stroke-dashoffset="L" fill-opacity="0">
  <animate attributeName="stroke-dashoffset" from="L" to="0"
           begin="T0s" dur="Td s" fill="freeze"/>
  <animate attributeName="fill-opacity" from="0" to="1"
           begin="T0+0.7*Td s" dur="0.3*Td s" fill="freeze"/>
</path>
```

The result is a single self-contained `.svg` file, no JavaScript, no external dependencies. Generated synchronously in <50 ms and offered to the user as a download via a Blob URL.

### WebM video (client-side, MediaRecorder)

1. Create an off-screen `<canvas>` sized to the user's chosen aspect (default 1080 × 1080).
2. Run a `requestAnimationFrame` loop that advances `t` from 0 to 1 over the chosen total duration.
3. At each frame, call `render-frame.ts` to produce an SVG string for the current `t`, draw it onto the canvas via an `<img>` → `canvas.drawImage()` round trip.
4. `canvas.captureStream(60)` feeds a `MediaRecorder` (`video/webm;codecs=vp9`); recording stops when the loop ends; the resulting blob is offered as a download.

The export button is labeled **Export Video (.webm)** — not "MP4" — because true MP4 requires either `ffmpeg.wasm` (~25 MB dependency) or a server-side render pipeline. WebM plays natively in every modern browser and uploads cleanly to Twitter, Discord, Slack, YouTube, TikTok, and Instagram (via the platforms' own transcoding). A future fast-follow can add server-side MP4 encoding via `puppeteer + ffmpeg`; not in v1.

Both export buttons show inline progress; the WebM button shows a true progress bar tied to the playback loop.

## Architecture

Frontend-only. No backend, DB, or auth changes. The route is under the existing `(app)` route group and is therefore protected by the existing Clerk middleware.

### File structure

**New:**

```
app/(app)/editor/[projectId]/stopmotion/
  page.tsx                  # route entry; loads project SVG, renders StopMotionView
  StopMotionView.tsx        # client component: owns scrub state and parameter state

lib/stopmotion/
  parse-svg.ts              # SVG string → ordered Path[] { d, fill, stroke, length, bbox }
                            #   uses an off-screen DOM node to call getTotalLength / getBBox
  schedule.ts               # (paths, params) → Schedule[] (pathStart, pathEnd per path)
                            #   pure function, fully unit-testable
  render-frame.ts           # (paths, schedule, t) → SVG string for that frame
                            #   shared by live preview and the WebM encoder
  export-animated-svg.ts    # (paths, schedule) → final SVG string with <animate> tags
  export-webm.ts            # (paths, schedule, dimensions) → Promise<Blob>

components/editor/
  StopMotionButton.tsx      # toolbar icon (lucide:clapperboard)
  StopMotionCanvas.tsx      # live preview; consumes render-frame output
  StopMotionControls.tsx    # right-panel form (duration, stagger, order, color, easing, aspect)
  StopMotionScrubber.tsx    # bottom timeline + play/pause + keyboard + scroll-wheel

__tests__/unit/stopmotion/
  parse-svg.test.ts
  schedule.test.ts
  export-animated-svg.test.ts

__tests__/integration/stopmotion/        # Playwright
  stopmotion-page.spec.ts                # navigate + snapshot at t=0/0.5/1, export SVG
```

**Modified:**
- Editor toolbar component — add `<StopMotionButton/>` next to the existing export action.

### Data flow

```
project SVG  →  parse-svg  →  Path[]
                                ↓
        controls state  →  schedule  →  Schedule[]
                                            ↓
              scrub t ∈ [0,1]  →  render-frame(paths, schedule, t)  →  SVG string
                                            ↓
                                    <StopMotionCanvas/>
                                            ↓
                         [Export Animated SVG]   [Export WebM]
                         export-animated-svg     export-webm
```

### Boundaries

- `parse-svg`, `schedule`, `render-frame`, `export-animated-svg` are all pure (or use a clearly scoped off-screen DOM helper for path measurement). Fully testable in Vitest.
- `export-webm` is the only file that touches browser-specific APIs (`canvas`, `MediaRecorder`). Single impure boundary, easy to mock at the component layer.
- Components are thin: they wire pure functions to React state. Local state via `useReducer` inside `StopMotionView.tsx` — no new global store.

## Testing

**Unit (Vitest):**
- `parse-svg.test.ts` — known SVG strings produce expected `Path[]`; nested `<g>` transforms are flattened; malformed paths are skipped; empty SVGs return `[]`.
- `schedule.test.ts` — for any `(N paths, params)`, every `pathStart[i] + pathDuration === pathEnd[i]`, the last path ends at exactly `totalDuration`, both sort orders are stable.
- `export-animated-svg.test.ts` — emitted string parses as well-formed XML in `jsdom`; one `<animate>` tag pair per input path; total timeline duration matches `totalDuration`.

**Integration (Playwright):**
- Seed a project with a known SVG, navigate to `/editor/<id>/stopmotion`, snapshot the preview at `t = 0`, `0.5`, `1`. Visual diff.
- Click **Export Animated SVG**; confirm the downloaded blob parses and contains the expected number of `<animate>` tags.

**Out of scope for automated tests:** WebM export visual quality — `MediaRecorder` timing is not deterministic across browsers. Smoke-test manually before each release.

## Known risks and mitigations

1. **`getTotalLength()` requires a rendered `<path>` element.** `parse-svg` attaches the SVG to an off-screen DOM container briefly to measure path lengths and bounding boxes, then detaches. The off-screen helper lives in `parse-svg.ts` so the impurity is contained, and `happy-dom` supports it in tests.
2. **Very complex SVGs (>500 paths)** produce chaotic-looking animations and bloated `.svg` files. Mitigation: cap visible-in-stop-motion paths at 200 by default — paths beyond the cap are merged into the previous frame's reveal. A toggle exposes "use all paths" for power users.
3. **`MediaRecorder` does not guarantee constant frame rate** across browsers. Acceptable for v1. If quality complaints arrive, that is the trigger to add `ffmpeg.wasm` or a server-side encode pipeline.
4. **Mobile viewport is tight.** On viewports < 768 px wide, hide the right-panel controls behind a bottom sheet; keep the canvas and scrubber always visible.

## Out of scope (deliberate)

- MP4 export (use WebM in v1; fast-follow with server-side `puppeteer + ffmpeg` if demand surfaces).
- Lottie or GIF export (single fast-follow once WebM ships).
- Audio overlay.
- Multi-clip / scene-based animations.
- Saving stop-motion presets to the project. (The current view starts from defaults each visit; if users repeatedly retune the same project, add preset persistence later.)
- Per-path manual reordering (drag-and-drop in the controls). Auto sort orders cover v1.
