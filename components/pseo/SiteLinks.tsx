import Link from "next/link";
import { LegoStud } from "@/components/shared/LegoStud";
import { comparisons } from "@/lib/pseo/comparisons";
import { formats } from "@/lib/pseo/formats";
import { useCases } from "@/lib/pseo/use-cases";
import { howTos } from "@/lib/pseo/how-tos";

const FONT_MONO = "auxMono, monospace";

const COLS = [
  {
    label: "Convert",
    href: "/convert",
    color: "#f97316",
    items: formats.map((f) => ({
      href: `/convert/${f.slug}`,
      label: `${f.from} to ${f.to}`,
    })),
  },
  {
    label: "Compare",
    href: "/vs",
    color: "#a855f7",
    items: comparisons.map((c) => ({
      href: `/vs/${c.slug}`,
      label: `vs ${c.competitor}`,
    })),
  },
  {
    label: "Guides",
    href: "/how-to",
    color: "#a3e635",
    items: howTos.map((h) => ({
      href: `/how-to/${h.slug}`,
      label: h.title.replace(/^How to /, ""),
    })),
  },
  {
    label: "For",
    href: "/for",
    color: "#22d3ee",
    items: useCases.map((u) => ({
      href: `/for/${u.slug}`,
      label: u.title.replace(/^(Vectorise|Convert|Make) /, ""),
    })),
  },
];

export function SiteLinks() {
  return (
    <div
      className="relative mx-auto max-w-[1280px] px-6 py-14"
      style={{ borderTop: "1px dashed rgba(255,255,255,0.07)" }}
    >
      {/* Rail corner studs — match landing page's rail pattern */}
      <div className="hidden xl:block absolute left-[80px] top-0 -translate-y-1/2">
        <LegoStud color="rgba(255,255,255,0.35)" size={10} />
      </div>
      <div className="hidden xl:block absolute right-[80px] top-0 -translate-y-1/2">
        <LegoStud color="rgba(255,255,255,0.35)" size={10} />
      </div>

      {/* Eyebrow label */}
      <div
        className="mb-10"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: "rgba(255,255,255,0.28)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        Explore VectorDrop
      </div>

      {/* 4-column link grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
        {COLS.map((col) => (
          <div key={col.label}>
            <div className="flex items-center gap-2 mb-5">
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: col.color,
                  display: "inline-block",
                }}
              />
              <Link
                href={col.href}
                className="no-underline hover:underline"
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  color: col.color,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                {col.label}
              </Link>
            </div>
            <ul className="space-y-3 list-none p-0 m-0">
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[12.5px] leading-snug transition-colors hover:text-white"
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
