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
  {
    slug: "edit-an-svg-file",
    title: "How to edit an SVG file",
    tagline: "Open, change, and re-save an SVG — in a design tool or in plain text.",
    lead: "An SVG is both a picture and a text file, which means there are two completely valid ways to edit one. This guide covers both, and what to do when the SVG you were given turns out not to be editable at all.",
    prerequisites: [
      "An SVG file (or an image you can convert to SVG first)",
      "A vector editor such as Figma, Illustrator, Inkscape, or Affinity Designer",
      "Optional: any text editor, for quick colour and size changes",
    ],
    steps: [
      { title: "Check that it is really a vector", body: "Open the SVG in a text editor. If you see path, polygon, circle, or rect elements, it is genuinely editable. If you see a single image element with a long base64 string, it is a raster file in an SVG wrapper — trace it in VectorDrop first to get real paths." },
      { title: "Open it in a vector editor", body: "Drag the SVG into Figma, or use File → Open in Illustrator, Inkscape, or Affinity Designer. All of them read standard SVG natively." },
      { title: "Ungroup and select shapes", body: "SVG paths usually arrive grouped. Ungroup once or twice, then click individual paths to select them. In Figma this is Enter to drill into a group." },
      { title: "Change colours, paths, and size", body: "Edit fills and strokes as you would any vector shape. Use the pen or node tool to move individual points. Because it is vector, resizing never degrades quality." },
      { title: "Or edit the markup directly", body: "For simple changes, editing the text is faster: change fill=\"#000000\" to your colour, adjust the width and height attributes, or edit the viewBox to crop. Save and reopen to see the result." },
      { title: "Export or save", body: "Save back out as SVG. In Figma, select the frame and use Export → SVG. Keep 'include id attributes' off for smaller files." },
    ],
    tips: [
      "If every shape selects as one object, ungroup again — SVGs often nest groups several levels deep",
      "Replace hardcoded fills with fill=\"currentColor\" to let CSS control the colour on the web",
      "Fewer nodes means an easier edit — trace at a lower detail setting if the paths feel unmanageable",
      "Always keep an untouched copy before you start editing the markup by hand",
    ],
    faq: [
      {
        q: "Can I edit an SVG without design software?",
        a: "Yes. SVG is XML, so any text editor can change colours, dimensions, and the viewBox. For reshaping paths, a vector editor is far more practical.",
      },
      {
        q: "Why can't I select individual shapes in my SVG?",
        a: "Either the shapes are nested inside groups (ungroup again), or the file is a raster image wrapped in SVG. In the second case, convert the original image in VectorDrop to get real, selectable paths.",
      },
      {
        q: "Does editing an SVG lose quality?",
        a: "No. SVG stores mathematical shapes, not pixels, so it can be edited and resized indefinitely without degradation.",
      },
    ],
  },
  {
    slug: "make-svg-background-transparent",
    title: "How to make an SVG background transparent",
    tagline: "Remove the white box behind your vector, for good.",
    lead: "SVGs are transparent by default — so a white or coloured background almost always means a background rectangle got traced along with your artwork. Here is how to find it and remove it.",
    prerequisites: [
      "The SVG file, or the PNG/JPG you want to convert",
      "A text editor or vector editor",
    ],
    steps: [
      { title: "Understand where the background came from", body: "SVG has no background of its own. If yours looks white, either a rect element covers the canvas, or the source image had an opaque background that the trace faithfully reproduced." },
      { title: "Trace from a transparent source", body: "The cleanest fix is upstream. Convert a PNG that already has a transparent background in VectorDrop — transparency is preserved, so no background shape is created in the first place." },
      { title: "Find the background rectangle", body: "Open the SVG in a text editor. Look near the top for a rect or path whose dimensions match the full width and height, with a white or solid fill." },
      { title: "Delete it", body: "Remove that element entirely, or set its fill to \"none\". Save and reopen — the artwork should now sit on a checkerboard in your editor, meaning transparent." },
      { title: "Or remove it visually", body: "In Figma or Illustrator, click the background shape (it is usually the bottom-most layer), confirm it covers the whole canvas, and delete it." },
      { title: "Verify it", body: "Open the SVG in a browser over a coloured page background, or place it on a dark layer in your design tool. Any remaining white will be obvious." },
    ],
    tips: [
      "Set fill=\"none\" rather than fill=\"white\" — white is a colour, not transparency",
      "If the background is a gradient or photo, remove it from the raster image before tracing",
      "Trim the viewBox after deleting the background so the SVG has no dead space around the art",
      "Check in both a light and a dark context before shipping the asset",
    ],
    faq: [
      {
        q: "Do SVGs support transparency?",
        a: "Yes, natively. An SVG with nothing behind the artwork is fully transparent, and it also supports partial transparency through fill-opacity and opacity.",
      },
      {
        q: "Why does my converted SVG have a white background?",
        a: "The source image almost certainly had an opaque white background, so the tracer converted that area into a shape. Start from a transparent PNG, or delete the resulting background element.",
      },
      {
        q: "Will a transparent SVG work in Cricut Design Space?",
        a: "Yes. Cricut reads the vector paths, and a transparent background means no unwanted extra cut layer.",
      },
    ],
  },
  {
    slug: "convert-a-screenshot-to-svg",
    title: "How to convert a screenshot to SVG",
    tagline: "Turn a screenshot of a logo, icon, or diagram into a crisp vector.",
    lead: "Screenshots are low-resolution, anti-aliased, and often compressed — the worst possible input for tracing. With the right preparation, though, you can still pull a clean, scalable SVG out of one. This guide covers how.",
    prerequisites: [
      "A screenshot containing the artwork you want (PNG is better than JPG)",
      "A modern browser",
      "Optional: a cropping tool — the OS screenshot tool is enough",
    ],
    steps: [
      { title: "Capture at the highest resolution you can", body: "Zoom the source in your browser or app before taking the screenshot. A logo captured at 400% zoom traces dramatically better than one captured at 100%." },
      { title: "Crop tightly to the artwork", body: "Remove surrounding UI, text, and background. The tracer should see only the shape you want, or every stray pixel becomes a path." },
      { title: "Save as PNG, never JPG", body: "JPG compression adds blocky artefacts around edges that the tracer will faithfully reproduce as ragged paths. PNG is lossless and keeps edges clean." },
      { title: "Upload to VectorDrop", body: "Drop the cropped PNG into the playground. The trace runs immediately with a live preview." },
      { title: "Lower the detail, raise the smoothing", body: "Screenshots are anti-aliased, which creates a halo of intermediate pixels. Reducing detail and increasing smoothing collapses that halo into a single clean edge." },
      { title: "Reduce the colour count", body: "Anti-aliasing invents dozens of near-identical shades. Cutting the colour count down to the handful the artwork actually uses removes most of the noise." },
      { title: "Export and tidy up", body: "Download the SVG and open it in Figma or Illustrator to nudge any remaining rough nodes. For a logo, this is usually a minute of work." },
    ],
    tips: [
      "A screenshot of a logo is a last resort — always ask for the original vector first",
      "Flat, high-contrast artwork traces well; screenshots of photos or gradients do not",
      "Retina and HiDPI screens capture at 2x, which is a real quality advantage — use them",
      "If the edges stay fuzzy, the source is simply too small; recapture at a higher zoom",
    ],
    faq: [
      {
        q: "Can I vectorise a low-resolution screenshot?",
        a: "You can, but the tracer can only work with the pixels it is given. Below roughly 200px across, edges become guesswork. Recapture at a higher zoom whenever possible.",
      },
      {
        q: "Why is my traced screenshot full of tiny stray shapes?",
        a: "Anti-aliasing and compression artefacts. Lower the detail setting, raise smoothing, and reduce the number of traced colours.",
      },
      {
        q: "Is it legal to vectorise a logo from a screenshot?",
        a: "Recreating a logo does not grant you rights to it. Use this for your own brand assets, or where you have permission from the owner.",
      },
    ],
  },
  {
    slug: "reduce-svg-file-size",
    title: "How to reduce SVG file size",
    tagline: "Cut node count and bloat without visibly changing the artwork.",
    lead: "A traced SVG that weighs more than the PNG it came from is a trace with too many nodes. This guide covers the two levers that matter — tracing more coarsely, and stripping what the file does not need.",
    prerequisites: [
      "An SVG file that is larger than you want",
      "Optional: the original raster image, for a cleaner re-trace",
    ],
    steps: [
      { title: "Find out why it is big", body: "Open the SVG in a text editor. A huge number of path elements or extremely long d attributes means too many nodes. A single enormous base64 string means a raster image is embedded and no tracing actually happened." },
      { title: "Re-trace at lower detail", body: "By far the most effective fix. Reload the original image in VectorDrop and reduce the detail setting — fewer nodes, smaller file, and for flat artwork it is usually indistinguishable at normal sizes." },
      { title: "Reduce the colour count", body: "Every extra traced colour is another full set of paths. Most logos and icons need five colours or fewer. Cutting the palette can halve the file on its own." },
      { title: "Strip editor metadata", body: "Illustrator and Inkscape write large blocks of private metadata into exports. Deleting the metadata, sodipodi, and inkscape namespaced elements is safe and often removes a surprising amount." },
      { title: "Trim coordinate precision", body: "Coordinates like 128.4839201847 carry meaningless precision. Rounding to two or three decimal places shrinks the d attributes noticeably with no visible change." },
      { title: "Serve it compressed", body: "SVG is text, so it gzips extremely well — often to a third of its size. Make sure your host or CDN has compression enabled for image/svg+xml." },
    ],
    tips: [
      "Compare the rendered result at your real display size, not zoomed to 400%",
      "For icons under 64px, aggressive simplification is essentially free",
      "Inline critical SVGs in your HTML to avoid a separate request entirely",
      "If your SVG is megabytes, it almost certainly contains an embedded raster — re-trace it",
    ],
    faq: [
      {
        q: "Why is my SVG bigger than the original PNG?",
        a: "Because the trace produced far more nodes than the artwork needs. Re-trace at a lower detail setting and with fewer colours; a well-traced logo SVG is usually a few kilobytes.",
      },
      {
        q: "Does reducing SVG file size lose quality?",
        a: "Simplification removes nodes, so very fine detail can soften. For logos, icons, and flat illustrations the difference is invisible at normal viewing sizes.",
      },
      {
        q: "What is a reasonable size for an icon SVG?",
        a: "Under 5KB uncompressed is typical for a well-traced icon. Logos with more detail commonly land between 10KB and 50KB.",
      },
    ],
  },
];

export const howToBySlug = new Map(howTos.map((h) => [h.slug, h]));
