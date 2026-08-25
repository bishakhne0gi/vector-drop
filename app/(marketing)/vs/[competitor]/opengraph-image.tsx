import { comparisons, comparisonBySlug } from "@/lib/pseo/comparisons";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const alt = "VectorDrop comparison";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return comparisons.map((c) => ({ competitor: c.slug }));
}

type Props = { params: Promise<{ competitor: string }> };

// `params` is a promise in Next 16 — see node_modules/next/dist/docs
// .../file-conventions/metadata/opengraph-image.md.
export default async function Image({ params }: Props) {
  const { competitor: slug } = await params;
  const entry = comparisonBySlug.get(slug);
  const competitor = entry?.competitor ?? "the alternatives";

  return renderOgImage({
    eyebrow: "Comparison",
    title: `VectorDrop vs ${competitor}`,
    highlight: competitor,
    seed: `vs-${slug}`,
  });
}
