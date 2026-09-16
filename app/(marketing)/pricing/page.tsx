import type { Metadata } from "next";
import { PseoShell } from "@/components/pseo/PseoShell";
import { BuyCreditsButton } from "@/components/shared/BuyCreditsButton";
import { SITE_URL } from "@/lib/seo/site";
import {
  SIGNUP_GRANT_UNITS,
  PACK_PRICE_USD,
  PURCHASE_GRANT_UNITS,
  UNITS_PER_CREDIT,
  formatCredits,
} from "@/lib/credits/constants";

export const metadata: Metadata = {
  title: "Pricing — VectorDrop",
  description:
    "Convert images to SVG for $4. Twenty credits, no subscription, credits never expire. Start with one free credit — enough for a complete project.",
  alternates: { canonical: `${SITE_URL}/pricing` },
};

const FONT_MONO = "auxMono, monospace";

const COSTS: Array<{ action: string; cost: string }> = [
  { action: "Convert an image to vector", cost: "1 credit" },
  { action: "Export the converted result", cost: "Free" },
  { action: "Export a version you edited", cost: "0.1 credits" },
  { action: "Re-download anything you already exported", cost: "Free" },
  { action: "Save, undo, switch or restore versions", cost: "Free" },
  { action: "Preview and edit in the canvas", cost: "Free" },
];

export default function PricingPage() {
  const freeCredits = formatCredits(SIGNUP_GRANT_UNITS);
  const packCredits = PURCHASE_GRANT_UNITS / UNITS_PER_CREDIT;

  return (
    <PseoShell>
      <p
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: "rgba(255,255,255,0.40)",
          margin: 0,
        }}
      >
        Pricing
      </p>

      <h1 style={{ fontSize: 40, fontWeight: 600, margin: "14px 0 12px", lineHeight: 1.15 }}>
        Pay for what you convert.
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.60)",
          margin: "0 0 48px",
          lineHeight: 1.6,
          maxWidth: 620,
        }}
      >
        No subscription. No monthly minimum. Buy credits once and use them whenever — they
        never expire.
      </p>

      <section
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          padding: 32,
          marginBottom: 24,
          maxWidth: 620,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {PACK_PRICE_USD}
          </span>
          <span style={{ fontSize: 15, color: "rgba(255,255,255,0.55)" }}>
            for {packCredits} credits
          </span>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", margin: "8px 0 22px" }}>
          + tax, billed in your local currency
        </p>

        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.70)",
            margin: "0 0 24px",
            lineHeight: 1.7,
          }}
        >
          That is {packCredits} image conversions, and roughly 200 edited exports on top.
        </p>

        <BuyCreditsButton label={`Buy ${packCredits} credits`} />
      </section>

      <section
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          padding: 32,
          marginBottom: 48,
          background: "rgba(255,255,255,0.02)",
          maxWidth: 620,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
          {freeCredits} free credit when you sign up
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.60)", margin: 0, lineHeight: 1.7 }}>
          Enough for one complete project — convert an image, edit it, and export the result
          without paying anything. We would rather you finish something real than hit a wall
          halfway.
        </p>
      </section>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 20px" }}>What costs what</h2>

      <table style={{ width: "100%", maxWidth: 620, borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>
          {COSTS.map((row) => (
            <tr key={row.action} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <td style={{ padding: "14px 0", color: "rgba(255,255,255,0.75)" }}>{row.action}</td>
              <td
                style={{
                  padding: "14px 0",
                  textAlign: "right",
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: row.cost === "Free" ? "rgba(120,255,180,0.85)" : "rgba(255,255,255,0.60)",
                  whiteSpace: "nowrap",
                }}
              >
                {row.cost}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "48px 0 20px" }}>Questions</h2>

      <dl style={{ margin: 0, fontSize: 14, lineHeight: 1.7, maxWidth: 620 }}>
        <dt style={{ fontWeight: 600, marginTop: 20 }}>How do I add credits?</dt>
        <dd style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.60)" }}>
          Use the button above, or the prompt that appears in the editor when you run out.
          Checkout is handled by Dodo Payments; credits land on your account as soon as the
          payment clears.
        </dd>

        <dt style={{ fontWeight: 600, marginTop: 20 }}>Do credits expire?</dt>
        <dd style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.60)" }}>
          No. Buy once, use them whenever.
        </dd>

        <dt style={{ fontWeight: 600, marginTop: 20 }}>
          Do I pay again to re-download something?
        </dt>
        <dd style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.60)" }}>
          Never. Once you have exported a version, it is yours — any format, as many times as
          you like.
        </dd>

        <dt style={{ fontWeight: 600, marginTop: 20 }}>What if a conversion comes out badly?</dt>
        <dd style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.60)" }}>
          Re-converting the same project is free. You are charged once per project, so
          adjusting settings and trying again costs nothing.
        </dd>

        <dt style={{ fontWeight: 600, marginTop: 20 }}>
          Why is my total higher than {PACK_PRICE_USD}?
        </dt>
        <dd style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.60)" }}>
          Tax is added at checkout and varies by country, and you are billed in your local
          currency.
        </dd>
      </dl>
    </PseoShell>
  );
}
