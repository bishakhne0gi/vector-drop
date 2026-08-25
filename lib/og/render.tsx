import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { contourFieldDataUri } from "./contours";

/**
 * Shared Open Graph image renderer.
 *
 * Every OG route on the site funnels through `renderOgImage` so the cards stay
 * one family. Colours and type are taken verbatim from `docs/DESIGN.md`; the
 * only thing that varies per page is the eyebrow, the headline, and the seed
 * that shapes the contour artwork.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

// docs/DESIGN.md — dark mode is the reference.
const BG = "#161516";
const TEXT = "#ffffff";
const ACCENT = "#14b8a6";
const ACCENT_LIGHT = "#2dd4bf";
const BORDER = "rgba(255,255,255,0.08)";

const FONT_DIR = join(process.cwd(), "lib/og/fonts");

/**
 * Satori cannot read woff2, which is what `next/font` serves to browsers, so
 * these TTFs are vendored alongside. Read once at module scope — OG routes are
 * prerendered at build time, so this happens during the build, not per request.
 */
const fonts = [
  { name: "Geist", data: readFileSync(join(FONT_DIR, "Geist-Regular.ttf")), weight: 400 as const, style: "normal" as const },
  { name: "Geist", data: readFileSync(join(FONT_DIR, "Geist-Medium.ttf")), weight: 500 as const, style: "normal" as const },
  { name: "Geist", data: readFileSync(join(FONT_DIR, "Geist-Bold.ttf")), weight: 700 as const, style: "normal" as const },
];

/**
 * Pick a headline size that keeps long titles inside three lines.
 *
 * Satori has no text-fitting primitive, so this is measured off character count
 * rather than rendered width — crude, but stable, and the breakpoints were
 * chosen against the longest real titles in `lib/pseo/`.
 */
function headlineSize(title: string): number {
  const n = title.length;
  if (n <= 24) return 82;
  if (n <= 34) return 72;
  if (n <= 46) return 62;
  if (n <= 62) return 54;
  return 46;
}

/**
 * Resolve which words render in accent teal.
 *
 * `highlight` is matched as a contiguous phrase against the title so callers can
 * pass natural language ("every layer") rather than word indices. A phrase that
 * is not found simply yields no highlight, which is a safe degradation.
 */
function highlightRange(title: string, highlight?: string): [number, number] | null {
  if (!highlight) return null;
  const at = title.toLowerCase().indexOf(highlight.toLowerCase());
  if (at < 0) return null;
  return [at, at + highlight.length];
}

export type OgImageOptions = {
  /** Small uppercase label above the headline, e.g. "Comparison" or "PNG → SVG". */
  eyebrow?: string;
  /** The headline. Keep it under ~62 characters for the best result. */
  title: string;
  /** A contiguous phrase within `title` to render in accent teal. */
  highlight?: string;
  /** Seeds the contour artwork — pass the page slug so each page differs. */
  seed?: string;
};

export function renderOgImage({ eyebrow, title, highlight, seed }: OgImageOptions) {
  const { width, height } = OG_SIZE;
  const contours = contourFieldDataUri({ seed: seed ?? title, width, height });
  const fontSize = headlineSize(title);
  const range = highlightRange(title, highlight);

  // Words are laid out individually so Satori can wrap them while still letting
  // a subset carry the accent colour — it has no inline-span text model.
  let cursor = 0;
  const words = title.split(" ").map((word) => {
    const start = cursor;
    cursor += word.length + 1;
    const accented = range !== null && start >= range[0] && start < range[1];
    return { word, accented };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: BG,
          fontFamily: "Geist",
          overflow: "hidden",
        }}
      >
        {/* Traced contours — the product's own output, used as the artwork. */}
        <img src={contours} width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }} />

        {/* Vignette so the headline always wins against the artwork behind it. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            // Satori ignores the `inset` shorthand — size this explicitly or it
            // collapses to nothing and the vignette silently disappears.
            top: 0,
            left: 0,
            width,
            height,
            backgroundImage: `radial-gradient(ellipse 58% 52% at 50% 48%, ${BG} 0%, rgba(22,21,22,0.97) 40%, rgba(22,21,22,0.55) 72%, rgba(22,21,22,0.10) 100%)`,
          }}
        />

        {/* Ruler ticks down both edges. */}
        {["left", "right"].map((side) => (
          <div
            key={side}
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              bottom: 0,
              [side]: 0,
              width: 13,
              backgroundImage: `linear-gradient(180deg, ${ACCENT} 2px, transparent 2px)`,
              backgroundSize: "100% 20px",
              opacity: 0.32,
            }}
          />
        ))}

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            padding: "0 96px",
            maxWidth: 1040,
          }}
        >
          {eyebrow ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 18px",
                marginBottom: 30,
                borderRadius: 999,
                border: `1px solid ${BORDER}`,
                background: "rgba(20,184,166,0.06)",
                color: ACCENT_LIGHT,
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              fontSize,
              fontWeight: 700,
              lineHeight: 1.08,
              // docs/DESIGN.md: headings run slightly tightened.
              letterSpacing: "-0.03em",
              textAlign: "center",
            }}
          >
            {words.map(({ word, accented }, i) => (
              <div
                key={`${word}-${i}`}
                style={{
                  display: "flex",
                  color: accented ? ACCENT : TEXT,
                  marginRight: fontSize * 0.26,
                }}
              >
                {word}
              </div>
            ))}
          </div>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "absolute",
            bottom: 44,
            left: 0,
            right: 0,
            justifyContent: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path
              d="M6 9.32256L8.08064 8.13363L10.1613 9.32256L10.018 21.5092L12.1924 22.6517L16.4032 20.3202V17.8433L18.5829 16.5553L18.3848 2.08986L20.5645 1L22.8433 2.08986V16.7534L20.7131 17.8433V20.3202L18.5829 21.4811V23.788L12.2419 27.5529L9.96313 26.1784L7.98156 24.9832L6 23.788V9.32256Z"
              fill={TEXT}
            />
          </svg>
          <div
            style={{
              display: "flex",
              color: TEXT,
              fontSize: 25,
              fontWeight: 700,
              letterSpacing: "0.16em",
            }}
          >
            VECTORDROP
          </div>
        </div>

      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
