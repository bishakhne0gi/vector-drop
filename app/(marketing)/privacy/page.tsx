import type { Metadata } from "next";
import { PseoShell } from "@/components/pseo/PseoShell";
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
  title: "Privacy Policy",
  description:
    "How VectorDrop handles your account details, uploaded images, payment records and advertising cookies — what is collected, who processes it, how long it is kept, and how to have it deleted.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const UPDATED = "9 September 2026";

export default function PrivacyPage() {
  return (
    <PseoShell>
      <LegalHeader
        eyebrow="Legal"
        title="Privacy Policy"
        updated={UPDATED}
        lead="VectorDrop converts images into vectors. That means you hand us files, and files deserve a straight answer about what happens to them. This page says what we collect, who else touches it, how long we keep it, and how to make us delete it."
      />

      <LegalSection n="01" title="Who we are">
        <LegalP>
          VectorDrop (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the website at{" "}
          <LegalLink href="/">www.vectordrop.co.in</LegalLink> and the image-to-vector
          conversion service available there. For any question about this policy, or to
          exercise any right described in it, write to <MailLink email={SUPPORT_EMAIL} />.
        </LegalP>
      </LegalSection>

      <LegalSection n="02" title="What we collect">
        <LegalP>
          We collect only what the product needs to function, plus the minimum required to
          bill correctly and keep the service standing up.
        </LegalP>
        <LegalRows
          rows={[
            {
              label: "Account details",
              body: "Your email address, and your display name and profile image where your sign-in provider supplies them. Authentication is handled by Clerk; we never receive or store your password.",
            },
            {
              label: "Images you upload",
              body: "The PNG, JPG or WebP files you submit for conversion, stored in a private bucket that is not publicly listable and not indexed.",
            },
            {
              label: "Vectors we produce",
              body: "The SVG output of each conversion, plus every version you save while editing, so that version history and re-downloads work.",
            },
            {
              label: "Project metadata",
              body: "Project names, file names, file sizes, MIME types, conversion status and timestamps.",
            },
            {
              label: "Credit and payment records",
              body: "Your credit balance, the ledger of credits granted and spent, and a record of each purchase. Card and banking details are handled entirely by our payment processor — they never reach our servers.",
            },
            {
              label: "AI feature usage",
              body: "When you use an AI feature (image analysis, restyling, icon generation) we record that it ran, so we can meter usage and control abuse.",
            },
            {
              label: "Feedback you send",
              body: "The message text and the page you sent it from, when you use the in-app feedback button.",
            },
            {
              label: "Product analytics",
              body: "Pages viewed and actions taken in the app, collected via PostHog to understand which features are used.",
            },
            {
              label: "Technical logs",
              body: "IP-derived rate-limit counters and server error logs, kept briefly to stop abuse and to diagnose failures.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection n="03" title="Cookies and advertising">
        <LegalP>
          We use cookies and similar storage for three purposes: keeping you signed in,
          remembering interface preferences, and serving ads on our public marketing pages.
        </LegalP>
        <LegalList
          items={[
            "Essential cookies — set by Clerk to maintain your signed-in session. The service cannot work without these.",
            "Preference storage — small values kept in your own browser (such as your theme choice). These never leave your device.",
            "Analytics cookies — set by PostHog to measure feature usage in aggregate.",
            "Advertising cookies — set by Google and its partners on our marketing pages.",
          ]}
        />
        <LegalP>
          Google, as a third-party vendor, uses cookies to serve ads on this site. Google&rsquo;s
          use of advertising cookies enables it and its partners to serve ads based on your
          visit to this and other sites. Ads are shown only on our public marketing pages —
          the signed-in application, including your dashboard and the editor, carries no ad
          code.
        </LegalP>
        <LegalP>
          You can opt out of personalised advertising through{" "}
          <LegalLink href="https://www.google.com/settings/ads">
            Google&rsquo;s Ads Settings
          </LegalLink>
          , or opt out of third-party vendor cookies at{" "}
          <LegalLink href="https://www.aboutads.info/choices/">
            www.aboutads.info/choices
          </LegalLink>
          . You can also block or delete cookies in your browser settings, though doing so for
          essential cookies will sign you out.
        </LegalP>
      </LegalSection>

      <LegalSection n="04" title="How we use what we collect">
        <LegalList
          items={[
            "To run the conversion itself — reading your uploaded image and producing the vector.",
            "To show you your projects, version history and previous exports.",
            "To meter credits, process purchases and prevent double-charging.",
            "To enforce rate limits and prevent abuse of the service.",
            "To answer your support messages and act on your feedback.",
            "To understand, in aggregate, which features are worth keeping.",
            "To meet legal and accounting obligations relating to payments.",
          ]}
        />
        <LegalP>
          We do not sell your personal information. We do not use the images you upload to
          train any machine-learning model of our own, and we do not publish, share or reuse
          your artwork.
        </LegalP>
      </LegalSection>

      <LegalSection n="05" title="Who else processes your data">
        <LegalP>
          We rely on the following providers. Each receives only what it needs to perform its
          function, and each is bound by its own privacy terms.
        </LegalP>
        <LegalRows
          rows={[
            { label: "Clerk", body: "Authentication and session management — account identity." },
            { label: "Supabase", body: "Database hosting — project, credit and account records." },
            { label: "Cloudflare R2", body: "Object storage — your uploaded images and generated SVGs." },
            { label: "Dodo Payments", body: "Payment processing — purchases, and the card details we never see." },
            { label: "Anthropic", body: "AI features — image content sent only when you invoke an AI action." },
            { label: "Google AdSense", body: "Advertising on public marketing pages." },
            { label: "PostHog", body: "Product analytics." },
            { label: "Upstash", body: "Rate limiting." },
            { label: "Vercel", body: "Application hosting and delivery." },
          ]}
        />
      </LegalSection>

      <LegalSection n="06" title="How long we keep it">
        <LegalP>
          Your projects, images and versions stay until you delete them or ask us to close your
          account. Delete a project and its stored files go with it. Purchase and credit-ledger
          records are retained for as long as accounting and tax rules require, even after an
          account is closed, because they are financial records rather than product data.
          Rate-limit counters expire within minutes. Server error logs are short-lived.
        </LegalP>
      </LegalSection>

      <LegalSection n="07" title="Your rights">
        <LegalP>
          You can ask us to show you the personal data we hold about you, correct it, export it,
          or delete it and close your account. Email <MailLink email={SUPPORT_EMAIL} /> from the
          address on the account and we will action it. We aim to respond within 30 days.
        </LegalP>
        <LegalP>
          Depending on where you live you may also have the right to object to certain
          processing, or to complain to your local data-protection authority.
        </LegalP>
      </LegalSection>

      <LegalSection n="08" title="Security">
        <LegalP>
          Uploaded images and generated vectors are held in a private bucket and served only
          through short-lived signed links tied to your account. Traffic is encrypted in
          transit. No system is perfectly secure, so we do not claim otherwise — but we do not
          make your files publicly reachable, and we do not expose one account&rsquo;s work to
          another.
        </LegalP>
      </LegalSection>

      <LegalSection n="09" title="Children">
        <LegalP>
          VectorDrop is not directed at children under 13, and we do not knowingly collect their
          personal information. If you believe a child has given us data, write to{" "}
          <MailLink email={SUPPORT_EMAIL} /> and we will remove it.
        </LegalP>
      </LegalSection>

      <LegalSection n="10" title="Changes to this policy">
        <LegalP>
          If we change how we handle your data, we will update this page and move the date at
          the top. Material changes will be announced in the app before they take effect.
        </LegalP>
      </LegalSection>

      <LegalSection n="11" title="Contact">
        <LegalP>
          Questions, deletion requests, or anything else about this policy:{" "}
          <MailLink email={SUPPORT_EMAIL} />. See also our{" "}
          <LegalLink href="/terms">Terms of Service</LegalLink> and{" "}
          <LegalLink href="/contact">contact page</LegalLink>.
        </LegalP>
      </LegalSection>
    </PseoShell>
  );
}
