import { formats, formatBySlug } from "@/lib/pseo/formats";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const alt = "VectorDrop format converter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return formats.map((f) => ({ slug: f.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const entry = formatBySlug.get(slug);
  const title = entry ? `${entry.from} to ${entry.to}` : "Image to SVG";

  return renderOgImage({
    eyebrow: "Free converter",
    title,
    highlight: entry?.to ?? "SVG",
    seed: `convert-${slug}`,
  });
}
