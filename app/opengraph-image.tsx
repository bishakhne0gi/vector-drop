import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const alt = "VectorDrop — turn any image into clean, editable SVG";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Free vectoriser",
    title: "Turn any image into clean, editable SVG",
    highlight: "clean, editable SVG",
    seed: "vectordrop-home",
  });
}
