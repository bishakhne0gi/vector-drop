# Programmatic SEO — VectorDrop

A complete reference for the pSEO system on vectordrop.co.in: what's built, how to add pages, the strategic playbook, and how the SEO wiring fits together.

---

## 1. What pSEO is (and why we do it)

**Programmatic SEO** = generating many landing pages from a single template fed by a structured data source, where each page targets one specific long-tail search query.

The economics: one template × N data entries = N ranking pages. Instead of writing one blog post at a time, you ship dozens of pages that each match a precise searcher intent.

**The target**: capture high-intent long-tail queries like:
- "convert png to svg free"
- "vectorizer ai alternative"
- "how to vectorize a logo"
- "svg cutting files for cricut"

Each of these is low-competition individually. Together they compound into meaningful organic traffic.

**Reference**: [VideoCaptions.AI](https://www.videocaptions.ai/llms.txt) ships ~100+ pSEO pages across platforms × styles × languages × use cases × comparisons. Their `llms.txt` is the index.

---

## 2. System architecture

```
lib/pseo/                              ← typed data (source of truth)
├── types.ts                           shared types
├── comparisons.ts                     /vs/[competitor]
├── formats.ts                         /convert/[slug]
├── use-cases.ts                       /for/[slug]
└── how-tos.ts                         /how-to/[slug]

components/pseo/                       ← templates
├── PseoShell.tsx                      hero, sections, FAQ, CTA, JSON-LD
└── SiteLinks.tsx                      4-column footer link block

app/(marketing)/                       ← dynamic routes
├── layout.tsx                         passthrough marketing layout
├── vs/[competitor]/page.tsx
├── convert/[slug]/page.tsx
├── for/[slug]/page.tsx
└── how-to/[slug]/page.tsx

app/sitemap.ts                         ← auto-iterates lib/pseo/*
app/robots.ts                          ← allows /vs, /convert, /for, /how-to
public/llms.txt                        ← manually kept in sync with data
```

### Data flow

```
Data file (e.g. comparisons.ts)
    ↓
generateStaticParams()            → pre-render one static page per slug
    ↓
generateMetadata()                → per-page <title>, <meta description>, canonical
    ↓
<ComparisonPage> template         → renders from data
    ↓
JSON-LD <script>                  → Schema.org FAQPage / HowTo for rich results
    ↓
sitemap.ts                        → /sitemap.xml includes every slug
    ↓
SiteLinks footer                  → every page links to every other (internal link equity)
```

### The four categories

| Route prefix | Intent | Example | Schema.org type |
|---|---|---|---|
| `/vs/[competitor]` | Comparison shopping — very high commercial intent | `/vs/vectorizer-ai` | FAQPage |
| `/convert/[slug]` | Format-specific conversion — high volume | `/convert/png-to-svg` | HowTo |
| `/for/[slug]` | Use case / audience fit | `/for/cricut` | FAQPage |
| `/how-to/[slug]` | Informational intent | `/how-to/vectorize-a-logo` | HowTo |

---

## 3. How to add a new page (the only workflow you need)

Every new page is a single object append. No new route files, no UI work.

### Example: add `/vs/autotracer`

Open `lib/pseo/comparisons.ts` and push a new entry to the `comparisons` array:

```ts
{
  slug: "autotracer",                            // appears in URL
  competitor: "Autotracer",
  competitorUrl: "https://autotracer.org",
  tagline: "Modern alternative to Autotracer.",  // <meta description>
  lead: "...",                                    // intro paragraph
  verdict: "...",                                 // one-line conclusion
  table: [
    { feature: "Price", vectordrop: "Free", competitor: "Free" },
    // ...
  ],
  vectordropPros: ["...", "..."],
  competitorPros: ["...", "..."],
  whenCompetitor: "...",
  whenVectordrop: "...",
  faq: [
    { q: "...", a: "..." },
    // ...
  ],
}
```

That's it. On next `next build`:

- `/vs/autotracer` pre-renders statically
- `/sitemap.xml` includes it
- `SiteLinks` footer links to it site-wide
- JSON-LD FAQPage is emitted with all FAQ entries
- Metadata (title, description, canonical, OG) auto-generated

Repeat the same pattern for the other three files:

| Category | Data file | Type |
|---|---|---|
| Comparison | `lib/pseo/comparisons.ts` | `ComparisonEntry` |
| Format conversion | `lib/pseo/formats.ts` | `FormatEntry` |
| Use case | `lib/pseo/use-cases.ts` | `UseCaseEntry` |
| How-to guide | `lib/pseo/how-tos.ts` | `HowToEntry` |

Types are defined in `lib/pseo/types.ts` — TypeScript enforces all required fields.

### After adding a page

1. Run `pnpm build` locally to verify static generation succeeds
2. Append the new URL to `public/llms.txt` in the matching section
3. Commit + deploy
4. In Google Search Console, submit the URL for indexing (optional, but accelerates crawl)

---

## 4. Writing good pSEO content

Every page should answer one specific search query completely. Rules:

- **Title targets the query verbatim** (or close to it). Search Console tells you what people actually type.
- **Lead paragraph** = 2–4 sentences, includes the target keyword naturally.
- **Structured sections** = feature table, pros/cons, FAQ. Google loves the structure.
- **FAQ = 3–5 items**, each answering one sub-question. This is what powers the rich-result card.
- **Write for humans first** — Google detects thin "AI slop" pSEO and demotes it.

### Length sweet spot

- Comparisons: 500–900 words
- Format conversions: 400–700 words
- Use cases: 400–600 words
- How-tos: 500–800 words

Under 300 words = thin content, risk of "Crawled but not indexed". Over 1500 = diminishing returns.

### Keyword placement

- `<h1>` once, target keyword included
- First paragraph, target keyword once
- FAQ questions should include keyword variations
- Internal links to related pSEO pages (automatic via `SiteLinks` footer)

---

## 5. Strategic expansion plan

**Goal**: 60–80 pSEO pages within 6 weeks. Current count: 17.

### Priority 1 — `/vs/` comparisons (highest commercial intent)

Ship 15 total (10 more to add):

- autotracer, recraft, convertio, cloudconvert, picsvg, image-vectorizer, online-convert, svg-converter, kittl, adobe-express-vectorize

### Priority 2 — `/convert/` format pairs (high search volume)

Ship 12 total (8 more to add):

- gif-to-svg, bmp-to-svg, tiff-to-svg, heic-to-svg, svg-to-png, svg-to-pdf, svg-to-jpg, svg-to-eps

### Priority 3 — `/for/` verticals

Ship 12 total (8 more to add):

- t-shirt-design, laser-engraving, stickers, tattoo-artists, figma-designers, web-developers, youtubers, print-on-demand

### Priority 4 — `/how-to/` guides

Ship 15 total (11 more to add):

- remove-background-then-vectorize, reduce-svg-file-size, vectorize-in-figma, convert-jpg-to-svg, trace-logo-from-screenshot, make-svg-for-cricut, vectorize-handwriting, clean-up-svg-paths, use-svg-in-react, use-svg-in-nextjs, prepare-svg-for-print

### Priority 5 (later) — combination pages

Programmatic pairs like `/png-to-svg-for-cricut`, `/jpg-to-svg-in-figma` capture even longer-tail intent. Build once the core 60 are live and indexed.

---

## 6. SEO wiring (how everything connects)

### Metadata hierarchy

```
app/layout.tsx                      → site-wide defaults (index: true, og:image, etc.)
app/(app)/layout.tsx                → overrides with { index: false } for auth pages
app/(auth)/layout.tsx               → overrides with { index: false } for login
app/(marketing)/*/page.tsx          → per-page generateMetadata() from pSEO data
```

Nested metadata overrides parent. Robots `index: false` in auth layouts means dashboard/editor/login stay out of the index even if Google discovers them.

### Sitemap

`app/sitemap.ts` imports every pSEO array and iterates. No manual sitemap edits. The homepage is priority 1.0; format pages 0.9; comparisons 0.8; use cases and how-tos 0.7.

Served at `https://vectordrop.co.in/sitemap.xml`.

### Robots

`app/robots.ts`:

- `Allow: /, /vs/, /convert/, /for/, /how-to/`
- `Disallow: /api/, /dashboard, /editor, /icons/my, /login`

Explicit allow of pSEO route prefixes makes intent clear to crawlers.

### llms.txt

`public/llms.txt` follows the [llmstxt.org](https://llmstxt.org) spec. Sections mirror the pSEO route structure so LLMs (ChatGPT, Claude, Perplexity, Gemini) can cite the right page per query type.

**Keep this manually in sync** when you add new pages. One line per page under the matching section.

### JSON-LD (Schema.org)

Each pSEO page emits structured data inline:

- Comparison + use-case pages → `FAQPage` (eligible for FAQ rich results in SERPs)
- Format + how-to pages → `HowTo` (eligible for How-To rich results)

Validate with Google's [Rich Results Test](https://search.google.com/test/rich-results) after major changes.

### Internal linking (critical for "Discovered - currently not indexed")

`components/pseo/SiteLinks.tsx` renders on:

- The homepage footer
- Every pSEO page footer

This means every page links to every other pSEO page + the homepage. Google follows those links, which:

1. Distributes link equity from the indexed homepage to every pSEO page
2. Tells Google these pages are internally important (not orphans)
3. Accelerates crawl and indexing

Without this, pSEO pages often get stuck in "Discovered — currently not indexed".

---

## 7. Launching & monitoring

### Post-deploy checklist

- [ ] Visit `/sitemap.xml` in browser — confirm all URLs listed
- [ ] Visit `/robots.txt` — confirm allow/disallow rules
- [ ] Visit `/llms.txt` — confirm all pages listed
- [ ] Google Search Console → Sitemaps → resubmit `sitemap.xml`
- [ ] GSC → URL Inspection → "Request Indexing" on 3–5 highest-priority new URLs
- [ ] Validate a comparison page with [Rich Results Test](https://search.google.com/test/rich-results) — expect FAQPage detected
- [ ] Validate a how-to page — expect HowTo detected

### Weekly metrics to watch

- **GSC → Performance**: impressions per URL per query
- **GSC → Pages → Not indexed**: ideally trending down for pSEO URLs
- **GSC → Enhancements → FAQ / HowTo**: rich-result eligibility
- **Server logs (or Vercel Analytics)**: direct pSEO URL visits

### Indexing timeline expectations

| Time since deploy | Expected state |
|---|---|
| 1 day | Sitemap processed, URLs "Discovered" |
| 3–7 days | First URLs move to "Crawled" |
| 1–3 weeks | First URLs "Indexed" and serving |
| 4–8 weeks | Stable SERP position as Google evaluates quality |
| 3–6 months | Full compound traffic if content quality holds |

Be patient. pSEO is a 3–6-month game. Quality + internal linking + consistent publishing wins.

---

## 8. Anti-patterns to avoid

1. **Thin content.** Sub-200-word pages get "Crawled but not indexed." Minimum ~400 words of genuine value.
2. **Duplicate content across pages.** Each entry must have unique body copy. Don't template-paste FAQs across all comparisons.
3. **Keyword stuffing.** Google punishes unnatural density. Write for humans.
4. **Orphan pages.** Every pSEO page must be linked from at least the homepage (handled by `SiteLinks`).
5. **Inconsistent canonicals.** Each page declares its own canonical URL in `generateMetadata()`. Don't change the domain or path structure without updating canonicals.
6. **Mixing noindex with sitemap.** Only index-eligible pages belong in the sitemap. The auth-gated pages are correctly excluded.
7. **Broken links in `llms.txt`.** Every URL listed must return 200. If you remove a pSEO entry, update `llms.txt` too.

---

## 9. Key files reference

| File | Purpose | Edit frequency |
|---|---|---|
| `lib/pseo/types.ts` | Shared types | Rarely |
| `lib/pseo/comparisons.ts` | `/vs/*` data | Often (add entries) |
| `lib/pseo/formats.ts` | `/convert/*` data | Often (add entries) |
| `lib/pseo/use-cases.ts` | `/for/*` data | Often (add entries) |
| `lib/pseo/how-tos.ts` | `/how-to/*` data | Often (add entries) |
| `components/pseo/PseoShell.tsx` | Page shell + primitives | Design changes only |
| `components/pseo/SiteLinks.tsx` | Footer link grid | Auto-derived from data |
| `app/(marketing)/vs/[competitor]/page.tsx` | Comparison template | Rarely |
| `app/(marketing)/convert/[slug]/page.tsx` | Format template | Rarely |
| `app/(marketing)/for/[slug]/page.tsx` | Use case template | Rarely |
| `app/(marketing)/how-to/[slug]/page.tsx` | How-to template | Rarely |
| `app/sitemap.ts` | Auto sitemap | Only if adding new category |
| `app/robots.ts` | Crawler rules | Only if adding new category |
| `public/llms.txt` | LLM-facing index | Every time a page is added |

---

## 10. Quick reference — add one page

```bash
# 1. Open the matching data file
$EDITOR lib/pseo/comparisons.ts   # or formats / use-cases / how-tos

# 2. Append an entry following the existing pattern (TypeScript enforces fields)

# 3. Add the URL to public/llms.txt in the matching section

# 4. Verify
pnpm build

# 5. Commit & deploy
git add lib/pseo/ public/llms.txt
git commit -m "seo: add /vs/autotracer comparison page"
git push

# 6. In GSC → URL Inspection → Request Indexing
```

That's the entire workflow. Ship 5 entries a day for 2 weeks and you've tripled the surface area.
