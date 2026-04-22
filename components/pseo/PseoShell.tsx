import Link from "next/link";
import type { ReactNode } from "react";
import type { FaqItem } from "@/lib/pseo/types";
import { SiteLinks } from "./SiteLinks";

const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_MONO = "auxMono, monospace";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT_SEC = "rgba(255,255,255,0.60)";
const TEXT_MUT = "rgba(255,255,255,0.35)";

export function PseoShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "#161516", color: "#fff", fontFamily: FONT_BODY, minHeight: "100svh" }}>
      <style>{`
        @font-face {
          font-family: 'auxMono';
          src: url('/AuxMono-Regular.ttf') format('truetype');
          font-display: swap;
        }
      `}</style>
      <PseoNav />
      <main className="mx-auto max-w-[1040px] px-6 py-16 md:py-24">{children}</main>
      <PseoFooter />
    </div>
  );
}

function PseoNav() {
  return (
    <nav
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{ borderColor: BORDER, background: "rgba(22,21,22,0.82)" }}
    >
      <div className="mx-auto flex max-w-[1040px] items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-white no-underline">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path
              d="M6 9.32256L8.08064 8.13363L10.1613 9.32256L10.018 21.5092L12.1924 22.6517L16.4032 20.3202V17.8433L18.5829 16.5553L18.3848 2.08986L20.5645 1L22.8433 2.08986V16.7534L20.7131 17.8433V20.3202L18.5829 21.4811V23.788L12.2419 27.5529L9.96313 26.1784L7.98156 24.9832L6 23.788V9.32256Z"
              fill="white"
            />
          </svg>
          <span className="text-[13px] font-medium tracking-[-0.01em]">VectorDrop</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center bg-white px-4 py-2 text-[10px] uppercase tracking-[0.04em] text-black no-underline hover:opacity-90"
          style={{ fontFamily: FONT_MONO }}
        >
          Try free
        </Link>
      </div>
    </nav>
  );
}

function PseoFooter() {
  return (
    <footer>
      <SiteLinks />
      <div
        className="mx-auto flex max-w-[1280px] flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between"
        style={{ borderTop: `1px dashed rgba(255,255,255,0.07)` }}
      >
        <Link href="/" className="flex items-center gap-2 no-underline">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path
              d="M6 9.32256L8.08064 8.13363L10.1613 9.32256L10.018 21.5092L12.1924 22.6517L16.4032 20.3202V17.8433L18.5829 16.5553L18.3848 2.08986L20.5645 1L22.8433 2.08986V16.7534L20.7131 17.8433V20.3202L18.5829 21.4811V23.788L12.2419 27.5529L9.96313 26.1784L7.98156 24.9832L6 23.788V9.32256Z"
              fill="white"
            />
          </svg>
          <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
            VectorDrop
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: "rgba(255,255,255,0.18)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginLeft: 6,
            }}
          >
            · © 2026
          </span>
        </Link>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: TEXT_MUT,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Free image to svg converter
        </span>
      </div>
    </footer>
  );
}

export function PseoHero({
  eyebrow,
  title,
  tagline,
  lead,
}: {
  eyebrow: string;
  title: string;
  tagline: string;
  lead: string;
}) {
  return (
    <header className="mb-16">
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
      <h1 className="text-[2.4rem] md:text-[3.2rem] font-medium tracking-[-0.022em] leading-[1.07]">{title}</h1>
      <p className="mt-4 text-[15px] md:text-[17px] leading-[1.55]" style={{ color: TEXT_SEC }}>
        {tagline}
      </p>
      <p className="mt-6 max-w-[680px] text-[14px] md:text-[15px] leading-[1.7]" style={{ color: TEXT_SEC }}>
        {lead}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center bg-white px-6 py-2 text-[11px] uppercase tracking-[0.04em] text-black no-underline hover:opacity-90"
          style={{ fontFamily: FONT_MONO }}
        >
          Try the playground free →
        </Link>
      </div>
    </header>
  );
}

export function PseoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="text-[1.6rem] md:text-[1.9rem] font-medium tracking-[-0.018em] mb-5">{title}</h2>
      <div className="text-[14px] md:text-[15px] leading-[1.75]" style={{ color: TEXT_SEC }}>
        {children}
      </div>
    </section>
  );
}

export function PseoBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 list-none p-0">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span style={{ color: "rgba(163,230,53,0.7)", fontFamily: FONT_MONO, fontSize: 12 }}>▸</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PseoNumberedSteps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="list-none p-0 space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-5">
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: TEXT_MUT,
              letterSpacing: "0.08em",
              minWidth: 26,
              paddingTop: 2,
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <div className="text-white font-medium mb-1 text-[15px]">{step.title}</div>
            <p className="m-0">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PseoFaq({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.q}
          style={{
            border: `1px solid ${BORDER}`,
            padding: "16px 18px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="text-white font-medium text-[15px] mb-2">{item.q}</div>
          <p className="m-0">{item.a}</p>
        </div>
      ))}
    </div>
  );
}

export function PseoCta({
  heading = "Ready to vectorise your image?",
  body = "Upload a PNG, JPG, or WebP in the VectorDrop playground and get a clean SVG in seconds. Free, no signup, no watermark.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <section
      className="mt-20 text-center p-10 md:p-14"
      style={{ border: `1px dashed rgba(255,255,255,0.18)`, background: "rgba(255,255,255,0.02)" }}
    >
      <h2 className="text-[1.8rem] md:text-[2.2rem] font-medium tracking-[-0.02em] mb-3">{heading}</h2>
      <p className="max-w-[560px] mx-auto text-[14px] md:text-[15px] leading-[1.7] mb-7" style={{ color: TEXT_SEC }}>
        {body}
      </p>
      <Link
        href="/"
        className="inline-flex items-center bg-white px-7 py-2 text-[11px] uppercase tracking-[0.04em] text-black no-underline hover:opacity-90"
        style={{ fontFamily: FONT_MONO }}
      >
        Open the playground →
      </Link>
    </section>
  );
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
