import type { FormatEntry } from "./types";

export const formats: FormatEntry[] = [
  {
    slug: "png-to-svg",
    from: "PNG",
    to: "SVG",
    tagline: "Convert PNG to SVG — free, online, pixel-perfect.",
    lead: "Turn any PNG image into a clean, editable SVG vector in seconds. VectorDrop traces your PNG into crisp vector paths that scale to any size without pixelation. Free and browser-native.",
    whyConvert: [
      "SVG scales infinitely — a single file works for tiny icons and huge billboards",
      "SVG is hand-editable — tweak colours and paths in Figma, Illustrator, or code",
      "SVG has tiny file sizes for icons and logos compared to PNG",
      "SVG supports CSS, animation, and interactivity in the browser",
      "SVG is ideal for design systems, icon libraries, and responsive UI",
    ],
    steps: [
      { title: "Upload your PNG", body: "Drag and drop your PNG into the VectorDrop playground, or browse and select it. Files stay local in your browser." },
      { title: "Auto-vectorise", body: "VectorDrop traces the raster into clean SVG paths automatically. Live preview updates instantly." },
      { title: "Tune the output", body: "Adjust detail, smoothing, and colour handling in the playground until the vector matches your intent." },
      { title: "Export SVG", body: "Download a production-ready SVG file. Open it directly in Figma, Illustrator, Inkscape, or any SVG editor." },
    ],
    qualityNotes: "Clean PNG sources (icons, logos, flat illustrations, line art) convert to clean SVG with minimal node counts. Noisy or photographic PNGs will convert but may need tuning — VectorDrop's playground gives you live controls for this.",
    faq: [
      {
        q: "Is PNG to SVG conversion lossless?",
        a: "PNG is raster and SVG is vector — the conversion rebuilds the artwork as paths rather than pixels. For icons and flat art, the result is effectively lossless at any scale. For photographic PNGs, the SVG is a traced approximation.",
      },
      {
        q: "What PNG sizes work best?",
        a: "Anywhere from 64px icons up to multi-megapixel source art. Larger, cleaner sources give more precise traces.",
      },
      {
        q: "Can I convert transparent PNG to SVG?",
        a: "Yes. Transparency is preserved where possible — SVG supports transparent backgrounds natively.",
      },
      {
        q: "Is this really free?",
        a: "Yes. PNG to SVG conversion is free on VectorDrop, with no watermark or export paywall for standard use.",
      },
    ],
  },
  {
    slug: "jpg-to-svg",
    from: "JPG",
    to: "SVG",
    tagline: "Convert JPG to SVG — free, browser-based vectoriser.",
    lead: "Upload a JPG or JPEG image and get a clean, scalable SVG vector in seconds. VectorDrop strips the lossy compression of JPG and rebuilds the artwork as editable vector paths — perfect for logos, icons, and flat art captured as JPGs.",
    whyConvert: [
      "JPGs compress lossily — SVG restores crispness for logos and icons",
      "SVG scales to any size without blurring or artefacts",
      "SVG is editable in Figma, Illustrator, Inkscape, and any SVG-aware tool",
      "SVG embeds cleanly in web pages, apps, and print layouts",
    ],
    steps: [
      { title: "Upload your JPG", body: "Drag and drop a JPG or JPEG image into the VectorDrop playground, or browse and select it." },
      { title: "Auto-vectorise", body: "VectorDrop traces the JPG into SVG paths, compensating for compression artefacts where possible." },
      { title: "Tune and preview", body: "Use the live playground to adjust detail and smoothing until the SVG matches what you want." },
      { title: "Export SVG", body: "Download a standalone SVG ready for Figma, Illustrator, the web, or print." },
    ],
    qualityNotes: "JPGs with low compression and clean artwork convert beautifully. Heavily compressed JPGs with noise or blocking artefacts may produce rougher traces — tune in the playground or start from a cleaner source when possible.",
    faq: [
      {
        q: "Does VectorDrop handle JPG compression artefacts?",
        a: "VectorDrop includes smoothing controls that reduce the impact of JPG compression on the final SVG. For critical work, start from a PNG or high-quality source where possible.",
      },
      {
        q: "Can I convert photo JPGs to SVG?",
        a: "You can, but photographic SVG is an artistic approximation, not a pixel-for-pixel copy. For logos, icons, and flat art the result is excellent.",
      },
      {
        q: "What's the maximum file size?",
        a: "VectorDrop handles typical web and design source files without trouble.",
      },
    ],
  },
  {
    slug: "webp-to-svg",
    from: "WebP",
    to: "SVG",
    tagline: "Convert WebP to SVG — free modern raster-to-vector tool.",
    lead: "WebP is the modern raster format for the web, but it's still raster. VectorDrop turns any WebP into clean, scalable SVG you can edit, animate, and embed anywhere.",
    whyConvert: [
      "SVG scales infinitely — WebP does not",
      "SVG supports CSS styling and animation in the browser",
      "SVG is editable in Figma, Illustrator, and Inkscape",
      "SVG has smaller file sizes than WebP for icons and logos",
    ],
    steps: [
      { title: "Upload your WebP", body: "Drop a WebP file into the VectorDrop playground." },
      { title: "Auto-vectorise", body: "The trace runs in seconds and renders a live SVG preview." },
      { title: "Tune output", body: "Adjust detail and smoothing in the playground to match your source." },
      { title: "Export SVG", body: "Download a production-ready SVG for Figma, Illustrator, or web use." },
    ],
    qualityNotes: "WebP sources behave similarly to PNG for vectorisation — clean icons, logos, and flat art trace cleanly. WebP's smaller file size does not affect trace quality.",
    faq: [
      {
        q: "Do I need to convert WebP to PNG first?",
        a: "No. VectorDrop reads WebP directly.",
      },
      {
        q: "Is quality the same as PNG input?",
        a: "For lossless WebP: yes. For lossy WebP: close to PNG for typical design work.",
      },
    ],
  },
  {
    slug: "bitmap-to-vector",
    from: "Bitmap",
    to: "Vector",
    tagline: "Convert any bitmap image to a vector — free online, no signup.",
    lead: "\"Bitmap\" means any pixel-based image — PNG, JPG, WebP, BMP, GIF, or a scan. VectorDrop converts a bitmap into a true vector: clean SVG paths you can scale to any size, recolour, and edit node by node. It runs in your browser, free, with no watermark and no account.",
    whyConvert: [
      "Bitmaps blur when scaled up — vectors stay sharp at any size, from a 16px favicon to a billboard",
      "Vector paths are hand-editable; bitmap pixels are locked once saved",
      "Vectors are required by most cutting, engraving, and embroidery machines, which cannot read pixels",
      "Vectors are ideal for logos, icons, signage, print, and design systems",
      "SVG files are usually far smaller than the bitmap they came from, and render faster in browsers",
    ],
    steps: [
      { title: "Upload your bitmap", body: "Drag and drop a PNG, JPG/JPEG, or WebP file into the VectorDrop playground. If your file is a BMP, GIF, or TIFF, save it as PNG first — any image editor, or your OS preview app, can do this." },
      { title: "Trace to vector", body: "The engine converts pixels into SVG paths automatically, with a live preview so you can see the trace as it happens." },
      { title: "Adjust in the playground", body: "Tune detail, smoothing, and colour handling until the vector matches your source. More detail means more nodes; less means cleaner curves." },
      { title: "Download SVG", body: "Export a clean, standalone SVG ready for Illustrator, Inkscape, Figma, Cricut Design Space, or the web." },
    ],
    qualityNotes: "The best bitmap-to-vector results come from clean sources: high resolution, flat colours, and crisp edges. Logos, icons, line art, and scanned sketches trace very well. Photographs will convert, but a photo has no underlying shapes to recover — expect a stylised, posterised result rather than a faithful reproduction. If your source is small or blurry, upscaling it before tracing rarely helps; a larger original is always better.",
    faq: [
      {
        q: "What is the difference between a bitmap and a BMP file?",
        a: "They are not the same thing, which is a common source of confusion. \"Bitmap\" is the general term for any image made of pixels — that includes PNG, JPG, WebP, and GIF. \".BMP\" is one specific, mostly obsolete Windows file format. Converting \"bitmap to vector\" almost always means converting a pixel image of any kind into vector paths.",
      },
      {
        q: "What bitmap formats does VectorDrop accept?",
        a: "PNG, JPG / JPEG, and WebP are accepted directly. BMP, GIF, and TIFF are not accepted as-is — save or export them as PNG first, then upload. This takes a few seconds in any image editor and does not lose quality.",
      },
      {
        q: "Does bitmap-to-vector conversion lose quality?",
        a: "The vector output scales without any loss. The trace itself is an interpretation of the bitmap rather than a pixel-perfect copy, but for icons, logos, and flat art it is effectively a quality upgrade, because the result becomes resolution-independent.",
      },
      {
        q: "Is there free bitmap to vector conversion software?",
        a: "Yes. VectorDrop is free and runs in the browser with nothing to install. Inkscape is a free desktop alternative — its Trace Bitmap dialog does the same job, with more manual control but a steeper learning curve.",
      },
      {
        q: "Can I convert a bitmap to vector for a Cricut or laser cutter?",
        a: "Yes, and this is one of the most common reasons to do it. Cutting machines need paths, not pixels. Export the SVG and import it into Cricut Design Space, Silhouette Studio, LightBurn, or your machine's software.",
      },
      {
        q: "How do I convert a bitmap to vector without Illustrator?",
        a: "You do not need Illustrator. VectorDrop does the trace in the browser for free, and the exported SVG opens in Figma, Inkscape, Affinity Designer, or any SVG-aware tool.",
      },
    ],
  },
];

export const formatBySlug = new Map(formats.map((f) => [f.slug, f]));
