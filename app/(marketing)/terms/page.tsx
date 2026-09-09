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
import {
  SIGNUP_GRANT_UNITS,
  PURCHASE_GRANT_UNITS,
  UNITS_PER_CREDIT,
  PACK_PRICE_CENTS,
  formatCredits,
} from "@/lib/credits/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms you agree to when using VectorDrop: accounts, credits and payment, ownership of your uploads and vectors, acceptable use, and limits of liability.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

const UPDATED = "9 September 2026";

export default function TermsPage() {
  // Read from the same constants the pricing page and the billing code use, so
  // the terms cannot promise a price or a grant the product does not honour.
  const freeCredits = formatCredits(SIGNUP_GRANT_UNITS);
  const packCredits = PURCHASE_GRANT_UNITS / UNITS_PER_CREDIT;
  const packPrice = `$${(PACK_PRICE_CENTS / 100).toFixed(0)}`;

  return (
    <PseoShell>
      <LegalHeader
        eyebrow="Legal"
        title="Terms of Service"
        updated={UPDATED}
        lead="These terms cover your use of VectorDrop. They are written to be read rather than skipped — the parts that actually matter are who owns your artwork (you), how credits work, and what we do not promise."
      />

      <LegalSection n="01" title="Agreement">
        <LegalP>
          By using <LegalLink href="/">www.vectordrop.co.in</LegalLink> or creating an account,
          you agree to these terms. If you do not agree, do not use the service. If you are using
          VectorDrop on behalf of an organisation, you confirm you may bind that organisation.
        </LegalP>
      </LegalSection>

      <LegalSection n="02" title="The service">
        <LegalP>
          VectorDrop converts raster images (PNG, JPG, WebP) into vector SVG files, and provides
          an editor for adjusting the result, a version history, and export in SVG and PNG. Some
          features are powered by third-party AI models. We may add, change or withdraw features
          over time.
        </LegalP>
      </LegalSection>

      <LegalSection n="03" title="Accounts">
        <LegalP>
          You need an account to convert images. You are responsible for activity under your
          account and for keeping access to your sign-in method secure. Provide accurate details,
          and do not share an account with someone who has not agreed to these terms. One person
          or organisation per account — creating multiple accounts to collect repeated free
          credit grants is a breach of these terms.
        </LegalP>
      </LegalSection>

      <LegalSection n="04" title="Credits and payment">
        <LegalP>
          VectorDrop runs on credits rather than a subscription. New accounts receive{" "}
          {freeCredits} free credits. Additional credits are sold in a pack of {packCredits}{" "}
          credits for {packPrice}. Purchased credits do not expire.
        </LegalP>
        <LegalRows
          rows={[
            { label: "Converting an image", body: "1 credit" },
            { label: "Exporting the converted result", body: "Free — included with the conversion" },
            { label: "Exporting a version you edited", body: "0.1 credits, charged once per version" },
            { label: "Re-downloading a previous export", body: "Free" },
            { label: "Saving, editing, undo, version switching", body: "Free" },
          ]}
        />
        <LegalP>
          Payments are processed by Dodo Payments. Prices are in US dollars and exclude any tax
          that may apply in your jurisdiction. A credit is spent only once a deliverable actually
          exists — if a conversion or an export fails on our side, you are not charged for it.
        </LegalP>
        <LegalP>
          Because credits are delivered immediately and consumed on use, purchases are generally
          final. If you were charged in error, charged twice, or credits did not arrive after a
          successful payment, email <MailLink email={SUPPORT_EMAIL} /> and we will put it right.
        </LegalP>
      </LegalSection>

      <LegalSection n="05" title="Your content and who owns it">
        <LegalP>
          <strong style={{ color: "#fff", fontWeight: 500 }}>You own what you upload.</strong> You
          also own the vectors VectorDrop produces from it. We claim no rights over your artwork
          and do not use it to train models, publish it, or reuse it for any purpose of our own.
        </LegalP>
        <LegalP>
          You grant us only the narrow licence needed to run the service for you: to store,
          process, convert and display your files back to you, and to pass an image to our AI
          provider at the moment you invoke an AI feature. That licence ends when you delete the
          content.
        </LegalP>
        <LegalP>
          You are responsible for having the right to upload what you upload. Do not convert
          images you do not own or have permission to use.
        </LegalP>
      </LegalSection>

      <LegalSection n="06" title="Acceptable use">
        <LegalP>You agree not to:</LegalP>
        <LegalList
          items={[
            "Upload content that is illegal, or that infringes someone else's copyright or trademark.",
            "Upload sexual content involving minors, or content that promotes violence or hatred against a group.",
            "Attempt to break, overload, scrape or reverse-engineer the service, or to circumvent credit metering or rate limits.",
            "Resell or redistribute access to VectorDrop as your own service.",
            "Use the service to build a competing product from our outputs at scale.",
          ]}
        />
        <LegalP>
          We may suspend or remove content and accounts that breach this section, and where the
          law requires it, report the content.
        </LegalP>
      </LegalSection>

      <LegalSection n="07" title="AI features">
        <LegalP>
          Features described as AI-powered send your image or its description to a third-party
          model provider for processing. Their output is generated automatically and is not
          reviewed by us. It may be imperfect or unsuitable for your purpose, and you should
          check any AI-assisted result before relying on it commercially.
        </LegalP>
      </LegalSection>

      <LegalSection n="08" title="Availability and warranties">
        <LegalP>
          VectorDrop is provided &ldquo;as is&rdquo;. We do not guarantee that the service will be
          uninterrupted, that a conversion will meet a particular expectation of quality, or that
          stored files will never be lost. Keep your own copies of anything you cannot afford to
          lose. To the extent permitted by law, we disclaim implied warranties of
          merchantability and fitness for a particular purpose.
        </LegalP>
      </LegalSection>

      <LegalSection n="09" title="Limitation of liability">
        <LegalP>
          To the maximum extent permitted by law, we are not liable for indirect, incidental or
          consequential losses, including lost profits, lost business or lost data. Our total
          liability for any claim relating to the service is limited to the amount you paid us in
          the three months before the claim arose.
        </LegalP>
      </LegalSection>

      <LegalSection n="10" title="Termination">
        <LegalP>
          You may stop using VectorDrop and request account deletion at any time by emailing{" "}
          <MailLink email={SUPPORT_EMAIL} />. We may suspend or terminate an account that
          breaches these terms. Unused credits are not refundable on termination for breach.
        </LegalP>
      </LegalSection>

      <LegalSection n="11" title="Changes">
        <LegalP>
          We may update these terms. The date at the top will change, and material changes will
          be announced in the app before they take effect. Continuing to use the service after a
          change means you accept the updated terms.
        </LegalP>
      </LegalSection>

      <LegalSection n="12" title="Governing law">
        <LegalP>
          These terms are governed by the laws of India, and the courts of India have exclusive
          jurisdiction over any dispute arising from them.
        </LegalP>
      </LegalSection>

      <LegalSection n="13" title="Contact">
        <LegalP>
          Questions about these terms: <MailLink email={SUPPORT_EMAIL} />. See also our{" "}
          <LegalLink href="/privacy">Privacy Policy</LegalLink> and{" "}
          <LegalLink href="/contact">contact page</LegalLink>.
        </LegalP>
      </LegalSection>
    </PseoShell>
  );
}
