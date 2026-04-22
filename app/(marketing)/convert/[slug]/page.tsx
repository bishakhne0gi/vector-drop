import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formats, formatBySlug } from "@/lib/pseo/formats";
import {
  JsonLd,
  PseoBulletList,
  PseoCta,
  PseoFaq,
  PseoHero,
  PseoNumberedSteps,
  PseoSection,
  PseoShell,
} from "@/components/pseo/PseoShell";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return formats.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = formatBySlug.get(slug);
  if (!entry) return {};
  const title = `Convert ${entry.from} to ${entry.to} — Free Online Vectoriser`;
  const description = entry.tagline;
  const url = `https://vectordrop.co.in/convert/${entry.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ConvertPage({ params }: Props) {
  const { slug } = await params;
  const entry = formatBySlug.get(slug);
  if (!entry) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Convert ${entry.from} to ${entry.to}`,
    description: entry.tagline,
    step: entry.steps.map((s) => ({
      "@type": "HowToStep",
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <PseoShell>
      <JsonLd data={jsonLd} />
      <PseoHero
        eyebrow={`${entry.from} → ${entry.to}`}
        title={`Convert ${entry.from} to ${entry.to}`}
        tagline={entry.tagline}
        lead={entry.lead}
      />

      <PseoSection title={`Why convert ${entry.from} to ${entry.to}?`}>
        <PseoBulletList items={entry.whyConvert} />
      </PseoSection>

      <PseoSection title={`How to convert ${entry.from} to ${entry.to}`}>
        <PseoNumberedSteps steps={entry.steps} />
      </PseoSection>

      <PseoSection title="What to expect from the output">
        <p>{entry.qualityNotes}</p>
      </PseoSection>

      <PseoSection title="Frequently asked questions">
        <PseoFaq items={entry.faq} />
      </PseoSection>

      <PseoCta heading={`Convert ${entry.from} to ${entry.to} now`} />
    </PseoShell>
  );
}
