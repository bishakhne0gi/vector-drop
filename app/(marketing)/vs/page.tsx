import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { comparisons } from "@/lib/pseo/comparisons";
import { JsonLd, PseoCta, PseoShell } from "@/components/pseo/PseoShell";
import { PseoHubGrid, PseoHubHero } from "@/components/pseo/PseoHub";

const TITLE = "Free Vectorizer Alternatives — VectorDrop vs the Alternatives";
const DESCRIPTION =
  "Honest side-by-side comparisons of VectorDrop against Vectorizer.AI, Vector Magic, Illustrator Image Trace, Inkscape, and SVGTrace — features, pricing, and when to pick each.";
const URL = `${SITE_URL}/vs`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function VsHubPage() {
  const items = comparisons.map((c) => ({
    href: `/vs/${c.slug}`,
    title: `VectorDrop vs ${c.competitor}`,
    blurb: c.tagline,
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
          { "@type": "ListItem", position: 2, name: "Comparisons", item: URL },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: comparisons.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `VectorDrop vs ${c.competitor}`,
          url: `${SITE_URL}/vs/${c.slug}`,
        })),
      },
    ],
  };

  return (
    <PseoShell>
      <JsonLd data={jsonLd} />
      <PseoHubHero
        eyebrow="Comparisons"
        title="How VectorDrop compares"
        lead="Every vectorizer makes a different trade between price, control, and output quality. These comparisons lay out the differences honestly — including the cases where the other tool is the better choice."
      />
      <PseoHubGrid items={items} />
      <PseoCta heading="Try VectorDrop free" />
    </PseoShell>
  );
}
