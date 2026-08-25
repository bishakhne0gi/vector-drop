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
    metaTitle: "Free Vector Magic Alternative — No $7.95/mo Subscription",
    metaDescription:
      "Vector Magic charges ~$7.95/month. VectorDrop turns PNG and JPG into clean, editable SVG free in your browser — no subscription, no watermark, no signup.",
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
    metaTitle: "SVGtrace Alternative — Cleaner SVG Paths, Live Preview",
    metaDescription:
      "SVGtrace is a thin Potrace wrapper with no tuning. VectorDrop traces in colour with live preview and optimised paths — free, no signup, in your browser.",
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
    metaTitle: "Inkscape Trace Bitmap Online — No 300MB Install",
    metaDescription:
      "Get Inkscape's Trace Bitmap result without the download. VectorDrop turns PNG, JPG, and WebP into clean SVG free in your browser — nothing to install.",
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
  {
    slug: "picsvg",
    metaTitle: "PicSVG Alternative — Colour Tracing, No Ads",
    metaDescription:
      "PicSVG posterises to mono using fixed filters. VectorDrop traces in full colour with tunable detail and live preview — free, ad-free, and no signup.",
    competitor: "PicSVG",
    competitorUrl: "https://picsvg.com",
    tagline: "A modern, higher-fidelity alternative to PicSVG.",
    lead: "PicSVG is a long-standing free PNG-to-SVG converter with a minimal, ad-heavy interface and a single-shot trace. VectorDrop is also free, but gives you a live playground, tunable tracing, and cleaner path output you can hand straight to Figma or Illustrator.",
    verdict: "If PicSVG's one-click trace gives you what you need, it still works. If you care about path quality, colour handling, or want to tune the result before exporting, VectorDrop is the better tool.",
    table: [
      { feature: "Price", vectordrop: "Free", competitor: "Free (ad-supported)" },
      { feature: "Live preview", vectordrop: "Yes — interactive playground", competitor: "Static result page" },
      { feature: "Tunable detail / smoothing", vectordrop: "Yes", competitor: "Preset filters only" },
      { feature: "Colour output", vectordrop: "Full colour or mono", competitor: "Largely mono / posterised" },
      { feature: "Saved projects & versions", vectordrop: "Yes", competitor: "No" },
      { feature: "Interface", vectordrop: "Modern, ad-free workspace", competitor: "Dated, ad-supported" },
    ],
    vectordropPros: [
      "Interactive playground — tune the trace before you commit",
      "Cleaner, lower-node SVG paths that are easier to edit",
      "Colour tracing, not just black-and-white posterisation",
      "Projects and version history so you can come back to a conversion",
    ],
    competitorPros: [
      "Extremely simple — upload, pick a filter, download",
      "No account of any kind",
      "Familiar to people who have used it for years",
    ],
    whenCompetitor: "Choose PicSVG if you want the absolute fastest one-click mono trace and do not care about tuning or output quality.",
    whenVectordrop: "Choose VectorDrop if the SVG is going into real design or production work and needs clean, editable paths.",
    faq: [
      {
        q: "Is VectorDrop free like PicSVG?",
        a: "Yes. Standard PNG, JPG, and WebP to SVG conversion is free on VectorDrop, with no watermark on your exports.",
      },
      {
        q: "Why does PicSVG output look posterised?",
        a: "PicSVG applies fixed filters and largely produces monochrome or heavily posterised traces. VectorDrop traces colour regions directly and lets you control how many colours survive.",
      },
      {
        q: "Can I edit VectorDrop SVGs in Illustrator?",
        a: "Yes. VectorDrop exports standard SVG that opens cleanly in Illustrator, Figma, Inkscape, and Affinity Designer.",
      },
    ],
  },
  {
    slug: "recraft-ai",
    metaTitle: "Recraft AI Alternative — Free Vectoriser, No Credits",
    metaDescription:
      "Recraft meters vectorising against credits. VectorDrop converts PNG, JPG, and WebP to clean, editable SVG free — no credits, no signup, in your browser.",
    competitor: "Recraft AI",
    competitorUrl: "https://recraft.ai",
    tagline: "Free, focused vectorising versus Recraft's generative design suite.",
    lead: "Recraft AI is a generative design platform that happens to include a vectoriser. VectorDrop does one thing: turn images you already have into clean, editable SVG. If you are not trying to generate new artwork, VectorDrop is the lighter, free path.",
    verdict: "Recraft is the better choice if you want AI to create the artwork. VectorDrop is the better choice if you already have the artwork and just need it as a vector.",
    table: [
      { feature: "Price", vectordrop: "Free", competitor: "Free tier, then paid credits" },
      { feature: "Primary purpose", vectordrop: "Raster to SVG", competitor: "AI image & vector generation" },
      { feature: "Signup required", vectordrop: "No for playground", competitor: "Yes" },
      { feature: "Credit system", vectordrop: "None", competitor: "Yes" },
      { feature: "Vectorise your own image", vectordrop: "Core feature", competitor: "Supported, credit-metered" },
      { feature: "Generate new artwork", vectordrop: "No", competitor: "Yes" },
    ],
    vectordropPros: [
      "No credits, no metering on standard conversions",
      "Purpose-built for tracing images you already own",
      "Live playground controls instead of a fixed pipeline",
      "Nothing to sign up for to try it",
    ],
    competitorPros: [
      "Generates original vector artwork from prompts",
      "Broader design suite with styles and brand kits",
      "Useful when you have no source image at all",
    ],
    whenCompetitor: "Choose Recraft if you need to generate new illustrations or icons from scratch with AI.",
    whenVectordrop: "Choose VectorDrop if you have a logo, icon, sketch, or screenshot and you need it as a clean SVG right now.",
    faq: [
      {
        q: "Does VectorDrop generate images with AI?",
        a: "No. VectorDrop converts images you supply into vectors. It does not generate new artwork from prompts.",
      },
      {
        q: "Is VectorDrop cheaper than Recraft?",
        a: "VectorDrop is free for standard conversions, with no credit system. Recraft meters vectorising against its credit balance once the free tier is used.",
      },
      {
        q: "Which gives cleaner SVG for a logo?",
        a: "For tracing an existing logo, VectorDrop's tunable trace typically produces fewer, cleaner nodes because you control detail and colour count directly.",
      },
    ],
  },
  {
    slug: "adobe-express",
    metaTitle: "Adobe Express SVG Converter Alternative — No Account",
    metaDescription:
      "Adobe Express needs an Adobe account to convert to SVG. VectorDrop vectorises PNG, JPG, and WebP free in your browser — no signup, with tunable tracing.",
    competitor: "Adobe Express",
    competitorUrl: "https://www.adobe.com/express/",
    tagline: "A free, no-account alternative to Adobe Express's SVG converter.",
    lead: "Adobe Express bundles a basic image-to-SVG converter inside a much larger design product, behind an Adobe account. VectorDrop is a dedicated vectoriser you can use immediately, with finer control over the trace itself.",
    verdict: "Adobe Express makes sense if you are already inside the Adobe ecosystem. VectorDrop is faster and freer for a one-off conversion, and gives you more control over the result.",
    table: [
      { feature: "Price", vectordrop: "Free", competitor: "Free tier, premium plan for full features" },
      { feature: "Adobe account required", vectordrop: "No for playground", competitor: "Yes" },
      { feature: "Tunable trace settings", vectordrop: "Yes — live controls", competitor: "Minimal" },
      { feature: "Scope", vectordrop: "Focused vectoriser", competitor: "Full design suite" },
      { feature: "Speed to first SVG", vectordrop: "Seconds, no signup", competitor: "Signup, then convert" },
      { feature: "Works with Figma / Inkscape", vectordrop: "Yes — standard SVG", competitor: "Yes — standard SVG" },
    ],
    vectordropPros: [
      "No Adobe account, no plan, no upsell",
      "Direct control over detail, smoothing, and colour count",
      "Purpose-built UI rather than a feature buried in a suite",
      "Runs in any modern browser",
    ],
    competitorPros: [
      "Integrated with Adobe Creative Cloud assets and fonts",
      "Templates, layouts, and social formats in one place",
      "Familiar if your team already pays for Adobe",
    ],
    whenCompetitor: "Choose Adobe Express if the conversion is one step inside a larger Adobe design workflow you are already paying for.",
    whenVectordrop: "Choose VectorDrop if you want a clean SVG out of an image without signing into anything.",
    faq: [
      {
        q: "Is Adobe Express's SVG converter free?",
        a: "It has a free tier, but it requires an Adobe account and gates parts of the wider product behind a premium plan. VectorDrop's conversions are free and need no account to try.",
      },
      {
        q: "Does VectorDrop output work in Illustrator?",
        a: "Yes. VectorDrop exports standard SVG, which Illustrator, Photoshop, and the rest of Creative Cloud open natively.",
      },
      {
        q: "Which handles complex artwork better?",
        a: "VectorDrop exposes detail and colour controls, so complex artwork can be tuned. Adobe Express applies a fixed conversion with little adjustment.",
      },
    ],
  },
  {
    slug: "potrace",
    metaTitle: "Potrace Online — Colour Tracing, No Command Line",
    metaDescription:
      "Potrace is a mono command-line tracer needing bitmap input. VectorDrop traces PNG, JPG, and WebP in colour with live preview — free, no install needed.",
    competitor: "Potrace",
    competitorUrl: "https://potrace.sourceforge.net",
    tagline: "The Potrace tracing engine, without the command line.",
    lead: "Potrace is the classic open-source bitmap tracer that powers many vectorisers, but it is a command-line tool that works on bitmaps and outputs monochrome curves. VectorDrop gives you a modern, colour-aware trace in the browser, with visual controls instead of flags.",
    verdict: "Potrace is excellent inside a script or build pipeline. VectorDrop is the better fit when a human is looking at the result and wants to adjust it.",
    table: [
      { feature: "Interface", vectordrop: "Browser playground", competitor: "Command line" },
      { feature: "Install required", vectordrop: "No", competitor: "Yes" },
      { feature: "Colour tracing", vectordrop: "Yes", competitor: "Monochrome only" },
      { feature: "Input formats", vectordrop: "PNG, JPG, WebP", competitor: "PBM/PGM/PPM/BMP" },
      { feature: "Live visual feedback", vectordrop: "Yes", competitor: "No — re-run to see changes" },
      { feature: "Scriptable / batch", vectordrop: "Roadmap", competitor: "Yes — built for it" },
    ],
    vectordropPros: [
      "No install, no toolchain, no preprocessing step",
      "Traces colour artwork, not just black-and-white bitmaps",
      "Accepts PNG, JPG, and WebP directly",
      "See the effect of every setting immediately",
    ],
    competitorPros: [
      "Free and open source",
      "Perfect for automated batch pipelines",
      "Extremely mature, well-understood tracing algorithm",
    ],
    whenCompetitor: "Choose Potrace if you are scripting bulk monochrome tracing as part of an automated build.",
    whenVectordrop: "Choose VectorDrop for interactive, colour-aware tracing where you want to see and tune the result.",
    faq: [
      {
        q: "Does VectorDrop use Potrace?",
        a: "VectorDrop runs its own browser-native tracing pipeline. The workflow goal is the same as Potrace's, but colour-aware and interactive.",
      },
      {
        q: "Can Potrace convert a PNG directly?",
        a: "Not without a conversion step — Potrace expects bitmap formats such as PBM, so PNGs must be converted and usually thresholded first. VectorDrop takes the PNG as-is.",
      },
      {
        q: "Which produces smaller SVG files?",
        a: "Both produce compact curves. VectorDrop lets you lower the detail setting to cut node count directly, which is usually the fastest way to shrink an SVG.",
      },
    ],
  },
  {
    slug: "convertio",
    metaTitle: "Convertio PNG to SVG Alternative — Real Vector Paths",
    metaDescription:
      "Generic converters wrap the raster inside an SVG container. VectorDrop traces real, editable vector paths from PNG, JPG and WebP — free, no daily limits.",
    competitor: "Convertio",
    competitorUrl: "https://convertio.co",
    tagline: "A real vectoriser, not a general-purpose file converter.",
    lead: "Convertio converts between hundreds of file types, and PNG-to-SVG is one of them — but a generic converter often just embeds the raster inside an SVG wrapper rather than tracing it. VectorDrop actually rebuilds your image as vector paths.",
    verdict: "Convertio is handy for everyday format shuffling. For a genuinely editable, scalable SVG, use a purpose-built vectoriser.",
    table: [
      { feature: "Price", vectordrop: "Free", competitor: "Free tier with limits, then paid" },
      { feature: "True vector tracing", vectordrop: "Yes", competitor: "Limited — often raster-in-SVG" },
      { feature: "Editable paths in Figma", vectordrop: "Yes", competitor: "Often not" },
      { feature: "Daily conversion limits", vectordrop: "None for standard use", competitor: "Yes on free tier" },
      { feature: "Files leave your machine", vectordrop: "Playground runs in-browser", competitor: "Uploaded to their servers" },
      { feature: "Format breadth", vectordrop: "Image to SVG", competitor: "Hundreds of formats" },
    ],
    vectordropPros: [
      "Produces real vector paths you can select and edit",
      "No daily conversion cap on standard use",
      "Tunable detail, smoothing, and colour count",
      "Built specifically for the raster-to-vector problem",
    ],
    competitorPros: [
      "Converts almost any format to almost any other",
      "Useful as a general-purpose utility",
      "Handles documents, audio, and video too",
    ],
    whenCompetitor: "Choose Convertio when you need broad, occasional format conversion across many file types.",
    whenVectordrop: "Choose VectorDrop when the SVG has to be genuinely editable and scale cleanly.",
    faq: [
      {
        q: "Why does my Convertio SVG still look pixelated when I zoom in?",
        a: "Because generic converters frequently wrap the original raster image inside an SVG container instead of tracing it into paths. The file extension changes; the pixels do not. VectorDrop traces the artwork into real paths.",
      },
      {
        q: "How can I tell if an SVG is truly vector?",
        a: "Open it in a text editor. Real vector SVGs contain path, polygon, or shape elements. A wrapped raster contains a single image element with an embedded base64 blob.",
      },
      {
        q: "Is VectorDrop limited to a number of files per day?",
        a: "No. Standard conversions are free without a daily cap.",
      },
    ],
  },
];

export const comparisonBySlug = new Map(comparisons.map((c) => [c.slug, c]));
