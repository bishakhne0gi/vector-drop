import Link from "next/link";

const FONT_MONO = "auxMono, monospace";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT_SEC = "rgba(255,255,255,0.60)";

export type HubItem = {
  href: string;
  title: string;
  blurb: string;
};

/**
 * Card grid used by the cluster hub pages (/convert, /vs, /how-to, /for).
 * Each hub is the crawl entry point for its cluster and the internal-link
 * target that passes authority down to the leaf pages.
 */
export function PseoHubGrid({ items }: { items: HubItem[] }) {
  return (
    <ul className="grid list-none grid-cols-1 gap-px p-0 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group block h-full p-6 no-underline transition-colors"
            style={{ border: `1px solid ${BORDER}`, color: "#fff" }}
          >
            <span className="block text-[15px] font-medium leading-snug tracking-[-0.01em] group-hover:underline">
              {item.title}
            </span>
            <span
              className="mt-2 block text-[13px] leading-relaxed"
              style={{ color: TEXT_SEC }}
            >
              {item.blurb}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PseoHubHero({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <header className="mb-12">
      <div
        className="mb-4"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>
      <h1 className="m-0 text-[34px] font-medium leading-[1.1] tracking-[-0.02em] md:text-[46px]">
        {title}
      </h1>
      <p
        className="mt-5 max-w-[62ch] text-[15px] leading-relaxed"
        style={{ color: TEXT_SEC }}
      >
        {lead}
      </p>
    </header>
  );
}
