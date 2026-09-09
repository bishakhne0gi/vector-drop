import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PseoShell, JsonLd } from "@/components/pseo/PseoShell";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "VectorDrop is built by Bishakh Neogi, an independent developer. The man behind the vectoriser.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const FONT_MONO = "auxMono, monospace";

const NAME = "Bishakh Neogi";
const PHOTO = "/bishakh-neogi.png";
const LINKEDIN = "https://www.linkedin.com/in/bishakh-neogi-387815205/";
const X_PROFILE = "https://x.com/ne0gi02";

/**
 * Person markup, not just Organization.
 *
 * A one-person product reads as anonymous to search engines and to ad
 * reviewers unless a real human is named and linked. `sameAs` is what ties this
 * page to the profiles that already exist.
 */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: NAME,
  url: `${SITE_URL}/about`,
  image: `${SITE_URL}${PHOTO}`,
  email: SUPPORT_EMAIL,
  jobTitle: "Founder and Developer",
  sameAs: [LINKEDIN, X_PROFILE],
  worksFor: {
    "@type": "Organization",
    name: "VectorDrop",
    url: SITE_URL,
  },
};

const SOCIALS: { label: string; href: string; handle: string; icon: React.ReactNode }[] = [
  {
    label: "X",
    href: X_PROFILE,
    handle: "@ne0gi02",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: LINKEDIN,
    handle: "bishakh-neogi",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1 0-4.124 2.062 2.062 0 0 1 0 4.124zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: `mailto:${SUPPORT_EMAIL}`,
    handle: SUPPORT_EMAIL,
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <PseoShell>
      <JsonLd data={personJsonLd} />

      <div className="flex flex-col md:flex-row gap-10 md:gap-16 md:items-start">
        {/* Portrait */}
        <div className="shrink-0">
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              padding: 6,
              width: "fit-content",
            }}
          >
            <Image
              src={PHOTO}
              alt={`${NAME}, the developer behind VectorDrop`}
              width={800}
              height={800}
              priority
              sizes="(max-width: 768px) 240px, 280px"
              style={{
                display: "block",
                width: 280,
                maxWidth: "100%",
                height: "auto",
              }}
            />
          </div>
          <p
            className="mt-3"
            style={{
              fontFamily: FONT_MONO,
              fontSize: 9.5,
              color: "rgba(255,255,255,0.28)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            The man behind this
          </p>
        </div>

        {/* Text */}
        <div className="pt-1">
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            About
          </div>

          <h1 className="text-[2.2rem] md:text-[2.9rem] font-medium tracking-[-0.022em] leading-[1.08] m-0">
            {NAME}
          </h1>

          <p
            className="mt-4 text-[15px] md:text-[16px] leading-[1.7] max-w-[520px]"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            I build VectorDrop. It started because tracing an image into clean, editable
            vectors was either expensive, slow, or locked inside software I did not want to
            open just for one logo.
          </p>

          <p
            className="mt-4 text-[15px] md:text-[16px] leading-[1.7] max-w-[520px]"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            One person writes the code, answers the email, and fixes what breaks. If something
            here annoys you, tell me and it usually changes.
          </p>

          {/* Socials */}
          <div className="mt-9 flex flex-col gap-0" style={{ maxWidth: 380 }}>
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4 py-3.5 transition-colors"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.40)" }}>{social.icon}</span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)",
                    minWidth: 74,
                  }}
                >
                  {social.label}
                </span>
                <span className="text-[13.5px] group-hover:text-white transition-colors">
                  {social.handle}
                </span>
                <span
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "rgba(163,230,53,0.8)", fontSize: 13 }}
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center bg-white px-6 py-2 text-[11px] uppercase tracking-[0.04em] text-black no-underline hover:opacity-90"
              style={{ fontFamily: FONT_MONO }}
            >
              Try VectorDrop free →
            </Link>
          </div>
        </div>
      </div>
    </PseoShell>
  );
}
