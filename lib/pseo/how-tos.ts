import type { HowToEntry } from "./types";

export const howTos: HowToEntry[] = [
  {
    slug: "convert-png-to-svg",
    title: "How to convert PNG to SVG",
    tagline: "Turn any PNG into an editable SVG vector in under a minute.",
    lead: "This guide walks through converting a PNG image into a clean, scalable SVG using VectorDrop's free browser-based vectoriser. No design software and no install needed.",
    prerequisites: [
      "A PNG image on your device (logo, icon, illustration, or sketch)",
      "A modern browser (Chrome, Edge, Safari, Firefox, Arc)",
      "Optional: a vector editor like Figma or Illustrator for post-tweaks",
    ],
    steps: [
      { title: "Open the VectorDrop playground", body: "Visit vectordrop.co.in and drop into the live playground." },
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
        q: "Is VectorDrop free to use?",
        a: "Yes. VectorDrop is free to use for converting PNG to SVG.",
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
      { title: "Open VectorDrop's playground", body: "Go to vectordrop.co.in and open the playground." },
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
    title: "How to Convert PNG to SVG in Figma",
    tagline: "Figma can't trace a PNG into a vector on its own — here's the free way to do it.",
    lead: "If you have tried to turn a PNG into an SVG inside Figma, you have probably discovered that there is no button for it. Figma is a vector editor, but it has no built-in raster-to-vector trace — dropping a PNG in and exporting as SVG just wraps the same pixels in an SVG container. This guide shows the actual fix: trace the PNG to real vector paths with VectorDrop, then import the SVG into Figma fully editable. It is free and takes about a minute.",
    prerequisites: [
      "A PNG source file (a logo, icon, or line art works best)",
      "A Figma account — the free tier is enough",
      "A browser",
    ],
    steps: [
      { title: "Open VectorDrop", body: "Go to vectordrop.co.in and open the live playground. Nothing to install and no account needed." },
      { title: "Upload the PNG", body: "Drag and drop the PNG onto the canvas — the trace runs instantly and shows a live preview." },
      { title: "Tune the SVG output", body: "Use the playground controls to balance detail against node count. Fewer nodes means cleaner curves and a file that stays responsive once it is in Figma." },
      { title: "Export the SVG", body: "Download the SVG file to your device." },
      { title: "Import into Figma", body: "Drag the .svg file straight from your file manager onto the Figma canvas. You can also use File → Place image, but dragging is faster and gives the same result." },
      { title: "Edit as vector in Figma", body: "The SVG arrives as a real vector group. Double-click into it to select individual paths, recolour fills, adjust nodes with the pen tool, or resize to any dimension without blurring." },
    ],
    tips: [
      "Verify you got a true vector: double-click the imported layer. If you can select individual paths and nodes, the trace worked. If you only ever select one rectangular image object, you imported a PNG wrapped in an SVG, not a traced vector",
      "Keep the node count low — a 3,000-node SVG will make Figma sluggish and is almost never necessary for a logo",
      "Flatten and Outline Stroke only operate on vectors that already exist; neither converts a raster image into paths",
      "Group the SVG's layers in Figma right after import to keep your layer panel tidy",
      "If the traced shape has stray specks, raise the smoothing or remove the noise in the source PNG before tracing — cleaning up in Figma afterwards is far slower",
    ],
    faq: [
      {
        q: "Can Figma convert a PNG to SVG natively?",
        a: "No. Figma has no built-in image trace or vectorise function. Exporting a PNG layer as SVG produces an SVG file with the original bitmap embedded inside it — the file extension changes, but it does not become scalable vector artwork. You need to trace the image outside Figma first.",
      },
      {
        q: "Is there a Figma plugin that does this?",
        a: "There are community plugins that attempt raster tracing inside Figma. They can work for simple shapes, but they run inside Figma's plugin sandbox and generally give you less control over detail and smoothing than a dedicated tracer. Tracing first and importing the finished SVG is usually both faster and cleaner.",
      },
      {
        q: "Why does my PNG look blurry when I scale it up in Figma?",
        a: "Because it is still a raster image. Figma will happily scale a PNG, but it is interpolating pixels, not redrawing shapes. Only a genuine vector stays crisp at any size — which is exactly what tracing produces.",
      },
      {
        q: "Can Figma open VectorDrop SVGs?",
        a: "Yes. VectorDrop exports standard SVG, which Figma imports natively as editable vector paths.",
      },
      {
        q: "Do I need a paid Figma plan?",
        a: "No. Importing and editing SVGs works on Figma's free tier.",
      },
      {
        q: "How do I go the other way and export an SVG out of Figma?",
        a: "Select the layer or frame, open the Export section at the bottom of the right-hand panel, choose SVG as the format, and click Export. This works for any vector layer, including one you imported from VectorDrop.",
      },
    ],
  },
];

export const howToBySlug = new Map(howTos.map((h) => [h.slug, h]));
