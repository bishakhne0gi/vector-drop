import { useCases, useCaseBySlug } from "@/lib/pseo/use-cases";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const alt = "VectorDrop use case";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return useCases.map((u) => ({ slug: u.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const entry = useCaseBySlug.get(slug);

  return renderOgImage({
    eyebrow: "Use case",
    title: entry?.title ?? "Vectorise your artwork",
    // "SVG" carries the accent wherever it appears, across every card.
    highlight: "SVG",
    seed: `for-${slug}`,
  });
}
