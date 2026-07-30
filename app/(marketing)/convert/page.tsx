import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { formats } from "@/lib/pseo/formats";
import { JsonLd, PseoCta, PseoShell } from "@/components/pseo/PseoShell";
import { PseoHubGrid, PseoHubHero } from "@/components/pseo/PseoHub";

const TITLE = "Free Image to Vector Converters — PNG, JPG, WebP & Bitmap to SVG";
const DESCRIPTION =
  "Convert PNG, JPG, WebP, and bitmap images to clean, editable SVG vectors. Free, instant, and browser-based — no signup and no watermark.";
const URL = `${SITE_URL}/convert`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function ConvertHubPage() {
  const items = formats.map((f) => ({
    href: `/convert/${f.slug}`,
    title: `${f.from} to ${f.to}`,
    blurb: f.tagline,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${URL}#page`,
        url: URL,
        name: TITLE,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "VectorDrop", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Converters", item: URL },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: formats.map((f, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `Convert ${f.from} to ${f.to}`,
          url: `${SITE_URL}/convert/${f.slug}`,
        })),
      },
    ],
  };

  return (
    <PseoShell>
      <JsonLd data={jsonLd} />
      <PseoHubHero
        eyebrow="Converters"
        title="Convert any image to a clean SVG vector"
        lead="Pick your source format below. Every converter runs in the browser, returns editable SVG paths rather than an embedded bitmap, and is free to use without an account."
      />
      <PseoHubGrid items={items} />
      <PseoCta heading="Convert your image now" />
    </PseoShell>
  );
}
