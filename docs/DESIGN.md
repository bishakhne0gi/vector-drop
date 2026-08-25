# VectorDrop — Design System

Dark mode is the reference. Light mode is documented after it as the variant.

Everything here is defined in `app/globals.css`; fonts are wired in `app/layout.tsx`.
There is no separate config — that file *is* the source of truth.

---

## Typography

| Role | Family | CSS variable |
|---|---|---|
| Sans — body, headings, UI | **Geist** | `--font-geist-sans` |
| Mono — code, paths, numbers | **Geist Mono** | `--font-geist-mono` |

Both come from Google Fonts through `next/font` with `display: "swap"`.

Body text carries deliberate tuning — reproduce this if you're matching the look:

```css
letter-spacing: -0.011em;            /* slightly tightened */
-webkit-font-smoothing: antialiased;
font-feature-settings: "kern" 1, "liga" 1;
text-rendering: optimizeLegibility;
```

Buttons tighten a touch further, to `-0.01em`, at `font-weight: 500`.

### The fallback stack (and why you'll never see it)

`globals.css` declares the body font as:

```css
font-family: var(--font-geist-sans, -apple-system, BlinkMacSystemFont,
             "SF Pro Text", "Helvetica Neue", Arial, sans-serif);
```

Everything after the first comma is the **`var()` fallback**, which CSS uses only
when `--font-geist-sans` is *undefined*. `app/layout.tsx` applies
`geistSans.variable` to the `<html>` element, so that custom property is always
defined — meaning **this fallback chain never actually renders.** It is defensive
code guarding against the font class being removed.

None of these are downloaded or licensed; every one already exists on the user's
machine:

| Entry | What it is |
|---|---|
| `-apple-system` | A CSS keyword, not a font — resolves to the OS UI font (San Francisco on macOS/iOS) |
| `BlinkMacSystemFont` | The same idea for Blink-based browsers |
| `"SF Pro Text"` | Apple's system font, bundled with macOS |
| `"Helvetica Neue"` | Bundled with macOS and iOS |
| `Arial` | Bundled with Windows and macOS |
| `sans-serif` | Generic family — the browser's own default |

**Do not treat these as brand fonts.** The brand is Geist. If you need a
substitute for a platform that can't load it, the honest equivalent is the
system UI font, not Helvetica Neue specifically.

> While Geist is still downloading, the face you briefly see is *also* not this
> list — `next/font` generates a metric-matched local fallback automatically to
> minimise layout shift, and that takes precedence.

---

## Dark mode palette

### The three that define the brand

| | Hex | Role |
|---|---|---|
| ⬤ | **`#14b8a6`** | Accent — teal |
| ⬤ | **`#161516`** | Page background |
| ⬤ | **`#ffffff`** | Primary text |

### Surfaces

| Token | Value |
|---|---|
| `--bg-primary` | `#161516` |
| `--bg-secondary` | `#0d0d0d` |
| `--bg-card` | `#131313` |
| `--bg-panel` | `#0d0d0d` |
| `--bg-invert` | `#000000` |
| `--bg-canvas` | `#1e1e1e` |
| `--bg-subtle` | `rgba(255,255,255,0.03)` |
| `--bg-glass` | `rgba(255,255,255,0.04)` |
| `--bg-glass-strong` | `rgba(255,255,255,0.06)` |

### Text

| Token | Value |
|---|---|
| `--text-primary` | `#ffffff` |
| `--text-secondary` | `rgba(255,255,255,0.50)` |
| `--text-muted` | `rgba(255,255,255,0.28)` |

Secondary and muted text are **alpha-based, not solid hex** — they pick up whatever surface sits behind them, so they stay correct on cards, panels and glass alike.

### Accent

| Token | Value |
|---|---|
| `--accent` | `#14b8a6` |
| `--accent-hover` | `#0d9488` |
| `--accent-light` | `#2dd4bf` |
| `--accent-glow` | `rgba(20,184,166,0.10)` |
| `--accent-border` | `rgba(20,184,166,0.18)` |
| `--accent-bg` | `rgba(20,184,166,0.06)` |

> **The accent swaps between modes.** Light mode anchors on `#0d9488`; dark mode shifts one step brighter to `#14b8a6` and *demotes `#0d9488` to the hover state*. Both modes stay legible against their own ground rather than reusing one teal everywhere.

### Borders and shadows

| Token | Value |
|---|---|
| `--border-default` | `rgba(255,255,255,0.08)` |
| `--border-subtle` | `rgba(255,255,255,0.04)` |
| `--border-glass` | `rgba(255,255,255,0.08)` |
| `--shadow-card` | `0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.4)` |
| `--shadow-card-hover` | `0 2px 4px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.5)` |

Borders are deliberately near-invisible — separation comes from surface lightness, not lines.

### State

| Token | Value |
|---|---|
| `--destructive` | `#f87171` |
| `--ring` (focus) | `#14b8a6` |

---

## Signature treatments

### Gradient text

The hero gradient. Teal → turquoise → cyan:

```css
background: linear-gradient(135deg, #0d9488 0%, #14b8a6 60%, #0891b2 100%);
```

Identical in both modes. `#0891b2` (cyan) appears **only** in gradients — never as a flat colour.

### Ambient blobs

Two slow-drifting radial gradients behind the page, plus a vignette that fades the edges into `--bg-primary`.

| | Position | Size | Gradient |
|---|---|---|---|
| Blob 1 | top `-30%`, right `-20%` | `70vw` | `rgba(13,148,136,0.14)` → `rgba(20,184,166,0.07)` → transparent |
| Blob 2 | bottom `-15%`, left `-10%` | `50vw` | `rgba(8,145,178,0.10)` → `rgba(13,148,136,0.05)` → transparent |

Both animate on `blob-drift` — 18s and 24s, the second reversed with an `-8s` delay so they never sync.

### Glass

Navbar only:

```css
backdrop-filter: blur(24px) saturate(180%);
background: var(--bg-glass);
```

Glass cards use a lighter `blur(16px) saturate(160%)`.

### Cards

`16px` radius, 1px `--border-default`, `--shadow-card`. On hover: `translateY(-2px)` with the deeper shadow, over `0.2s ease`.

### Buttons

**`.btn-accent`** — solid teal, white text, weight 500. On hover it lifts `translateY(-2px) scale(1.015)` on a springy `cubic-bezier(0.34,1.56,0.64,1)`, gains a teal glow `0 6px 20px rgba(13,148,136,0.30)`, and a diagonal white shimmer sweeps across at 105°. Press drops it to `scale(0.985)` in 80ms.

**`.btn-ghost`** — transparent on `--bg-card` with a subtle border; on hover the border becomes `--accent-border` and the fill `--accent-bg`.

### Theme toggle

A **block wipe from the top-right**, using the View Transitions API:

```css
clip-path: inset(0 0 100% 100%) → inset(0 0 0 0);
animation: 0.55s cubic-bezier(0.76, 0, 0.24, 1);
```

The new theme expands from the corner as a growing rectangle — not a crossfade.

### LEGO hero

A one-off texture, independent of the token system: base `#1a1c22` with layered radial-gradient studs on a `30px` grid, fading into `--bg-primary` at the bottom.

---

## Motion

| Animation | Duration / easing |
|---|---|
| `fade-up` | `0.5s cubic-bezier(0.25,0.46,0.45,0.94)`, 16px rise |
| `stagger-in` | `0.45s`, 12px rise + `scale(0.98)` |
| `float` | `5s ease-in-out infinite`, ±8px |
| `blob-drift` | `18s` / `24s ease-in-out infinite` |
| `shimmer-border` | `4s linear infinite` |
| `skeleton-sweep` | `1.6s ease-in-out infinite` |
| `marquee` | `28s linear` (slow variant `40s`) |

Staggered children step in **80ms** increments, up to six items.

Hover lifts use the springy `cubic-bezier(0.34,1.56,0.64,1)` (overshoots past 1). Entrances use the gentler `cubic-bezier(0.25,0.46,0.45,0.94)`.

---

## Other conventions

- **Scrollbars are hidden globally** — `scrollbar-width: none` plus `::-webkit-scrollbar { display: none }`.
- **Focus rings are always accent-coloured**: `2px solid var(--accent)`, `2px` offset, `4px` radius.
- **Card radius is 16px**; skeletons use `8px`.
- Skeletons shimmer across `--border-subtle` → `--border-default` → `--border-subtle`.

---

## Light mode (the variant)

Same structure, mint-tinted rather than dark.

| Token | Value |
|---|---|
| `--bg-primary` | `#f4fdfb` — very light mint |
| `--bg-secondary` / `--bg-card` | `#ffffff` |
| `--bg-panel` | `#f4f6f5` |
| `--bg-invert` | `#0a0f0e` |
| `--bg-canvas` | `#f0f0f0` |
| `--text-primary` | `#0a0f0e` — near-black, green-tinted |
| `--text-secondary` | `#4b5563` |
| `--text-muted` | `#9ca3af` |
| `--accent` | `#0d9488` |
| `--accent-hover` | `#0f766e` |
| `--accent-light` | `#14b8a6` |
| `--border-default` | `rgba(0,0,0,0.08)` |
| `--destructive` | `#dc2626` |
| `--bg-glass` | `rgba(255,255,255,0.75)` |

Note that light mode's text is `#0a0f0e` rather than pure black — a green-tinted near-black that ties back to the teal. Dark mode's text *is* pure `#ffffff`.

---

## Quick reference for external work

Making slides, thumbnails or video assets? These match the product exactly:

```
Background   #161516
Surface      #131313
Text         #ffffff
Muted text   rgba(255,255,255,0.50)
Accent       #14b8a6
Accent deep  #0d9488
Gradient     #0d9488 → #14b8a6 → #0891b2  (135°)
Font         Geist / Geist Mono
Radius       16px
```
