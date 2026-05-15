# Video → Stop-Motion

**Date:** 2026-05-15
**Status:** Design approved, ready for implementation plan
**Scope:** New playground feature. The user drops a short video onto the existing uploader; the browser samples it, sends each sampled frame through the existing vectorization pipeline, and produces a true stop-motion animation made of vectorized frames. The user reviews it in a new in-product view and exports as an animated SVG or a WebM video.

## Background

VectorDrop converts a single raster image into an SVG. We are extending that into the time dimension: a short input video is sampled at a low frame rate, each sampled frame is vectorized as an SVG, and the frames are played back in sequence at the same low rate. The result is a real stop-motion animation — discrete frame jumps, no in-between interpolation — where every output frame is a true SVG.

This is a separate feature from the existing "Stop Motion" view shipped earlier in this branch line, which animates a single SVG's paths drawing themselves on. That existing feature is more accurately a **line-trace** / self-draw effect and is renamed in this spec to free the "stop motion" name for this work.

## Constraints

**Tight v1:**

- Maximum video duration: **5 seconds**.
- Maximum file size: **25 MB**.
- Sampling rate: **8 fps**, capped at 40 frames total. A 3-second video samples ~24 frames; a 5-second one samples 40.
- Allowed input MIME: `video/mp4`, `video/webm`, `video/quicktime`. Everything else is rejected at the file picker.

These limits keep wall-clock processing under ~1 minute and make storage cost obvious (about 1 MB per project).

## User flow

1. The existing image uploader gains MIME branching: `image/*` keeps the current behavior; an accepted video MIME routes into this new flow; anything else is rejected with the existing error UI.
2. **Pre-flight validation** runs entirely in the browser before anything is uploaded: file size against the 25 MB cap, and a hidden `<video>` element's `loadedmetadata` event provides duration to enforce the 5-second cap. Failures show a clear error stating the limits.
3. The video file is uploaded once to Supabase Storage at `projects/<id>/source.<ext>`. A `projects` row is created with `kind = 'video'`. The user is redirected to `/processing/video/[projectId]`.
4. The processing route shows the original video looping on the left, a frame strip of placeholder squares below, and a "Frame N of M" progress indicator with a Cancel button. As each frame is vectorized, its thumbnail fills in.
5. When all frames are vectorized, the user is auto-navigated to `/editor/[projectId]/stopmotion` — the new view, dedicated to video projects.
6. In the stop-motion view: play/pause, scrub by frame, adjust per-frame hold duration (60–500 ms), pick an export aspect ratio (1:1 / 9:16 / 16:9), and export as **Animated SVG** or **Video (.webm)**.

## Client pipeline (browser-side)

A single React component, `VideoStopMotionProcessor`, owns the pipeline. It runs entirely in the browser until the per-frame convert call:

1. **Probe & sample plan.** Load the file into a hidden `<video>` element; once `loadedmetadata` fires, read `duration` and `videoWidth/Height`. Build the timestamp list:

    ```ts
    const samplingFps = Math.min(8, Math.floor((maxFrames - 1) / duration) + 1)
    const stepSec = 1 / samplingFps
    const stamps = []
    for (let t = 0; t <= duration && stamps.length < maxFrames; t += stepSec) stamps.push(t)
    ```

2. **Sequential seek-and-capture loop.** For each timestamp:

    ```ts
    video.currentTime = t
    await new Promise<void>((resolve) => video.addEventListener('seeked', () => resolve(), { once: true }))
    // small buffer for browsers that fire seeked before the decoded frame arrives
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    ctx.drawImage(video, 0, 0, W, H)
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'))
    ```

3. **Per-frame convert.** Each PNG blob is POSTed to `POST /api/projects/[id]/frames/[idx]/convert` (multipart). The server runs the existing potrace-based conversion and inserts a `project_frames` row, returning the new frame's `svg_url`.

4. **Back-pressure.** One request in flight at a time. The existing per-IP rate limit kicks in only on abuse; normal sequential use never hits it.

5. **Cancellation.** An `AbortController` is wired through every `fetch`. On cancel: stop the loop and call `DELETE /api/projects/[id]` to clean up the half-built project and its storage objects.

6. **Resilience.** A single frame's convert failure is retried once. A second failure logs the index and continues — the playback simply drops that beat, which is preferable to failing the whole render.

7. **Resume on refresh.** Because each `project_frames` row inserts as it completes, refreshing the processing page re-lists already-converted frames and resumes from the first missing index.

## Server pipeline & data model

### Schema additions

```sql
-- supabase/migrations/0010_project_frames.sql
alter table projects add column kind text not null default 'image';
-- 'image' | 'video' — drives which editor route opens.

create table project_frames (
  project_id   uuid not null references projects(id) on delete cascade,
  frame_idx    int  not null,
  svg_url      text not null,
  duration_ms  int  not null,
  primary key (project_id, frame_idx)
);
create index project_frames_project_idx on project_frames (project_id, frame_idx);
alter table project_frames enable row level security;
-- No policies: service-role only. Reads go through API routes that already enforce ownership.
```

### Storage layout

```
projects/<project_id>/
  source.{mp4|webm|mov}     # original video, kept for reprocessing
  frames/0001.svg
  frames/0002.svg
  …
  frames/0040.svg
```

Frame indices are 1-based and zero-padded for sorted listing.

### API routes

- `POST /api/projects` (existing route, extended) — accepts `{ kind: 'video' }` to pre-create the project shell and upload the source video.
- `POST /api/projects/[id]/frames/[idx]/convert` (new) — multipart body containing one frame PNG. Runs the existing convert pipeline against that PNG, writes the SVG to `projects/<id>/frames/<idx>.svg`, inserts a `project_frames` row, returns `{ svg_url }`. Ownership check matches the existing convert route.
- `GET /api/projects/[id]/frames` (new) — ownership-checked; returns the ordered list of `{ frame_idx, svg_url, duration_ms }`.

## Playback & export

### Playback model

- Each frame holds for `duration_ms` (default `1000 / samplingFps`, i.e., 125 ms at 8 fps). The view exposes a slider (60–500 ms per frame); a single value applies to all frames in v1.
- The view fetches the frame list, then fetches each `svg_url` as text and caches the strings in component state.
- Render is `dangerouslySetInnerHTML` of the current frame's SVG string into a fixed-aspect container.
- Playback is a `setTimeout` chain: render frame N, schedule `advance` after `duration_ms`. Scrubbing jumps directly to a frame — no interpolation.

### Animated SVG export

A pure-string generator. Each frame's SVG body is inlined into a `<g>` wrapped with `<set>` tags that flip `visibility` on its timeline window:

```xml
<svg viewBox="...">
  <g visibility="hidden">
    <set attributeName="visibility" to="visible" begin="0s" dur="0.125s" fill="freeze"/>
    <set attributeName="visibility" to="hidden" begin="0.125s" fill="freeze"/>
    <!-- frame 0 inner contents inlined here -->
  </g>
  <g visibility="hidden">
    <set attributeName="visibility" to="visible" begin="0.125s" dur="0.125s" fill="freeze"/>
    <set attributeName="visibility" to="hidden" begin="0.25s" fill="freeze"/>
    <!-- frame 1 inner contents -->
  </g>
  ...
</svg>
```

Each frame's window is `[i * d, (i+1) * d)`. Result is one self-contained `.svg` with no JavaScript that plays in any modern browser, design tool, or preview pane. Generation is synchronous and under 200 ms for 40 frames.

### WebM video export

Reuses `export-webm.ts` from the existing line-trace feature, generalized to accept a `renderAt(t: number) => string` callback instead of hard-coding the line-trace renderer. For video stop-motion, `renderAt(t)` returns the current frame's SVG string (no interpolation — pick the frame index whose window contains `t`). The canvas + `MediaRecorder(video/webm;codecs=vp9)` pipeline is identical.

### Aspect ratio

Same `1:1 / 9:16 / 16:9` picker. The original source is letterboxed onto a white canvas of the chosen aspect; default `1:1`.

## Architecture

### File structure

**New files:**

```
lib/video-stopmotion/
  probe-video.ts                  # File → { duration, width, height } via <video>.loadedmetadata
  sample-plan.ts                  # (duration, samplingFps, maxFrames) → number[]
  extract-frame.ts                # (videoEl, t, canvas) → Promise<Blob>
  convert-frames.ts               # orchestrator: plan → per-frame fetch loop with abort + retry-once
  export-animated-svg.ts          # frames[] + durations[] → <set visibility> SVG string

components/video-stopmotion/
  VideoStopMotionProcessor.tsx    # /processing/video/[projectId] screen
  VideoStopMotionView.tsx         # /editor/[projectId]/stopmotion view (video projects)
  FrameStrip.tsx                  # bottom thumbnail strip, reused in processor + view

app/(app)/processing/video/[projectId]/page.tsx
app/(app)/editor/[projectId]/stopmotion/page.tsx       # video-project view (replaces existing line-trace page at this path)

app/api/projects/[id]/frames/route.ts                  # GET list
app/api/projects/[id]/frames/[idx]/convert/route.ts    # POST a frame PNG

supabase/migrations/0010_project_frames.sql

__tests__/unit/video-stopmotion/
  sample-plan.test.ts
  convert-frames.test.ts
  export-animated-svg.test.ts

__tests__/e2e/video-stopmotion/
  video-stopmotion.spec.ts
```

**Modified files:**

- The existing image uploader component — branch on MIME; route video uploads to the new processor.
- `lib/stopmotion/export-webm.ts` — generalize to accept a `renderAt(t) => string` callback so video-stopmotion can reuse it.

**Renamed (separate commit, no behavior change):**

The existing "Stop Motion" feature is more accurately a line-trace / self-draw effect. Rename:

```
lib/stopmotion/                    →  lib/line-trace/
components/editor/stopmotion/      →  components/editor/line-trace/
components/editor/StopMotionButton.tsx → components/editor/LineTraceButton.tsx (label: "Line Trace")
app/(app)/editor/[projectId]/stopmotion/ → app/(app)/editor/[projectId]/linetrace/
```

The new video → stop-motion feature reclaims the `stopmotion` directory and route.

### Boundaries

- `probe-video`, `sample-plan`, `extract-frame`, `export-animated-svg` are pure or take their DOM dependency as an argument. Fully unit-testable.
- `convert-frames` is the orchestrator — uses `fetch` (mock at the test boundary) and `AbortController`. Testable with a fake fetch.
- `VideoStopMotionProcessor` and `VideoStopMotionView` are thin shells wiring pure modules to React state. Local `useReducer` per view; no new global store.

## Testing

**Unit (Vitest):**

- `sample-plan.test.ts` — short (1 s), medium (3 s), and at-cap (5 s) durations produce the expected timestamp counts and spacing; never exceeds `maxFrames`.
- `convert-frames.test.ts` — with a mocked fetch: progress callbacks fire monotonically `0 → 1`, a single failed frame retries once then continues, an aborted controller short-circuits the loop, resume-from-existing skips already-completed indices.
- `export-animated-svg.test.ts` — output is well-formed XML in happy-dom; `<set>` `begin + dur` pairs cover the full timeline contiguously; empty input returns a minimal SVG.

**Integration (Playwright):**

- Add a 3-second `.mp4` fixture to `tests/fixtures/`.
- Drag onto the existing uploader, confirm the processing route loads, frame strip populates over time, and the stop-motion view is auto-opened on completion.
- Confirm scrubbing changes the rendered SVG; click **Export Animated SVG**, confirm a `.svg` download fires.

**Out of scope for tests:** WebM export quality (`MediaRecorder` timing is browser-dependent). Smoke-test manually before each release.

## Known risks and mitigations

1. **`<video>.seeked` is not always frame-accurate.** Some browsers fire `seeked` before the decoded frame is ready. Mitigation: pair `seeked` with a `requestAnimationFrame` wait before drawing to canvas. If problems persist, fall back to `requestVideoFrameCallback` where available.
2. **Long-running client tab** (~40 seconds of converts). Browsers may throttle a backgrounded tab. Mitigation: `project_frames` rows persist after each frame, so refresh resumes from the first missing index; a tab put to sleep mid-render is recoverable.
3. **Codecs / containers.** Restrict to `mp4 / webm / mov` in `accept=` and in client MIME checks. Reject anything else clearly.
4. **Storage cost.** Each project is roughly 1 MB. Deliberate non-goal for v1: a scheduled cleanup to delete video projects (and their `frames/` objects) older than 30 days. Track as a fast-follow.

## Out of scope (deliberate)

- Per-frame variable duration (slider applies one duration to all frames in v1).
- GIF export (animated SVG covers web embed; WebM covers social; GIF is a fast-follow).
- Server-side MP4 (real MP4 needs `ffmpeg`; WebM is fine for social platforms in v1).
- Background music / audio tracks.
- Editing individual frames (deleting, reordering, swapping). The output is "what was sampled, vectorized as-is."
- Storage retention cleanup cron — track as a fast-follow.
