import { howTos, howToBySlug } from "@/lib/pseo/how-tos";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const alt = "VectorDrop guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return howTos.map((h) => ({ slug: h.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const entry = howToBySlug.get(slug);

  return renderOgImage({
    eyebrow: "Guide",
    title: entry?.title ?? "How to vectorise an image",
    highlight: "SVG",
    seed: `how-to-${slug}`,
  });
}
