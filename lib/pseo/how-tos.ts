import type { HowToEntry } from "./types";

export const howTos: HowToEntry[] = [
  {
    slug: "convert-png-to-svg",
    title: "How to convert PNG to SVG",
    tagline: "Turn any PNG into an editable SVG vector in under a minute.",
    lead: "This guide walks through converting a PNG image into a clean, scalable SVG using VectorDrop's free browser-based vectoriser. No design software, no install, no signup needed for the playground.",
    prerequisites: [
      "A PNG image on your device (logo, icon, illustration, or sketch)",
      "A modern browser (Chrome, Edge, Safari, Firefox, Arc)",
      "Optional: a vector editor like Figma or Illustrator for post-tweaks",
    ],
    steps: [
      { title: "Open the VectorDrop playground", body: "Visit vectordrop.co.in and drop into the live playground — no signup required." },
      { title: "Upload your PNG", body: "Drag and drop your PNG onto the upload area, or click to browse and select it." },
      { title: "Let VectorDrop trace the image", body: "The vectoriser converts the PNG into SVG paths in seconds. A live preview appears." },
      { title: "Tune the output", body: "Adjust detail, smoothing, and colour handling in the playground until the SVG matches your intent." },
      { title: "Export SVG", body: "Click Export (or Download) to save the SVG file to your device." },
      { title: "Use your SVG", body: "Open the SVG in Figma, Illustrator, Inkscape, or embed it directly in HTML — it's production-ready." },
    ],
    tips: [
      "Start from the highest-resolution PNG you have — cleaner sources trace better",
      "Reduce colours in the playground for flatter, more editable paths",
      "Check the node count after export; high counts mean the trace is too detailed",
      "Save the original PNG alongside the SVG as a reference",
    ],
    faq: [
      {
        q: "Do I need an account to convert PNG to SVG?",
        a: "No. The VectorDrop playground is free to try without signup.",
      },
      {
        q: "How long does conversion take?",
        a: "A few seconds for typical icons, logos, and flat illustrations.",
      },
      {
        q: "Will the SVG work in my design tool?",
        a: "Yes. VectorDrop exports standard SVG that opens in Figma, Illustrator, Inkscape, Affinity, and the browser.",
      },
    ],
  },
  {
    slug: "vectorize-a-logo",
    title: "How to vectorise a logo",
    tagline: "Rebuild any raster logo as a clean, scalable SVG — free.",
    lead: "Raster logos fall apart at print size. This guide shows how to vectorise a logo into a sharp SVG using VectorDrop, so you have one master file for web, print, signage, and merch.",
    prerequisites: [
      "A raster logo (PNG, JPG, or WebP) — ideally high resolution",
      "A browser",
      "Optional: Figma or Illustrator to touch up the exported SVG",
    ],
    steps: [
      { title: "Get the cleanest source you can", body: "A 1024 px or larger PNG is ideal. Avoid low-resolution screenshots if possible." },
      { title: "Open VectorDrop's playground", body: "Go to vectordrop.co.in — no signup required for the playground." },
      { title: "Upload the logo", body: "Drop the raster file onto the upload area. VectorDrop reads it immediately." },
      { title: "Review the auto-trace", body: "Check the live preview. Zoom in to verify curves and edges look sharp." },
      { title: "Tune parameters", body: "Reduce colours for flatter output. Adjust smoothing until curves feel right." },
      { title: "Export the SVG", body: "Download the final SVG. Store it as your new master logo file." },
      { title: "Touch up in a vector editor (optional)", body: "Open the SVG in Figma or Illustrator and fine-tune paths, colours, or spacing." },
    ],
    tips: [
      "Use a transparent-background PNG as the source when possible",
      "For two-colour logos, flatten to exactly two fills before tracing",
      "Replace fills with currentColor if you plan to use the SVG in the browser and want CSS control",
      "Save both a 'clean' SVG master and a web-optimised variant",
    ],
    faq: [
      {
        q: "Is VectorDrop's logo vectorisation good enough for print?",
        a: "Yes. The exported SVG scales to any print size without loss.",
      },
      {
        q: "Can I vectorise a logo I only have as a screenshot?",
        a: "You can, but quality depends on screenshot resolution. For best results, get a larger source from the brand owner.",
      },
      {
        q: "Do I need Adobe Illustrator to use the SVG?",
        a: "No. Free editors like Figma and Inkscape open SVG natively.",
      },
    ],
  },
  {
    slug: "trace-a-sketch",
    title: "How to trace a hand-drawn sketch to SVG",
    tagline: "Turn paper sketches into editable SVG vectors — free.",
    lead: "Paper sketches and hand-drawn line art are a great starting point for digital design — if you can convert them to clean SVG. This guide walks through scanning, cleaning, and tracing a sketch with VectorDrop.",
    prerequisites: [
      "A sketch on white paper with bold, dark lines",
      "A phone camera or scanner",
      "A browser",
    ],
    steps: [
      { title: "Photograph or scan the sketch", body: "Use a phone camera under even lighting, or a flatbed scanner. Keep the paper flat and the frame square." },
      { title: "Crop and increase contrast", body: "Crop out the background. Bump contrast and brightness in your phone's editor so the lines are dark on near-white paper." },
      { title: "Upload to VectorDrop", body: "Drop the cleaned-up photo or scan into the VectorDrop playground." },
      { title: "Trace to SVG", body: "VectorDrop converts the high-contrast raster into vector paths automatically." },
      { title: "Tune the trace", body: "Use the playground controls to remove speckle and smooth curves." },
      { title: "Export and refine", body: "Download the SVG. Open in Figma or Illustrator to clean stray nodes, join paths, or recolour." },
    ],
    tips: [
      "Strong contrast is critical — dark lines on white paper trace best",
      "Avoid coloured paper, shadows, and ruled guidelines in the source",
      "If the sketch has fine hatching, increase smoothing so the trace does not pick up noise",
      "Consider a quick curves pass in Photoshop or Preview before upload",
    ],
    faq: [
      {
        q: "Can I trace pencil sketches?",
        a: "Yes, but ink or marker sketches trace cleaner. Pencil is faint and picks up paper texture — increase contrast before upload.",
      },
      {
        q: "What resolution should I scan at?",
        a: "300 DPI or better is ideal for detailed sketches.",
      },
    ],
  },
  {
    slug: "png-to-svg-in-figma",
    title: "How to use a PNG as an SVG in Figma",
    tagline: "Vectorise PNGs into SVGs you can drop into Figma — free.",
    lead: "Figma handles raster PNGs fine, but only vectors scale crisply. This guide covers converting a PNG to SVG with VectorDrop and importing it into Figma for a fully editable vector workflow.",
    prerequisites: [
      "A PNG source file",
      "A Figma account and file",
      "A browser",
    ],
    steps: [
      { title: "Open VectorDrop", body: "Go to vectordrop.co.in and open the live playground." },
      { title: "Upload the PNG", body: "Drag and drop the PNG — the trace runs instantly." },
      { title: "Tune the SVG output", body: "Use the playground controls to keep the node count low and curves clean." },
      { title: "Export the SVG", body: "Download the SVG file to your device." },
      { title: "Import into Figma", body: "In your Figma file, drag the SVG onto the canvas, or use Menu → File → Place Image." },
      { title: "Edit as vector in Figma", body: "The SVG arrives as a fully editable vector frame — recolour, resize, and combine paths." },
    ],
    tips: [
      "Keep the SVG's node count low for smoother Figma interactions",
      "Replace fills with currentColor only if you plan to export and use in code — Figma treats colours literally",
      "Group SVG layers in Figma immediately for tidy layer organisation",
    ],
    faq: [
      {
        q: "Can Figma open VectorDrop SVGs?",
        a: "Yes. Standard SVG imports natively into Figma as editable vectors.",
      },
      {
        q: "Do I need Figma Professional?",
        a: "No. The free tier is enough to import and edit SVGs.",
      },
    ],
  },
];

export const howToBySlug = new Map(howTos.map((h) => [h.slug, h]));
