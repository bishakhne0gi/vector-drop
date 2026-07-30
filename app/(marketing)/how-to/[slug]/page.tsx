import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/seo/site";
import { howTos, howToBySlug } from "@/lib/pseo/how-tos";
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
  return howTos.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = howToBySlug.get(slug);
  if (!entry) return {};
  const title = `${entry.title} — Free Step-by-Step Guide`;
  const description = `${entry.tagline} Step-by-step guide with tips and FAQs.`.slice(0, 158);
  const url = `${SITE_URL}/how-to/${entry.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HowToPage({ params }: Props) {
  const { slug } = await params;
  const entry = howToBySlug.get(slug);
  if (!entry) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: entry.title,
        description: entry.tagline,
        step: entry.steps.map((s) => ({
          "@type": "HowToStep",
          name: s.title,
          text: s.body,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: entry.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <PseoShell>
      <JsonLd data={jsonLd} />
      <PseoHero
        eyebrow="How-to guide"
        title={entry.title}
        tagline={entry.tagline}
        lead={entry.lead}
      />

      <PseoSection title="What you need">
        <PseoBulletList items={entry.prerequisites} />
      </PseoSection>

      <PseoSection title="Steps">
        <PseoNumberedSteps steps={entry.steps} />
      </PseoSection>

      <PseoSection title="Tips">
        <PseoBulletList items={entry.tips} />
      </PseoSection>

      <PseoSection title="Frequently asked questions">
        <PseoFaq items={entry.faq} />
      </PseoSection>

      <PseoCta />
    </PseoShell>
  );
}
