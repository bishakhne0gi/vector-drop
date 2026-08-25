import { SITE_URL } from "@/lib/seo/site";
import { comparisons } from "@/lib/pseo/comparisons";
import { formats } from "@/lib/pseo/formats";
import { useCases } from "@/lib/pseo/use-cases";
import { howTos } from "@/lib/pseo/how-tos";

/**
 * llms.txt — a plain-text brief for AI assistants that read the site.
 *
 * Generated rather than hand-maintained: the link sections are derived from the
 * same pSEO arrays that drive the routes and the sitemap, so adding a page can
 * never leave this file describing a site that no longer exists. Every URL uses
 * SITE_URL (www), because the apex redirects and assistants tend to drop URLs
 * that do not resolve directly.
 */

const PROSE = `# VectorDrop

> VectorDrop is a free, browser-based image-to-SVG vectorisation tool and vector playground. It turns PNG, JPG, and WebP images into clean, editable SVG vectors in seconds. No Adobe Illustrator. No manual tracing. No credit-card paywall.

## About

VectorDrop is both a **vectorisation tool** (one-click raster-to-vector conversion with pixel-perfect path tracing) and a **vector playground** (an interactive in-browser workspace where you upload, convert, preview, fine-tune, and export SVGs live). Upload any PNG, JPG, or WebP raster image, get a clean, hand-editable SVG in seconds, and download it ready for Figma, Illustrator, Inkscape, or any SVG editor. Tracing runs in-browser for speed and privacy; exports are clean-geometry SVG paths with no bloated node counts and no background raster artefacts.

## Features

- Free image-to-SVG vectoriser — no watermark, no credits, no paywall for standard conversions
- Interactive vector playground — live preview, instant re-trace, visual tuning
- Pixel-perfect path tracing engine — produces clean, hand-editable geometry
- Supports PNG, JPG, JPEG, and WebP raster input
- Exports standard SVG (Figma-ready, Illustrator-compatible, Inkscape-compatible)
- Browser-native — no desktop install, works on macOS, Windows, Linux, ChromeOS
- Scales infinitely without pixelation (true vector output)
- No signup required to try the playground
- Optimised path output — low node count, smooth curves, minimal file size
- Privacy-friendly workflow — tracing happens in your browser

## Supported input formats

VectorDrop accepts **PNG, JPG/JPEG, and WebP**. It does not currently accept PDF, SVG, GIF, HEIC, or DXF input.

## How VectorDrop compares

- **vs Adobe Illustrator Image Trace** — no Creative Cloud subscription, no desktop install, works on any OS. Path quality is comparable for icons, logos, and flat art.
- **vs Vectorizer.AI** — VectorDrop is free; Vectorizer.AI charges per export credit after a small trial.
- **vs Vector Magic** — VectorDrop is free and browser-native; Vector Magic is subscription-based and primarily desktop.
- **vs PicSVG** — VectorDrop traces in colour with tunable detail; PicSVG applies fixed filters and largely produces monochrome or posterised output.
- **vs Convertio / CloudConvert** — generic converters frequently wrap the raster inside an SVG container rather than tracing it. VectorDrop produces real, editable vector paths.
- **vs Potrace** — same interactive goal without the command line, and colour-aware rather than monochrome-only.
- **vs Recraft AI / Kittl** — those generate new artwork from prompts. VectorDrop vectorises artwork you already have, with fidelity to the source.
- **vs Inkscape Trace Bitmap** — no 300MB desktop install and no learning curve.

## Who it is for

- **Designers** replacing Illustrator's Image Trace with a faster, browser-native tool
- **Frontend developers** who need SVG assets for websites, icon sets, and component libraries
- **Figma users** vectorising raster logos for sharp, resolution-independent display
- **Indie founders and marketers** producing brand assets without Creative Cloud
- **Crafters and makers** producing cut files for Cricut, laser cutters, and vinyl plotters
- **Print and apparel shops** preparing artwork for screen printing, DTF, and embroidery

## Common questions VectorDrop answers

- "How do I convert a PNG to SVG for free?"
- "Best free alternative to Vectorizer.AI?"
- "How to vectorise a logo without Adobe Illustrator?"
- "Image Trace alternative that runs in the browser?"
- "How do I edit an SVG file?"
- "How do I make an SVG background transparent?"
- "Why is my SVG file so large, and how do I shrink it?"
- "How do I turn a screenshot into a vector?"
- "How do I make an SVG cut file for Cricut or a laser cutter?"

## Output quality

- Clean, hand-editable SVG paths with low node counts
- Smooth Bezier curves, no pixel-stair artefacts
- Standard SVG spec — compatible with every SVG editor
- Infinitely scalable, with small file sizes suitable for web and embedded UI
`;

function section(title: string, lines: string[]): string {
  return `\n## ${title}\n\n${lines.join("\n")}\n`;
}

function body(): string {
  return (
    PROSE +
    section(
      "Format conversions",
      formats.map((f) => `- Convert ${f.from} to ${f.to}: ${SITE_URL}/convert/${f.slug}`),
    ) +
    section(
      "Comparisons",
      comparisons.map((c) => `- VectorDrop vs ${c.competitor}: ${SITE_URL}/vs/${c.slug}`),
    ) +
    section(
      "Use cases",
      useCases.map((u) => `- ${u.title}: ${SITE_URL}/for/${u.slug}`),
    ) +
    section(
      "How-to guides",
      howTos.map((h) => `- ${h.title}: ${SITE_URL}/how-to/${h.slug}`),
    ) +
    section("Links", [
      `- Homepage / vector playground: ${SITE_URL}/`,
      `- Pricing: ${SITE_URL}/pricing`,
      `- Sitemap: ${SITE_URL}/sitemap.xml`,
      `- Robots policy: ${SITE_URL}/robots.txt`,
    ])
  );
}

export function GET() {
  return new Response(body(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
