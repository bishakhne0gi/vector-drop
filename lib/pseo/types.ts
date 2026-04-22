export type FaqItem = { q: string; a: string };

export type ComparisonEntry = {
  slug: string;
  competitor: string;
  competitorUrl?: string;
  tagline: string;
  lead: string;
  verdict: string;
  table: {
    feature: string;
    vectordrop: string;
    competitor: string;
  }[];
  vectordropPros: string[];
  competitorPros: string[];
  whenCompetitor: string;
  whenVectordrop: string;
  faq: FaqItem[];
};

export type FormatEntry = {
  slug: string;
  from: string;
  to: string;
  tagline: string;
  lead: string;
  whyConvert: string[];
  steps: { title: string; body: string }[];
  qualityNotes: string;
  faq: FaqItem[];
};

export type UseCaseEntry = {
  slug: string;
  title: string;
  audience: string;
  tagline: string;
  lead: string;
  benefits: string[];
  tips: string[];
  examples: string[];
  faq: FaqItem[];
};

export type HowToEntry = {
  slug: string;
  title: string;
  tagline: string;
  lead: string;
  prerequisites: string[];
  steps: { title: string; body: string }[];
  tips: string[];
  faq: FaqItem[];
};
