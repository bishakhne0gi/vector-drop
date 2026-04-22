import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { comparisons, comparisonBySlug } from "@/lib/pseo/comparisons";
import {
  JsonLd,
  PseoBulletList,
  PseoCta,
  PseoFaq,
  PseoHero,
  PseoSection,
  PseoShell,
} from "@/components/pseo/PseoShell";

type Props = { params: Promise<{ competitor: string }> };

export function generateStaticParams() {
  return comparisons.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params;
  const entry = comparisonBySlug.get(competitor);
  if (!entry) return {};
  const title = `VectorDrop vs ${entry.competitor} — Free Image to SVG Alternative`;
  const description = entry.tagline;
  const url = `https://vectordrop.co.in/vs/${entry.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { competitor } = await params;
  const entry = comparisonBySlug.get(competitor);
  if (!entry) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entry.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <PseoShell>
      <JsonLd data={jsonLd} />
      <PseoHero
        eyebrow="Comparison"
        title={`VectorDrop vs ${entry.competitor}`}
        tagline={entry.tagline}
        lead={entry.lead}
      />

      <PseoSection title="Feature-by-feature comparison">
        <div
          className="overflow-x-auto"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                <th className="text-left p-3 font-medium text-white">Feature</th>
                <th className="text-left p-3 font-medium text-white">VectorDrop</th>
                <th className="text-left p-3 font-medium text-white">{entry.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {entry.table.map((row) => (
                <tr key={row.feature} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td className="p-3" style={{ color: "rgba(255,255,255,0.55)" }}>{row.feature}</td>
                  <td className="p-3 text-white">{row.vectordrop}</td>
                  <td className="p-3" style={{ color: "rgba(255,255,255,0.70)" }}>{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PseoSection>

      <PseoSection title="Where VectorDrop wins">
        <PseoBulletList items={entry.vectordropPros} />
      </PseoSection>

      <PseoSection title={`Where ${entry.competitor} still makes sense`}>
        <PseoBulletList items={entry.competitorPros} />
      </PseoSection>

      <PseoSection title="When to pick each">
        <p className="mb-3">{entry.whenVectordrop}</p>
        <p>{entry.whenCompetitor}</p>
      </PseoSection>

      <PseoSection title="The verdict">
        <p>{entry.verdict}</p>
      </PseoSection>

      <PseoSection title="Frequently asked questions">
        <PseoFaq items={entry.faq} />
      </PseoSection>

      <PseoCta />
    </PseoShell>
  );
}
