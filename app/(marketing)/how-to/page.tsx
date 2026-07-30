import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { howTos } from "@/lib/pseo/how-tos";
import { JsonLd, PseoCta, PseoShell } from "@/components/pseo/PseoShell";
import { PseoHubGrid, PseoHubHero } from "@/components/pseo/PseoHub";

const TITLE = "Vectorization Guides — How to Convert Images to SVG";
const DESCRIPTION =
  "Step-by-step guides for turning images into clean vectors: PNG to SVG, vectorizing a logo, tracing a sketch, and getting SVGs into Figma.";
const URL = `${SITE_URL}/how-to`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function HowToHubPage() {
  const items = howTos.map((h) => ({
    href: `/how-to/${h.slug}`,
    title: h.title,
    blurb: h.tagline,
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
          { "@type": "ListItem", position: 2, name: "Guides", item: URL },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: howTos.map((h, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: h.title,
          url: `${SITE_URL}/how-to/${h.slug}`,
        })),
      },
    ],
  };

  return (
    <PseoShell>
      <JsonLd data={jsonLd} />
      <PseoHubHero
        eyebrow="Guides"
        title="Vectorization guides"
        lead="Practical walkthroughs for the jobs people actually bring to a vectorizer — cleaning up a logo, tracing a hand-drawn sketch, or getting a usable SVG into a design tool."
      />
      <PseoHubGrid items={items} />
      <PseoCta heading="Start vectorizing" />
    </PseoShell>
  );
}
