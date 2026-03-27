# v2 · Icon Style Transfer — Full Implementation Plan

> **Objective:** Add a new v2 section to the app where a user uploads an icon image,
> pastes the URL of any icon library, and receives a clean SVG icon redrawn in that
> library's exact design language — governed by the 7 principles in
> `lib/ai/icon-design-principles.md`.

---

## Table of Contents

1. [What We Have (v1 Audit)](#1-what-we-have-v1-audit)
2. [What v2 Adds](#2-what-v2-adds)
3. [Architecture Overview](#3-architecture-overview)
4. [Data Model Changes](#4-data-model-changes)
5. [Phase Breakdown](#5-phase-breakdown)
6. [File Map — Every File Touched or Created](#6-file-map)
7. [AI Prompt Strategy](#7-ai-prompt-strategy)
8. [Icon Design Principles Enforcement](#8-icon-design-principles-enforcement)
9. [Caching Strategy](#9-caching-strategy)
10. [Error Handling Contract](#10-error-handling-contract)
11. [Rate Limiting](#11-rate-limiting)
12. [Open Questions / Decisions](#12-open-questions--decisions)

---

## 1. What We Have (v1 Audit)

### Working infrastructure (carry forward unchanged)
| Component | File | Purpose |
|---|---|---|
| Image upload + conversion pipeline | `app/api/projects/**` | Raster → SVG via tracing |
| AI image analysis | `lib/ai/analyze.ts` | Claude vision — extracts colors + themes |
| AI SVG restyle | `lib/ai/restyle.ts` | Claude tool_use — applies color theme to SVG |
| AI icon generation | `lib/ai/generateIcon.ts` + `app/api/ai/generate-icon/route.ts` | Text/vision → SVG icon |
| Redis caching | `lib/cache/redis.ts` | SHA-256 keyed, Upstash |
| Auth + RLS | `lib/api/supabase.ts` + migrations | Supabase Auth, per-user data isolation |
| Rate limiting | `lib/cache/redis.ts` (aiRatelimit, aiGenerateRatelimit) | Per-user token bucket |
| Icon library | `app/api/icons/**` + `components/icons/**` | Public + private icon storage |
| Error handling | `lib/types.ts` (AppError) + `lib/api/handleError.ts` | Structured error codes |
| AppError codes | `lib/types.ts` | VALIDATION / UNAUTHORIZED / RATE_LIMITED / etc. |

### v1 limitation relevant to v2
The existing `restyleSVG` applies **color themes** only — it changes fills/strokes but
preserves path geometry. v2 needs **structural style transfer** — redrawing paths to
match stroke weight, linecap, corner radius, and grid conventions of a target library.
These are different operations and require a different prompt + schema.

---

## 2. What v2 Adds

```
User uploads icon image (PNG / JPEG / WebP)
             ↓
     Image → SVG  [existing pipeline]
             ↓
User pastes icon library URL
  e.g. https://phosphoricons.com
       https://lucide.dev
       https://heroicons.com
             ↓
  Style DNA extraction  [NEW]
  — fetch sample SVGs from the URL
  — Claude analyzes geometry rules
  — returns IconStyleDNA struct
             ↓
  Style Transfer  [NEW]
  — Claude redraw: same semantic concept
  — enforces DNA rules on every path
  — governed by 7 design principles
             ↓
  Output: clean SVG in target style
  — before/after preview
  — download + save to My Icons
```

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  app/(app)/v2/page.tsx   (new page, new nav entry)              │
│                                                                 │
│  Step 1: Upload icon image  →  existing DropZone component      │
│  Step 2: Paste library URL  →  new URLInput component           │
│  Step 3: [Analyse Style]    →  POST /api/ai/extract-dna  (new)  │
│  Step 4: DNA preview card   →  new StyleDNACard component       │
│  Step 5: [Convert]          →  POST /api/ai/style-transfer (new)│
│  Step 6: Before/After view  →  new ComparisonViewer component   │
│  Step 7: Download / Save    →  existing /api/icons POST         │
└─────────────────────────────────────────────────────────────────┘

Server-side AI pipeline (new):

  extractStyleDNA(url)
    ├── fetch URL HTML
    ├── parse SVG links / inline SVGs (node-html-parser)
    ├── download 6–8 sample SVGs
    └── Claude: analyze samples → IconStyleDNA
              cached in Redis (key: sha256(url), TTL: 7d)

  styleTransfer(svgContent, dna)
    ├── validate input SVG
    ├── build style-transfer prompt (uses icon-design-principles.md rules)
    ├── Claude tool_use: redraw_icon → { svg, description, pathCount }
    ├── validate output SVG
    └── cache result (key: sha256(svgContent + dnaId), TTL: 3d)
```

---

## 4. Data Model Changes

### New TypeScript types  (`lib/types.ts`)

```ts
// The extracted design language of an icon library
export interface IconStyleDNA {
  id: string                          // sha256(sourceUrl).slice(0,16)
  libraryName: string                 // e.g. "Phosphor Icons"
  sourceUrl: string
  gridSize: 16 | 20 | 24 | 32
  safeAreaPadding: number             // px inset from edge
  strokeWidth: number                 // e.g. 1.5
  strokeLinecap: 'round' | 'square' | 'butt'
  strokeLinejoin: 'round' | 'miter' | 'bevel'
  cornerRadius: 'sharp' | 'slight' | 'rounded' | 'pill'
  fillStyle: 'outline' | 'filled' | 'duotone' | 'bold' | 'thin'
  colorMode: 'currentColor' | 'hardcoded' | 'multi'
  personality: string[]               // e.g. ['delicate','airy','minimal']
  complexityTarget: 2 | 3 | 4 | 5
  sampleCount: number
  extractedAt: string                 // ISO timestamp
}

// API request/response for style transfer
export interface ExtractDNARequest {
  url: string
}

export interface ExtractDNAResponse {
  dna: IconStyleDNA
  cached: boolean
}

export interface StyleTransferRequest {
  svgContent: string                  // the source icon SVG
  dnaId: string                       // IconStyleDNA.id (previously extracted)
}

export interface StyleTransferResponse {
  svgContent: string                  // redrawn SVG
  description: string
  pathCount: number
  appliedDna: IconStyleDNA
}
```

### New Zod schemas  (`lib/ai/schemas.ts` — additions)

```ts
export const IconStyleDNASchema = z.object({
  id: z.string(),
  libraryName: z.string(),
  sourceUrl: z.string().url(),
  gridSize: z.union([z.literal(16), z.literal(20), z.literal(24), z.literal(32)]),
  safeAreaPadding: z.number().min(0).max(4),
  strokeWidth: z.number().min(0.5).max(4),
  strokeLinecap: z.enum(['round', 'square', 'butt']),
  strokeLinejoin: z.enum(['round', 'miter', 'bevel']),
  cornerRadius: z.enum(['sharp', 'slight', 'rounded', 'pill']),
  fillStyle: z.enum(['outline', 'filled', 'duotone', 'bold', 'thin']),
  colorMode: z.enum(['currentColor', 'hardcoded', 'multi']),
  personality: z.array(z.string()).min(1).max(5),
  complexityTarget: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  sampleCount: z.number().int().min(1),
  extractedAt: z.string(),
})

export const StyleTransferToolInputSchema = {
  type: 'object',
  properties: {
    svg: { type: 'string', minLength: 1, description: 'Complete redrawn SVG string' },
    description: { type: 'string', description: 'What concept the icon depicts' },
    pathCount: { type: 'number', description: 'Number of <path> elements used' },
  },
  required: ['svg', 'description', 'pathCount'],
}

export const AIStyleTransferSchema = z.object({
  svg: z.string().min(1),
  description: z.string().optional().default(''),
  pathCount: z.number().int().min(1).max(64).optional(),
})
```

### No new database tables needed
- Extracted DNAs are cached in **Redis only** (7d TTL) — they are transient/derived data
- Transferred icons are saved to the **existing `icons` table** (same as generate-icon flow)
- No migration required for v2

---

## 5. Phase Breakdown

### Phase 1 — Style DNA Extraction
**Goal:** Given a URL, reliably extract the design language of that icon library.

**New file:** `lib/ai/extractStyleDNA.ts`

Steps:
1. Validate URL (must be http/https, not localhost)
2. `fetch(url)` server-side — follow redirects, 10s timeout
3. Parse HTML with `node-html-parser` to find:
   - `<img src="*.svg">` tags
   - `<svg>` inline blocks
   - Links to SVG files (`href="*.svg"`)
4. Download up to **8 SVG samples** (parallel, Promise.allSettled)
5. Build a prompt with all sample SVGs embedded
6. Call Claude (`claude-haiku-4-5`) with `extract_style_dna` tool
7. Validate response against `IconStyleDNASchema`
8. Cache at `ai:dna:{sha256(url).slice(0,16)}` with 7d TTL
9. Return `IconStyleDNA`

**Fallback:** If fewer than 3 samples can be extracted, throw
`AppError.validation("Could not find enough SVG icons at this URL")`.

**New route:** `app/api/ai/extract-dna/route.ts`
- POST `{ url: string }`
- Auth required
- Rate limit: shared with `aiRatelimit`
- Returns `ExtractDNAResponse`

---

### Phase 2 — Style Transfer AI Function
**Goal:** Take an existing SVG and redraw it to match an `IconStyleDNA`.

**New file:** `lib/ai/styleTransfer.ts`

Steps:
1. Validate input SVG (reuse `isValidSVG` from `restyle.ts`)
2. Truncate SVG if > 32k chars (reuse `truncateSVG`)
3. Build the style transfer prompt (see Section 7)
4. Call Claude (`claude-sonnet-4-6`) — this is more complex than restyle, use Sonnet
5. Extract `tool_use` block → `AIStyleTransferSchema`
6. Validate output SVG
7. Post-process: ensure `stroke="currentColor"` if DNA says `currentColor`
8. Cache at `ai:style-transfer:{sha256(svg+dnaId).slice(0,16)}` with 3d TTL
9. Return `{ svg, description, pathCount }`

**Model choice rationale:**
- DNA extraction → Haiku (pattern recognition, cheap)
- Style transfer → Sonnet (geometric reasoning, path redrawing is hard)

**New route:** `app/api/ai/style-transfer/route.ts`
- POST `{ svgContent: string, dnaId: string }`
- Looks up DNA from Redis by `dnaId` — if missing, returns 404 with message
  "Style DNA expired or not found — re-analyse the URL first"
- Auth required
- Rate limit: `aiGenerateRatelimit` (shared with generate-icon, most expensive)
- Returns `StyleTransferResponse`

---

### Phase 3 — New v2 UI
**Goal:** A focused, two-step UI that makes the workflow obvious.

**New files:**
- `app/(app)/v2/page.tsx` — page component
- `components/v2/URLInput.tsx` — URL input with validation + analyse button
- `components/v2/StyleDNACard.tsx` — displays extracted DNA in human-readable form
- `components/v2/ComparisonViewer.tsx` — side-by-side before/after SVG preview

**Page layout:**

```
┌──────────────────────────────────────────────────────────┐
│  v2 · Icon Style Transfer                     [nav links] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  STEP 1 — Upload your icon                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [DropZone — reused from v1]                       │  │
│  └────────────────────────────────────────────────────┘  │
│  → on upload: auto-convert to SVG (existing pipeline)    │
│                                                          │
│  STEP 2 — Target icon library URL                        │
│  ┌──────────────────────────────────────┐ [Analyse Style]│
│  │  https://phosphoricons.com           │                │
│  └──────────────────────────────────────┘                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  StyleDNACard (appears after analysis)             │  │
│  │  Phosphor Icons · 24px grid · 1.5px stroke         │  │
│  │  round caps · round joins · outline style          │  │
│  │  Personality: versatile, systematic, structured    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│                        [Convert to this style]           │
│                                                          │
│  ┌──────────────────┬─────────────────────────────────┐  │
│  │  Original        │  Converted                      │  │
│  │  [SVG preview]   │  [SVG preview]                  │  │
│  │                  │  [Download SVG] [Save to Icons] │  │
│  └──────────────────┴─────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**State machine (in page component):**
```
idle
  → uploading (file dropped)
  → upload_done (SVG ready)
  → analysing (URL submitted)
  → analysis_done (DNA ready)
  → transferring (Convert clicked)
  → done (result SVG ready)
  → error (any step)
```

**Nav addition:** Add "v2 · Style Transfer" link to the nav in
`app/(app)/layout.tsx` alongside existing Dashboard / Icon Library links.

---

### Phase 4 — Principle Enforcement in Prompts
**Goal:** The 7 principles from `lib/ai/icon-design-principles.md` are not just
documentation — they are embedded as hard constraints in every AI prompt.

New constant in `lib/ai/prompts.ts`:

```ts
export const STYLE_TRANSFER_SYSTEM_PROMPT = `...` // see Section 7
export const EXTRACT_DNA_SYSTEM_PROMPT = `...`     // see Section 7
```

---

## 6. File Map

### New files to create
```
lib/ai/
  extractStyleDNA.ts          Phase 1 — DNA extraction function
  styleTransfer.ts            Phase 2 — style transfer function

app/api/ai/
  extract-dna/route.ts        Phase 1 — API route
  style-transfer/route.ts     Phase 2 — API route

app/(app)/
  v2/page.tsx                 Phase 3 — v2 page

components/v2/
  URLInput.tsx                URL input + validate + analyse button
  StyleDNACard.tsx            Visual display of extracted IconStyleDNA
  ComparisonViewer.tsx        Side-by-side SVG before/after
```

### Existing files to modify
```
lib/types.ts                  Add: IconStyleDNA, ExtractDNARequest/Response,
                                   StyleTransferRequest/Response

lib/ai/schemas.ts             Add: IconStyleDNASchema, IconStyleDNAToolInputSchema,
                                   StyleTransferToolInputSchema, AIStyleTransferSchema

lib/ai/prompts.ts             Add: EXTRACT_DNA_SYSTEM_PROMPT,
                                   STYLE_TRANSFER_SYSTEM_PROMPT

app/(app)/layout.tsx          Add: "v2 · Style Transfer" nav link
```

### Files that do NOT change
```
lib/ai/restyle.ts             Untouched — v1 restyle is different operation
lib/ai/analyze.ts             Untouched
lib/ai/generateIcon.ts        Untouched
lib/cache/redis.ts            Untouched — new routes reuse existing rate limiters
app/api/icons/route.ts        Untouched — v2 save uses this as-is
components/upload/DropZone.tsx Reused as-is
```

---

## 7. AI Prompt Strategy

### `EXTRACT_DNA_SYSTEM_PROMPT`
```
You are an expert icon designer analyzing an icon library's design language.

You will receive multiple SVG samples from the same icon library. Your task is
to extract the unified design DNA — the exact visual rules that make this library
consistent.

Use the extract_style_dna tool to return:
- gridSize: the viewBox dimension (16, 20, 24, or 32)
- strokeWidth: the consistent stroke weight across samples
- strokeLinecap: round / square / butt
- strokeLinejoin: round / miter / bevel
- cornerRadius: sharp (no rounding) / slight (subtle) / rounded / pill
- fillStyle: outline / filled / duotone / bold / thin
- colorMode: currentColor (CSS-friendly) / hardcoded / multi-color
- personality: 1–5 adjectives describing the library's character
- complexityTarget: average path count (2–5)

Base your analysis only on what you observe in the samples. If samples are
inconsistent, report the majority convention.
You MUST call the extract_style_dna tool — do not respond with plain text.
```

### `STYLE_TRANSFER_SYSTEM_PROMPT`
```
You are an expert icon designer. You will receive an SVG icon and the design DNA
of a target icon library. Your task is to REDRAW the icon so it looks like it
belongs to that library.

## 7 Principles you must enforce (Helena Zhang, UX Collective)

1. CLARITY — Preserve the semantic concept exactly. The redrawn icon must depict
   the same thing as the original. Do not change what it means.

2. READABILITY — Maintain legibility at 16px. Minimum stroke weight as specified
   by DNA. No details finer than 1.5px at the target grid size. Internal element
   spacing must be sufficient to avoid merging.

3. ALIGNMENT — Apply optical balance, not mathematical centering. Heavy shapes
   must be shifted to appear visually centred. Test with your visual judgment,
   not by coordinates alone.

4. BREVITY — Use the fewest paths possible. Target path count is specified in
   DNA (complexityTarget). Every path must justify its existence. Strip
   decorative noise. If the concept is recognisable with fewer paths, use fewer.

5. CONSISTENCY — Enforce DNA rules on every path without exception:
   - strokeWidth: exactly as specified
   - strokeLinecap: exactly as specified
   - strokeLinejoin: exactly as specified
   - Corner treatment: match cornerRadius specification
   - All coordinates within the safe area (padding as specified)

6. PERSONALITY — Apply the personality descriptors from DNA to all design
   decisions. A 'delicate, airy' library needs lighter weight and more
   whitespace than a 'bold, structured' one.

7. EASE OF USE — Output must use stroke="currentColor" fill="none" (outline) or
   fill="currentColor" (filled) — never hardcode color values unless DNA
   colorMode is 'hardcoded'. Clean paths only. No groups, no transforms, no
   inline styles, no comments.

## Hard rules — never break these
- viewBox must be "0 0 {gridSize} {gridSize}" as specified in DNA
- ONLY <path> elements — convert all geometry to path data
- No <circle>, <rect>, <ellipse>, <polygon>, <line>, <g>, <defs>
- Round all coordinates to 1 decimal place
- All coordinates within safe area: padding to (gridSize - padding)
- Call the redraw_icon tool — never respond with plain text
```

---

## 8. Icon Design Principles Enforcement

The principles in `lib/ai/icon-design-principles.md` map to specific technical
constraints enforced at three layers:

| Principle | Prompt constraint | Code validation |
|---|---|---|
| Clarity | "Preserve semantic concept exactly" | — (subjective, AI-only) |
| Readability | "min stroke weight per DNA", "test at 16px" | path count ≤ DNA.complexityTarget + 2 |
| Alignment | "optical balance, not mathematical" | — (AI-only) |
| Brevity | "fewest paths. target: DNA.complexityTarget" | warn if pathCount > 6 |
| Consistency | "enforce DNA rules on every path" | post-process: rewrite stroke/fill attrs |
| Personality | "apply personality adjectives" | — (AI-only) |
| Ease of Use | "currentColor, no hardcoded colors" | post-process: enforce currentColor |

**Post-processing step in `styleTransfer.ts`:**
After Claude returns the SVG, before caching/returning:
1. Parse SVG with `fast-xml-parser`
2. For each `<path>`: enforce `stroke-linecap`, `stroke-linejoin`, `stroke-width` from DNA
3. If `dna.colorMode === 'currentColor'`: replace all hardcoded color values with `currentColor`
4. Strip any non-path elements (warn + remove)
5. Validate all coordinate values are within safe area bounds

---

## 9. Caching Strategy

| Cache key | Content | TTL | Rationale |
|---|---|---|---|
| `ai:dna:{urlHash}` | `IconStyleDNA` JSON | 7 days | Library design rarely changes |
| `ai:style-transfer:{svgHash+dnaId}` | Redrawn SVG string | 3 days | Same input → same output |
| `ai:analysis:{imageHash}` | `AISuggestion` (existing) | 7 days | Unchanged |
| `ai:restyle:{svgHash+themeId}` | Restyled SVG (existing) | 3 days | Unchanged |

DNA lookup in `style-transfer` route:
- Route receives `dnaId` (the hash prefix)
- Looks up `ai:dna:{dnaId}` in Redis
- If not found: 404 "Style DNA expired — re-analyse the URL"
- This means the UI must always call extract-dna first and pass the returned `dna.id`

---

## 10. Error Handling Contract

All new routes follow the existing `AppError` + `handleError` pattern.

| Scenario | AppError type | Message |
|---|---|---|
| URL is not http/https | `validation` | "URL must start with http:// or https://" |
| URL fetch fails / 404 | `validation` | "Could not reach the provided URL" |
| < 3 SVG samples found | `validation` | "Not enough SVG icons found at this URL" |
| DNA not in Redis | `notFound` | "Style DNA not found — re-analyse the URL first" |
| Input SVG invalid | `validation` | "Provided SVG is not valid" |
| Claude returns invalid SVG | pipeline | fallback: return original SVG, log error |
| Anthropic 429 | re-throw | existing rate limit handler catches |
| Missing env vars | `internal` | logged server-side, generic 500 to client |

---

## 11. Rate Limiting

v2 reuses existing Redis rate limiters — no new limiters needed.

| Route | Limiter used | Reasoning |
|---|---|---|
| `POST /api/ai/extract-dna` | `aiRatelimit` | Same cost as analyze |
| `POST /api/ai/style-transfer` | `aiGenerateRatelimit` | Same cost as generate-icon (Sonnet) |

---

## 12. Open Questions / Decisions

| # | Question | Current decision | Revisit if |
|---|---|---|---|
| 1 | Which Claude model for style transfer? | **Sonnet** — geometric path reasoning is complex | Costs too high → downgrade to Haiku with more explicit prompt |
| 2 | What if a URL has no discoverable SVGs? (e.g. SVGs are served as JSX components) | Return validation error, suggest they paste a direct SVG URL or CDN link | Common enough to warrant a fallback scraping strategy |
| 3 | Should DNA be stored in Supabase for sharing/reuse across users? | **No for now** — Redis only. Same URL = same cache hit regardless of user | If we add "DNA library" feature (saved styles) |
| 4 | Should the before/after comparison allow manual path editing? | **No** — that's the v1 editor's job. v2 is generation only | If users want to tweak output |
| 5 | Do we need a new `style_transfers` DB table for history? | **No for now** — save output to existing `icons` table with `source: 'style-transfer'` tag | If we want analytics on transfer usage |
| 6 | SVG sources like Heroicons / Lucide serve components, not raw SVGs — how do we handle this? | Phase 1: only handle sites that serve raw `.svg` files. Document this limitation clearly in the UI | Phase 2: add npm package parsing (download the package, read SVG files) |

---

## Build Order

```
1. lib/types.ts                    — add new types (no deps)
2. lib/ai/schemas.ts               — add new Zod schemas (no deps)
3. lib/ai/prompts.ts               — add two new system prompts (no deps)
4. lib/ai/extractStyleDNA.ts       — DNA extraction function
5. app/api/ai/extract-dna/route.ts — wire extraction into API
6. lib/ai/styleTransfer.ts         — style transfer function
7. app/api/ai/style-transfer/route.ts — wire transfer into API
8. components/v2/URLInput.tsx      — UI: URL input component
9. components/v2/StyleDNACard.tsx  — UI: DNA display card
10. components/v2/ComparisonViewer.tsx — UI: before/after preview
11. app/(app)/v2/page.tsx          — UI: full page, state machine
12. app/(app)/layout.tsx           — add nav link
```

Each step is independently testable before moving to the next.
