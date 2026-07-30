import type { ComparisonEntry } from "./types";

export const comparisons: ComparisonEntry[] = [
  {
    slug: "vectorizer-ai",
    competitor: "Vectorizer.AI",
    competitorUrl: "https://vectorizer.ai",
    tagline: "Free, no-credit, browser-native alternative to Vectorizer.AI.",
    lead: "Vectorizer.AI is a popular AI-powered raster-to-vector tool, but every export after a small trial costs credits. VectorDrop delivers the same quality for free, runs fully in the browser, and ships standard SVG you can edit in any design app.",
    verdict: "For most designers, developers, and creators, VectorDrop is the better default: no credits, no watermarks, no paywall for standard conversions.",
    table: [
      { feature: "Price", vectordrop: "Free", competitor: "Credit-based, paid exports" },
      { feature: "Signup required", vectordrop: "No for playground", competitor: "Yes" },
      { feature: "Watermark", vectordrop: "None", competitor: "On free previews" },
      { feature: "Output format", vectordrop: "Clean editable SVG", competitor: "Clean SVG, PDF, EPS" },
      { feature: "Editing", vectordrop: "In-browser playground", competitor: "Limited preview" },
      { feature: "Figma / Illustrator ready", vectordrop: "Yes", competitor: "Yes" },
      { feature: "Batch / API", vectordrop: "Roadmap", competitor: "Paid API" },
    ],
    vectordropPros: [
      "Free, no credits or export paywall",
      "Interactive vector playground with live preview",
      "Clean, hand-editable SVG paths out of the box",
      "Runs in the browser — nothing to install",
    ],
    competitorPros: [
      "Established AI tracing engine",
      "Multiple paid export formats (PDF, EPS)",
      "Commercial API for bulk workflows",
    ],
    whenCompetitor: "Choose Vectorizer.AI if you need paid commercial API access, bulk programmatic conversion at scale, or PDF/EPS export formats out of the box.",
    whenVectordrop: "Choose VectorDrop if you want a free, no-credit, high-quality SVG vectoriser with a live playground for one-off or day-to-day design work.",
    faq: [
      {
        q: "Is VectorDrop really free compared to Vectorizer.AI?",
        a: "Yes. VectorDrop is free for standard SVG conversions — no credit system, no watermark, no hard paywall on exports.",
      },
      {
        q: "Does VectorDrop match Vectorizer.AI on output quality?",
        a: "For icons, logos, flat illustrations, and line art, VectorDrop produces clean, hand-editable SVG paths comparable to Vectorizer.AI output.",
      },
      {
        q: "Can I use VectorDrop output commercially?",
        a: "Yes. You own the SVGs you create from your own source images.",
      },
    ],
  },
  {
    slug: "vector-magic",
    competitor: "Vector Magic",
    competitorUrl: "https://vectormagic.com",
    tagline: "A modern, free, browser-native alternative to Vector Magic.",
    lead: "Vector Magic is a long-running desktop-leaning vectoriser with a monthly subscription. VectorDrop gives you the same raster-to-SVG workflow, for free, entirely in the browser, with an interactive playground instead of a static converter.",
    verdict: "VectorDrop is the better fit for modern web and design workflows. Vector Magic still has loyal users who prefer its desktop app and bundled formats.",
    table: [
      { feature: "Price", vectordrop: "Free", competitor: "~$7.95/month or per-image" },
      { feature: "Platform", vectordrop: "Browser-native", competitor: "Desktop + web" },
      { feature: "Install required", vectordrop: "No", competitor: "Yes (for desktop)" },
      { feature: "Output", vectordrop: "SVG", competitor: "SVG, EPS, PDF, AI" },
      { feature: "Live preview", vectordrop: "Yes — playground", competitor: "Preview-oriented UI" },
      { feature: "Modern UI", vectordrop: "Yes", competitor: "Dated" },
    ],
    vectordropPros: [
      "Free to use for standard conversions",
      "Modern browser-native UI — no install",
      "Interactive vector playground",
      "Clean SVG output ready for Figma and the web",
    ],
    competitorPros: [
      "Multiple export formats (EPS, AI, PDF)",
      "Desktop app for offline workflows",
      "Long history of commercial use",
    ],
    whenCompetitor: "Pick Vector Magic if you need Adobe-native formats (.ai, .eps) or a fully offline desktop tool.",
    whenVectordrop: "Pick VectorDrop if you want a free, modern, browser-based vectoriser purpose-built for today's design and dev workflows.",
    faq: [
      {
        q: "Does VectorDrop export EPS or AI files like Vector Magic?",
        a: "VectorDrop exports standard SVG. Modern design tools (Figma, Illustrator, Affinity) open SVG natively; you can save-as EPS or AI from Illustrator if needed.",
      },
      {
        q: "Is VectorDrop faster than Vector Magic?",
        a: "Yes. VectorDrop runs in the browser, so there is no desktop install or file-roundtrip — tracing completes in seconds.",
      },
      {
        q: "Can I cancel my Vector Magic subscription and use VectorDrop?",
        a: "If your workflow is icon, logo, and flat-art vectorisation, yes — most users can switch with no loss in quality.",
      },
    ],
  },
  {
    slug: "illustrator-image-trace",
    competitor: "Adobe Illustrator Image Trace",
    competitorUrl: "https://helpx.adobe.com/illustrator/using/image-trace.html",
    // GSC: this page's impressions come from generic "image trace" / "image trace ai"
    // queries, not "illustrator alternative" queries — the meta targets that intent.
    metaTitle: "Free Image Trace Online — No Illustrator Needed",
    metaDescription:
      "Trace any image to clean vector paths free in your browser. A no-subscription replacement for Adobe Illustrator's Image Trace — compared side by side.",
    tagline: "Free browser replacement for Adobe Illustrator's Image Trace.",
    lead: "Illustrator's Image Trace is powerful but locked behind a Creative Cloud subscription and a desktop install. VectorDrop gives you comparable raster-to-vector tracing for free, in any modern browser, on any OS.",
    verdict: "If Image Trace is the only Illustrator feature you use, VectorDrop can replace it entirely — for free, with a faster workflow.",
    table: [
      { feature: "Price", vectordrop: "Free", competitor: "Creative Cloud (~$22.99/month)" },
      { feature: "Install", vectordrop: "None", competitor: "Illustrator desktop app" },
      { feature: "OS support", vectordrop: "Any — browser-native", competitor: "macOS, Windows" },
      { feature: "Output", vectordrop: "Clean editable SVG", competitor: "AI, plus SVG export" },
      { feature: "Learning curve", vectordrop: "Seconds", competitor: "Illustrator workflow" },
      { feature: "Best for", vectordrop: "Icons, logos, flat art, sketches", competitor: "Full illustration workflows" },
    ],
    vectordropPros: [
      "Free — no Creative Cloud subscription",
      "Runs on ChromeOS, Linux, older hardware — any browser",
      "Instant workflow: upload, trace, export",
      "Outputs standalone SVGs usable anywhere",
    ],
    competitorPros: [
      "Tight integration with Illustrator's full vector toolset",
      "Advanced post-trace editing (pathfinder, gradient mesh)",
      "Mature presets for complex photographic sources",
    ],
    whenCompetitor: "Stay on Illustrator if you already live in Creative Cloud and need advanced post-trace vector editing or photo-to-art conversions with custom presets.",
    whenVectordrop: "Switch to VectorDrop if you mainly use Image Trace for logos, icons, flat illustrations, or sketches and want to avoid the Adobe subscription.",
    faq: [
      {
        q: "Can VectorDrop replace Illustrator entirely?",
        a: "VectorDrop replaces Illustrator's Image Trace specifically. For broader illustration work, you can still use any free editor (Figma, Inkscape, Affinity) on the SVG VectorDrop exports.",
      },
      {
        q: "Is the trace quality the same as Image Trace?",
        a: "For icons, logos, and flat art, the quality is on par. For noisy photographic sources, Illustrator's presets may give you more control.",
      },
      {
        q: "Does VectorDrop work on Linux or ChromeOS?",
        a: "Yes. VectorDrop runs in any modern browser, so it works on Linux, ChromeOS, and older hardware that can't run Illustrator.",
      },
      {
        q: "What is image tracing?",
        a: "Image tracing is the process of converting a raster image — one made of pixels, like a PNG or JPG — into vector paths made of mathematical curves. The result scales to any size without blurring and can be edited shape by shape, which pixels cannot.",
      },
      {
        q: "Is image trace AI-powered?",
        a: "Mostly no, and this is a common misconception. Classic image tracing — including Illustrator's Image Trace and VectorDrop — uses deterministic edge-detection and curve-fitting algorithms rather than a neural network. That is an advantage for this task: the output is predictable and repeatable, and it reproduces your actual artwork instead of generating a new interpretation of it.",
      },
      {
        q: "Can I use Image Trace online without Illustrator?",
        a: "Yes. Illustrator itself is desktop-only and requires a Creative Cloud subscription, but VectorDrop does the equivalent trace in the browser for free, on any operating system.",
      },
      {
        q: "What is the best image tracing software?",
        a: "It depends on the job. For quick logo, icon, and line-art tracing, a free browser tool like VectorDrop is the fastest route. For heavy post-trace vector editing, Illustrator remains the most capable. For a free desktop option with fine-grained manual control, Inkscape's Trace Bitmap is strong.",
      },
    ],
  },
  {
    slug: "svgtrace",
    competitor: "SVGtrace",
    competitorUrl: "https://svgtrace.com",
    tagline: "A faster, cleaner, more interactive alternative to SVGtrace.",
    lead: "SVGtrace is a lightweight online tracer built on Potrace. VectorDrop layers a modern interactive playground, cleaner tuning controls, and a better preview on top of a comparable tracing engine.",
    verdict: "For anyone who has used SVGtrace and wished for better UX and output, VectorDrop is a direct upgrade.",
    table: [
      { feature: "Price", vectordrop: "Free", competitor: "Free" },
      { feature: "Interactive playground", vectordrop: "Yes", competitor: "Minimal" },
      { feature: "Live preview", vectordrop: "Yes", competitor: "Static preview" },
      { feature: "Output cleanliness", vectordrop: "Optimised paths", competitor: "Raw Potrace output" },
      { feature: "Modern UI", vectordrop: "Yes", competitor: "Dated" },
      { feature: "Mobile friendly", vectordrop: "Yes", competitor: "Limited" },
    ],
    vectordropPros: [
      "Modern UI that works on mobile and desktop",
      "Live preview as you tune tracing parameters",
      "Cleaner path output with fewer stray nodes",
      "Playground-first experience vs single-purpose converter",
    ],
    competitorPros: [
      "Minimal, zero-chrome interface some users prefer",
      "Long-running domain and stable uptime",
    ],
    whenCompetitor: "SVGtrace is fine for a one-off conversion if you like the bare-bones UI.",
    whenVectordrop: "Use VectorDrop for any repeat work — the playground, previews, and path optimisation save meaningful time.",
    faq: [
      {
        q: "Does VectorDrop use Potrace like SVGtrace?",
        a: "VectorDrop uses a modern tracing pipeline optimised for clean SVG output. The result is comparable or cleaner than Potrace-based tools.",
      },
      {
        q: "Is there a paid tier?",
        a: "Standard vectorisation is free on VectorDrop.",
      },
    ],
  },
  {
    slug: "inkscape",
    competitor: "Inkscape Trace Bitmap",
    competitorUrl: "https://inkscape.org",
    tagline: "Browser-native alternative to Inkscape's Trace Bitmap feature.",
    lead: "Inkscape is a powerful free desktop vector editor, and its Trace Bitmap feature is excellent. But it requires a 300MB install and a steep learning curve. VectorDrop gives you comparable trace quality instantly in the browser.",
    verdict: "Keep Inkscape if you want a full desktop vector editor. Use VectorDrop when you only need to vectorise an image quickly.",
    table: [
      { feature: "Install size", vectordrop: "None", competitor: "~300MB" },
      { feature: "Price", vectordrop: "Free", competitor: "Free" },
      { feature: "Platform", vectordrop: "Browser", competitor: "Desktop" },
      { feature: "Learning curve", vectordrop: "Seconds", competitor: "Hours" },
      { feature: "Full vector editor", vectordrop: "No", competitor: "Yes" },
      { feature: "Mobile support", vectordrop: "Yes", competitor: "No" },
    ],
    vectordropPros: [
      "Zero install — works in any browser, on any device",
      "Instant upload-to-SVG workflow",
      "Modern UI built for 2026",
      "Mobile and tablet friendly",
    ],
    competitorPros: [
      "Full-featured free vector editor",
      "Advanced post-trace path editing",
      "Large plugin ecosystem",
    ],
    whenCompetitor: "Use Inkscape when you want to *edit* vectors extensively after tracing — paths, nodes, boolean ops, gradients, the full toolkit.",
    whenVectordrop: "Use VectorDrop when you only need the trace step and want to move on with a clean SVG immediately.",
    faq: [
      {
        q: "Should I install Inkscape if I already use VectorDrop?",
        a: "Only if you need full vector editing. For tracing-only workflows, VectorDrop is enough.",
      },
      {
        q: "Can I open VectorDrop SVGs in Inkscape?",
        a: "Yes. VectorDrop exports standard SVG that opens cleanly in Inkscape, Illustrator, Affinity, and Figma.",
      },
    ],
  },
];

export const comparisonBySlug = new Map(comparisons.map((c) => [c.slug, c]));
