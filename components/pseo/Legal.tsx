import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared presentation for the legal surfaces — privacy, terms, contact.
 *
 * These pages are read by two audiences with opposite needs: a person looking
 * for one specific answer (how do I delete my data, who do I email), and a
 * policy reviewer checking that the required disclosures exist at all. Both are
 * served by short labelled sections rather than continuous prose, so the
 * primitives here bias towards headings, definition rows and lists.
 */

const FONT_MONO = "auxMono, monospace";
const TEXT_SEC = "rgba(255,255,255,0.60)";
const TEXT_MUT = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";

export function LegalHeader({
  eyebrow,
  title,
  updated,
  lead,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  lead: string;
}) {
  return (
    <header className="mb-14">
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: TEXT_MUT,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        {eyebrow}
      </div>
      <h1 className="text-[2.2rem] md:text-[2.9rem] font-medium tracking-[-0.022em] leading-[1.08]">
        {title}
      </h1>
      <p
        className="mt-5 max-w-[680px] text-[14px] md:text-[15px] leading-[1.7]"
        style={{ color: TEXT_SEC }}
      >
        {lead}
      </p>
      <p
        className="mt-6"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: TEXT_MUT,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Last updated · {updated}
      </p>
    </header>
  );
}

export function LegalSection({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex gap-4 mb-4">
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: TEXT_MUT,
            letterSpacing: "0.08em",
            paddingTop: 6,
            minWidth: 26,
          }}
        >
          {n}
        </span>
        <h2 className="text-[1.35rem] md:text-[1.55rem] font-medium tracking-[-0.018em] m-0">
          {title}
        </h2>
      </div>
      <div
        className="text-[14px] md:text-[15px] leading-[1.75] md:pl-[42px]"
        style={{ color: TEXT_SEC }}
      >
        {children}
      </div>
    </section>
  );
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p className="m-0 mb-4 last:mb-0">{children}</p>;
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 list-none p-0 my-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span style={{ color: "rgba(163,230,53,0.7)", fontFamily: FONT_MONO, fontSize: 12 }}>
            ▸
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Label/value rows — used for the subprocessor list and the retention table,
 * where "who gets what, and why" is the whole point and prose would bury it.
 */
export function LegalRows({ rows }: { rows: { label: string; body: ReactNode }[] }) {
  return (
    <div className="my-5" style={{ borderTop: `1px solid ${BORDER}` }}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col md:flex-row gap-1 md:gap-6 py-3"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div
            className="md:min-w-[190px] md:max-w-[190px] text-white"
            style={{ fontSize: 13.5, fontWeight: 500 }}
          >
            {row.label}
          </div>
          <div style={{ fontSize: 14 }}>{row.body}</div>
        </div>
      ))}
    </div>
  );
}

export function MailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="hover:opacity-80"
      style={{ color: "#a3e635", textDecoration: "none", borderBottom: "1px dashed rgba(163,230,53,0.4)" }}
    >
      {email}
    </a>
  );
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = href.startsWith("http");
  const style = {
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
    borderBottom: "1px dashed rgba(255,255,255,0.25)",
  } as const;

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  );
}
