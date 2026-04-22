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
];

export const useCaseBySlug = new Map(useCases.map((u) => [u.slug, u]));
