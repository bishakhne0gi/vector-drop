# VectorDrop SEO Audit

**Date:** 2026-04-22
**Scope:** vectordrop.co.in — homepage, programmatic routes (`/convert/*`, `/vs/*`, `/for/*`, `/how-to/*`), `robots.ts`, `sitemap.ts`

---

## Verdict

Solid technical foundation, thin authority layer. The site is crawlable, positioned clearly, and has 17 programmatic pages indexed. The next bottleneck is **trust signals** (schema, backlinks, real proof) — not more pages.

**Citation readiness (0–10):** 7 for narrow intent (`png to svg`, `vector magic alternative`), 3 for broad intent (`best vector software`).

---

## Scorecard

| Factor | Score | Notes |
|---|---|---|
| Crawlability | 9 | `robots.ts` + `sitemap.ts` correct. 18 URLs indexed. |
| On-page clarity | 9 | H1s direct, titles keyword-aligned |
| Programmatic coverage | 7 | 17 pages across 4 axes — expand to 50+ |
| Structured data (JSON-LD) | 8 | Organization + WebSite + SoftwareApplication on root; HowTo + FAQPage on /how-to and /convert; FAQPage on /vs and /for. Removed fake AggregateRating. |
| Authority / backlinks | 4 | No visible third-party citations |
| Trust / proof | 5 | Comparison slider good; lacks testimonials, Product Hunt, reviews |
| Meta descriptions | 4 | Not present or not emitted — verify via `generateMetadata` |
| Internal linking | 7 | Footer sections solid; body copy could cross-link more |

---

## What's Working

1. **`robots.ts` is correct** — allow-lists every SEO surface, blocks app routes (`/editor`, `/dashboard`, `/api/`). No leaks.
2. **`sitemap.ts` is data-driven** — pulls from `lib/pseo/{comparisons,formats,use-cases,how-tos}.ts`. Adding a slug auto-adds a URL. Right architecture.
3. **Programmatic pages are thick, not thin** — `/convert/png-to-svg` has ~800 words, 4-step how-to, FAQ. `/vs/vector-magic` has genuine comparison table + verdict. Google's spam policy specifically targets templated thin pSEO; these aren't that.
4. **Clear positioning** — "Turn any image into editable vectors" is a direct intent match for the target query.

---

## Critical Gaps (fix first)

### 1. No JSON-LD structured data anywhere

Biggest miss. Every programmatic page type has a natural schema:

| Page type | Schema | Wins |
|---|---|---|
| `/how-to/*` | `HowTo` | Step-by-step rich result |
| `/convert/*` | `SoftwareApplication` + `FAQPage` | Ratings, FAQ snippets |
| `/vs/*` | `FAQPage` + `Article` | FAQ snippet under SERP |
| `/for/*` | `SoftwareApplication` with `audience` | Audience targeting |
| Homepage | `Organization` + `WebSite` + `SearchAction` | Sitelinks search box |

Add a `<Script type="application/ld+json">` in each page's metadata block. This alone moves citation readiness from 7 → 8.

### 2. Meta descriptions may be missing

The audit couldn't find them on homepage or `/convert/png-to-svg`. Verify every page exports `metadata.description` via `generateMetadata` (Next 15 App Router). Missing descriptions → Google auto-generates, which hurts CTR.

### 3. No `Open Graph` / Twitter Card audit

For an X-native launch strategy, every page needs a unique OG image. You have `opengraph-image.tsx` at root — verify it also exists under each programmatic route, or generate dynamically using the slug.

### 4. Thin authority signals

- No testimonials with real names/photos on homepage
- No Product Hunt / IndieHackers / Reddit embed
- No "featured in" / backlink badge strip
- No user count / conversions-done counter (social proof)

### 5. `/for/*` use-case pages likely thinnest

Audit didn't sample these but the use-cases data file is short. These pages are most at risk of Google's "site reputation abuse" flag if they're templated. Add at least: one real example per use case (Etsy seller: show converted logo), one quote, one use-case-specific tip.

---

## Quick wins (ship this week)

1. **JSON-LD on `/how-to/[slug]`** — use the existing step data. 1 file, massive impact.
2. **Add FAQPage JSON-LD to `/vs/*` and `/convert/*`** — you already have FAQ content, just mark it up.
3. **Add `Organization` + `WebSite` JSON-LD to root `layout.tsx`** — one-shot, covers every page.
4. **Emit `metadata.description` from every route** — grep for pages missing it.
5. **Internal cross-linking** — from `/convert/png-to-svg` body, link to `/vs/vector-magic` and `/how-to/convert-logo-to-svg`. Currently only footer links.

---

## Medium-term (next 2–4 weeks)

1. **Expand to 50+ programmatic pages**. Add data rows to:
   - `comparisons.ts`: add `recraft`, `svg-converter-com`, `autotrace`, `potrace`, `canva-vectorizer`
   - `formats.ts`: add `gif-to-svg`, `heic-to-svg`, `tiff-to-svg`, `ico-to-svg`, `screenshot-to-svg`
   - `use-cases.ts`: add `for-shopify`, `for-etsy`, `for-cricut`, `for-glowforge`, `for-embroidery`, `for-developers`, `for-figma-plugin-authors`
   - `how-tos.ts`: add `convert-handwriting-to-svg`, `trace-photo-to-line-art`, `simplify-svg-paths`, `reduce-svg-file-size`

2. **Real before/after gallery** on homepage and pSEO pages — with actual SVG output previews, not mockups. Big trust move.

3. **Add `AggregateRating` schema** once you have enough Product Hunt / user reviews to cite honestly.

4. **Programmatic OG images** — generate per-slug using `opengraph-image.tsx` reading from the same pSEO data source.

5. **Submit sitemap to Bing Webmaster Tools** (not just Google Search Console) — Bing powers ChatGPT search.

---

## Long-term (authority layering)

1. **Product Hunt launch** — timing-critical for first citations
2. **Reddit presence** in r/graphic_design, r/SVG, r/webdev (be useful, not promotional)
3. **Write 3–5 deep guides** (1500+ words): "SVG file size optimization", "When to use SVG vs PNG vs WebP", "How image tracing algorithms work". These attract backlinks programmatic pages cannot.
4. **Embed a few conversions on CodePen / JSFiddle** — niche backlink farms for design/dev tooling
5. **Pitch to `hackernews`, `designer-news`, `sidebar.io`, `css-tricks` roundups**

---

## AI citation strategy specifically

LLMs cite what's:
- **Recently mentioned** in training crawl (Reddit, HN, X, GitHub READMEs)
- **Schema-marked** (they can parse `HowTo`/`FAQPage` reliably)
- **Comparison-adjacent** ("X alternatives" posts)

Priority order for AI citation:
1. Get into one "best PNG to SVG converters 2026" listicle
2. Ship FAQPage JSON-LD everywhere
3. Get a Reddit thread with the domain linked (organic, not spam)
4. Publish one GitHub-hosted "awesome-svg-tools" entry via PR to existing awesome lists

---

## Files to touch (engineering work)

- `app/layout.tsx` — add `Organization` + `WebSite` JSON-LD
- `app/(marketing)/convert/[slug]/page.tsx` — add `SoftwareApplication` + `FAQPage` JSON-LD
- `app/(marketing)/vs/[competitor]/page.tsx` — add `FAQPage` + `Article` JSON-LD
- `app/(marketing)/how-to/[slug]/page.tsx` — add `HowTo` JSON-LD
- `app/(marketing)/for/[slug]/page.tsx` — add `SoftwareApplication` with `audience`
- `lib/pseo/*.ts` — expand data arrays (target: 50+ total URLs)
- `app/opengraph-image.tsx` + programmatic route OG images — per-slug generation

---

*Audit done via live crawl of production. Re-run after each major data-layer expansion.*
