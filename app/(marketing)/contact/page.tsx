import type { Metadata } from "next";
import { PseoShell, JsonLd } from "@/components/pseo/PseoShell";
import {
  LegalHeader,
  LegalSection,
  LegalP,
  LegalList,
  LegalRows,
  LegalLink,
  MailLink,
} from "@/components/pseo/Legal";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with VectorDrop. Email support@vectordrop.co.in for help with a conversion, a billing question, a bug report, or a data deletion request.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact VectorDrop",
  url: `${SITE_URL}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: "VectorDrop",
    url: SITE_URL,
    email: SUPPORT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      availableLanguage: "English",
    },
  },
};

export default function ContactPage() {
  return (
    <PseoShell>
      <JsonLd data={contactJsonLd} />

      <LegalHeader
        eyebrow="Contact"
        title="Talk to a human"
        updated="9 September 2026"
        lead="VectorDrop is a small operation, so there is no ticket maze — one address, read by a person. Whether something broke, a charge looks wrong, or you want your data deleted, this is where to send it."
      />

      <LegalSection n="01" title="Email us">
        <LegalP>
          <span style={{ fontSize: 20 }}>
            <MailLink email={SUPPORT_EMAIL} />
          </span>
        </LegalP>
        <LegalP>
          We aim to reply within two working days. Data deletion requests are actioned within 30
          days, and usually much sooner.
        </LegalP>
      </LegalSection>

      <LegalSection n="02" title="What to include">
        <LegalP>
          Two lines of detail will usually save a whole round trip. Where it applies, send:
        </LegalP>
        <LegalList
          items={[
            "The email address on your account, so we can find it.",
            "For a broken conversion — the project name, and the image you uploaded if you can share it.",
            "For a billing question — roughly when you paid, and what you expected to receive.",
            "For a bug — what you did, what happened, and what you expected instead.",
          ]}
        />
      </LegalSection>

      <LegalSection n="03" title="What we can help with">
        <LegalRows
          rows={[
            {
              label: "Something is broken",
              body: "A conversion that failed, an export that will not download, an editor that is misbehaving.",
            },
            {
              label: "Billing and credits",
              body: "A payment that did not land as credits, a double charge, or a purchase you did not recognise.",
            },
            {
              label: "Your data",
              body: (
                <>
                  Access, correction, export, or deletion of your account and files — see the{" "}
                  <LegalLink href="/privacy">Privacy Policy</LegalLink>.
                </>
              ),
            },
            {
              label: "Copyright",
              body: "If you believe content on VectorDrop infringes your rights, tell us what and where, and we will act on it.",
            },
            {
              label: "Feedback and requests",
              body: "Tell us what the editor is missing. There is also a feedback button inside the app if you would rather send it from where the problem is.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection n="04" title="Before you write">
        <LegalP>
          A few answers are already written down: <LegalLink href="/pricing">Pricing</LegalLink>{" "}
          covers what each action costs and why credits behave the way they do, and the{" "}
          <LegalLink href="/how-to">guides</LegalLink> cover getting a cleaner trace out of a
          difficult image.
        </LegalP>
      </LegalSection>
    </PseoShell>
  );
}
