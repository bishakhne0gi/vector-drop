import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { useCases } from "@/lib/pseo/use-cases";
import { JsonLd, PseoCta, PseoShell } from "@/components/pseo/PseoShell";
import { PseoHubGrid, PseoHubHero } from "@/components/pseo/PseoHub";

const TITLE = "Vectorize Logos, Icons, Cricut Files & Embroidery Designs";
const DESCRIPTION =
  "See how VectorDrop handles each job: crisp logo vectors, UI icon sets, cut-ready Cricut SVGs, and clean shapes for embroidery digitizing.";
const URL = `${SITE_URL}/for`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function ForHubPage() {
  const items = useCases.map((u) => ({
    href: `/for/${u.slug}`,
    title: u.title,
    blurb: u.tagline,
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
          { "@type": "ListItem", position: 2, name: "Use cases", item: URL },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: useCases.map((u, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: u.title,
          url: `${SITE_URL}/for/${u.slug}`,
        })),
      },
    ],
  };

  return (
    <PseoShell>
      <JsonLd data={jsonLd} />
      <PseoHubHero
        eyebrow="Use cases"
        title="What people vectorize with VectorDrop"
        lead="A cut file for a vinyl machine and a UI icon need very different things from a tracer. These pages cover the settings and gotchas for each job."
      />
      <PseoHubGrid items={items} />
      <PseoCta heading="Try it on your file" />
    </PseoShell>
  );
}
