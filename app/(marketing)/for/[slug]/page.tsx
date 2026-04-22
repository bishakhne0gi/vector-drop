import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useCases, useCaseBySlug } from "@/lib/pseo/use-cases";
import {
  JsonLd,
  PseoBulletList,
  PseoCta,
  PseoFaq,
  PseoHero,
  PseoSection,
  PseoShell,
} from "@/components/pseo/PseoShell";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return useCases.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = useCaseBySlug.get(slug);
  if (!entry) return {};
  const title = `${entry.title} — VectorDrop`;
  const description = entry.tagline;
  const url = `https://vectordrop.co.in/for/${entry.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const entry = useCaseBySlug.get(slug);
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
        eyebrow={`For ${entry.audience}`}
        title={entry.title}
        tagline={entry.tagline}
        lead={entry.lead}
      />

      <PseoSection title="Why VectorDrop for this">
        <PseoBulletList items={entry.benefits} />
      </PseoSection>

      <PseoSection title="Tips for best results">
        <PseoBulletList items={entry.tips} />
      </PseoSection>

      <PseoSection title="Real examples">
        <PseoBulletList items={entry.examples} />
      </PseoSection>

      <PseoSection title="Frequently asked questions">
        <PseoFaq items={entry.faq} />
      </PseoSection>

      <PseoCta />
    </PseoShell>
  );
}
