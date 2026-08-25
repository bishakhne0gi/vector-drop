import type { UseCaseEntry } from "./types";

export const useCases: UseCaseEntry[] = [
  {
    slug: "logos",
    title: "Vectorise logos online",
    audience: "Founders, designers, and marketers",
    tagline: "Turn raster logos into sharp, scalable SVG vectors — free.",
    lead: "A logo saved as PNG or JPG is fine for web preview but fails the moment you need print, signage, or retina display. VectorDrop vectorises your logo into a clean SVG that scales to any size and stays crisp.",
    benefits: [
      "Sharp at any size — business cards to billboards",
      "Editable — tweak colours and paths in Figma or Illustrator",
      "Tiny file size — faster loads on the web",
      "Works for print, screen, embroidery, and laser cutting",
    ],
    tips: [
      "Start from the largest clean raster source you have",
      "Prefer PNG over JPG for logo sources — less compression noise",
      "Simplify colours in the playground for flatter, crisper paths",
      "Save the exported SVG as your new master — retire the raster",
    ],
    examples: [
      "Converting a PNG startup logo to SVG for a new website",
      "Recreating a vintage brand logo from a scanned reference",
      "Turning a social-avatar raster into a scalable brand mark",
      "Rebuilding a client's logo as SVG from a low-res handoff",
    ],
    faq: [
      {
        q: "Will my vectorised logo look identical to the original?",
        a: "For clean, flat-colour logos, yes — effectively identical, and sharper at large sizes. For detailed illustrative logos, the SVG is a close, editable interpretation.",
      },
      {
        q: "Is this good enough for print and signage?",
        a: "Yes. SVG is the standard handoff format for print production — vectors are resolution-independent.",
      },
      {
        q: "Can I tweak the logo after conversion?",
        a: "Absolutely. Open the SVG in Figma, Illustrator, Inkscape, or any vector editor and edit paths and colours freely.",
      },
    ],
  },
  {
    slug: "icons",
    title: "Convert icons to SVG for design systems",
    audience: "Frontend developers and product designers",
    tagline: "Build scalable SVG icon sets from raster sources — free.",
    lead: "Modern design systems and frontend component libraries expect SVG icons. VectorDrop converts raster icons into clean, consistent SVG paths ready to drop into your icon library, React components, or design tokens.",
    benefits: [
      "Consistent SVG output that imports cleanly into React, Vue, Svelte",
      "Editable path data — style with CSS, recolour with currentColor",
      "Resolution-independent — one file serves all DPIs",
      "Small file sizes — ideal for icon fonts and sprite sheets",
    ],
    tips: [
      "Convert at consistent source sizes (for example 48 or 64 px) for uniform output",
      "Simplify the trace parameters so paths are minimal and editable",
      "Rename SVG IDs and stroke widths in post to fit your design system",
      "Use currentColor for strokes and fills to inherit theme colours",
    ],
    examples: [
      "Replacing raster PNG icons in a React codebase with SVG components",
      "Building a Figma icon library from legacy PNG assets",
      "Creating a sprite sheet of navigation icons from raster mocks",
      "Vectorising emoji-style illustrations for a playful UI",
    ],
    faq: [
      {
        q: "What size should my source icons be?",
        a: "48 px to 256 px usually works well. Larger sources produce more precise traces.",
      },
      {
        q: "Can I style VectorDrop's SVG icons with CSS?",
        a: "Yes. Replace fixed fills with currentColor in your SVGs and they inherit colour from CSS.",
      },
      {
        q: "Is the output compatible with React (Next.js)?",
        a: "Yes. You can import the exported SVG directly or paste the path data into a React component.",
      },
    ],
  },
  {
    slug: "cricut",
    title: "Make SVG cutting files for Cricut",
    audience: "Cricut users, crafters, and makers",
    tagline: "Turn any image into a clean SVG cut file for Cricut — free.",
    lead: "Cricut Design Space works best with clean SVG files. VectorDrop vectorises your raster artwork into crisp, single-path-per-shape SVGs that cut cleanly on Cricut, Silhouette, and other vinyl cutters.",
    benefits: [
      "Clean path output optimised for cutting",
      "Scales to any project size without pixelation",
      "Upload directly to Cricut Design Space as SVG",
      "Free — save the subscription for materials",
    ],
    tips: [
      "Start from a high-contrast raster source — black silhouette on white works best",
      "Simplify colours before exporting so each cut layer is obvious",
      "Test-cut on cheap vinyl first when switching materials",
      "Keep a master SVG and export Design-Space-ready copies per project",
    ],
    examples: [
      "Turning a PNG logo into a vinyl decal cut file",
      "Vectorising a hand-drawn sketch for a T-shirt HTV design",
      "Converting stock illustrations into paper-craft SVG files",
      "Building a sticker sheet from raster icon sources",
    ],
    faq: [
      {
        q: "Will VectorDrop SVGs upload to Cricut Design Space?",
        a: "Yes. Standard SVG uploads directly into Cricut Design Space.",
      },
      {
        q: "Do the SVGs cut cleanly?",
        a: "For high-contrast, flat-colour sources, yes. Tune the detail slider in the playground if the cut file has too many nodes.",
      },
      {
        q: "Can I use the SVGs commercially?",
        a: "You own any SVG you create from your own source artwork.",
      },
    ],
  },
  {
    slug: "embroidery",
    title: "Vectorise artwork for embroidery digitising",
    audience: "Embroidery shops and digitisers",
    tagline: "Clean SVGs for embroidery digitising — free vectoriser.",
    lead: "Embroidery digitising software expects clean vector input. VectorDrop converts raster logos, badges, and artwork into SVG files that import cleanly into digitising tools, giving you a solid base before stitch generation.",
    benefits: [
      "Clean vector paths with minimal stray nodes",
      "Scales without loss — one SVG for every hoop size",
      "Imports cleanly into Wilcom, Hatch, Embrilliance, and others",
      "Free — unlimited raster-to-vector prep before digitising",
    ],
    tips: [
      "Flatten colours before vectorising for simpler stitch plans",
      "Convert complex gradients to discrete colour regions in the playground",
      "Keep source raster at least 1024px wide for best trace fidelity",
      "Combine paths in your vector editor to avoid overlapping stitch layers",
    ],
    examples: [
      "Turning a customer's raster logo into vector ready for digitising",
      "Vectorising a hand-sketched badge for a cap project",
      "Converting a PNG mascot into layered SVG for multi-colour embroidery",
    ],
    faq: [
      {
        q: "Will the SVG import into my digitising software?",
        a: "Standard SVG imports into Wilcom, Hatch, Embrilliance, and most other digitising packages.",
      },
      {
        q: "Does VectorDrop generate stitch files?",
        a: "No — VectorDrop produces clean SVG. Your digitising software handles stitch planning from there.",
      },
    ],
  },
  {
    slug: "laser-cutting",
    title: "Convert images to SVG for laser cutting",
    audience: "Glowforge, xTool, and diode laser owners",
    tagline: "Turn artwork into the clean vector paths your laser software actually wants.",
    lead: "Laser software cuts along vector paths and engraves from raster fills. Feed it a PNG and you can only engrave; feed it a clean SVG and you can cut, score, and engrave from the same file. VectorDrop turns your artwork into that SVG in seconds, free and in the browser.",
    benefits: [
      "SVG is the native import format for Glowforge, xTool Creative Space, LightBurn, and LaserGRBL",
      "Vector paths become cut and score lines — raster images can only ever be engraved",
      "Scale a design from a coaster to a tabletop with no loss of edge quality",
      "Closed paths let you separate cut, score, and engrave operations cleanly",
      "Smaller files that import instantly instead of choking on megapixel bitmaps",
    ],
    tips: [
      "Trace at lower detail — every extra node is another point the laser head has to follow",
      "Check that outlines are closed paths before cutting, or the laser will leave the piece attached",
      "Keep cut lines as strokes and engrave areas as fills so your laser software can separate them",
      "Mind the kerf: the beam removes material, so inset interlocking parts by roughly 0.1–0.2mm",
      "Test on scrap first — a trace that looks right on screen can still have stray micro-paths",
    ],
    examples: [
      "Hand-drawn logos scanned and cut into wooden signage",
      "Stencil artwork converted for acrylic cutting",
      "Line-art illustrations engraved onto slate coasters and leather",
      "Sketched box and joint templates traced into cuttable outlines",
    ],
    faq: [
      {
        q: "Can my laser cutter use a PNG?",
        a: "Only for engraving. Cutting and scoring require vector paths, which is why laser software asks for SVG, DXF, or PDF. Convert the PNG to SVG first and you unlock all three operations.",
      },
      {
        q: "Does VectorDrop export DXF?",
        a: "VectorDrop exports SVG. Glowforge, xTool Creative Space, and LightBurn all import SVG directly, and LightBurn can save out to DXF if your workflow needs it.",
      },
      {
        q: "Why does my traced design cut in the wrong places?",
        a: "Usually stray micro-paths left by anti-aliasing in the source image. Lower the detail setting, reduce the colour count, and delete any tiny leftover shapes before sending it to the laser.",
      },
      {
        q: "What line width should cut lines be?",
        a: "Most laser software treats hairline or very thin strokes as cut lines. Check your machine's convention — Glowforge and LightBurn both key off stroke versus fill rather than an exact width.",
      },
    ],
  },
  {
    slug: "stickers",
    title: "Make SVG cut files for stickers",
    audience: "Sticker makers, print-on-demand sellers, and small shops",
    tagline: "Vector artwork with a clean cut line, ready for die-cut and kiss-cut printing.",
    lead: "Sticker printers need two things: artwork that stays sharp at print resolution, and a vector cut line that tells the machine where to slice. VectorDrop converts your design into scalable SVG paths that give you both.",
    benefits: [
      "Prints crisply at any size — the same file works for a 2-inch and a 6-inch sticker",
      "Vector outlines double as die-cut and kiss-cut paths",
      "Accepted by Sticker Mule, StickerApp, Printful, and most print-on-demand services",
      "Edit colours once and regenerate a whole colourway variant in seconds",
      "Tiny file sizes that upload to print portals without trouble",
    ],
    tips: [
      "Add a 2–3mm offset around the artwork as the cut line so small misalignments never clip the design",
      "Keep the sticker's outer contour a single closed path — multiple overlapping outlines confuse cutters",
      "Avoid fine detail under about 1mm; it will not survive the cut",
      "Convert any text to outlines before sending to print so fonts cannot substitute",
      "Ask your printer whether they want the cut line on its own layer or in a specific spot colour",
    ],
    examples: [
      "Hand-drawn illustrations scanned and turned into die-cut stickers",
      "Brand logos converted into laptop and water-bottle stickers",
      "Procreate and Photoshop artwork prepared for print-on-demand listings",
      "Lettering and slogan designs traced into clean vector outlines",
    ],
    faq: [
      {
        q: "What file format do sticker printers want?",
        a: "Almost all of them accept SVG, PDF, or AI. SVG is the easiest to produce and edit, and converts to PDF trivially if a printer insists on it.",
      },
      {
        q: "How do I create the cut line?",
        a: "Trace the artwork to SVG, then in Figma or Illustrator apply an outward offset path of 2–3mm around the outer contour. That offset path is your cut line.",
      },
      {
        q: "Can I use a PNG for stickers?",
        a: "For the printed artwork, a high-resolution PNG can work at a fixed size. The cut line still has to be vector, and PNG will not scale — which is why converting to SVG is worth it.",
      },
      {
        q: "Will transparency survive?",
        a: "Yes. SVG preserves transparency, so the areas around your design stay unprinted rather than becoming a white box.",
      },
    ],
  },
  {
    slug: "t-shirt-printing",
    title: "Vectorise artwork for T-shirt printing",
    audience: "Screen printers, DTF shops, and apparel sellers",
    tagline: "Clean, separable vector paths for screen printing, vinyl, and DTF.",
    lead: "Screen printing needs one path per colour. Heat-transfer vinyl needs a cut line. Both need vector artwork, and both fall apart when handed a blurry JPG. VectorDrop rebuilds your design as clean, colour-separated SVG paths that are ready for either process.",
    benefits: [
      "Colour-separated paths map directly to screen printing separations",
      "Vector outlines cut correctly on HTV and vinyl plotters",
      "Scales from a left-chest print to a full back print with no resampling",
      "Sharp edges at 300 DPI and beyond for DTF and DTG output",
      "Recolour a design for a different garment colour without re-drawing it",
    ],
    tips: [
      "Reduce the trace to the smallest palette that still reads — every colour is another screen and another setup cost",
      "Mirror the design before cutting heat-transfer vinyl, or it will press backwards",
      "Weed-test fine detail: thin strokes and small counters are painful to weed out of vinyl",
      "Add a slight trap or overlap between adjacent colours so registration drift does not show white gaps",
      "Convert text to outlines so the print shop never hits a missing font",
    ],
    examples: [
      "Band and event logos traced from low-resolution files for merch runs",
      "Hand-lettered slogans converted for single-colour screen printing",
      "Client logos supplied as JPGs, rebuilt as print-ready vectors",
      "Illustrations prepared as HTV cut files for one-off custom shirts",
    ],
    faq: [
      {
        q: "Why do print shops reject JPG artwork?",
        a: "JPG is fixed-resolution and lossy, so edges blur when scaled and compression artefacts show up in the print. Screens and vinyl cutters need vector paths, not pixels.",
      },
      {
        q: "How many colours should a screen-printed design use?",
        a: "Each colour is a separate screen, so cost rises with the count. One to four colours covers most commercial work — trace with a reduced palette to keep it there.",
      },
      {
        q: "Does this work for DTF and DTG?",
        a: "Yes. Those are full-colour processes so separations matter less, but vector artwork still gives you the sharpest possible edges and free scaling.",
      },
      {
        q: "Can I vectorise a client's low-resolution logo?",
        a: "Usually yes — that is one of the most common uses for a tracer. Start from the largest version they have, trace with reduced detail, and clean up the nodes in a vector editor.",
      },
    ],
  },
];

export const useCaseBySlug = new Map(useCases.map((u) => [u.slug, u]));
