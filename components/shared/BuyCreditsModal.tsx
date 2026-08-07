"use client";

import { useState } from "react";

const FONT_MONO = "auxMono, monospace";
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface BuyCreditsModalProps {
  open: boolean;
  onClose: () => void;
  /** What the user was trying to do when they ran out, e.g. "convert this image". */
  blockedAction?: string;
}

/**
 * Shown when an action returns 402.
 *
 * The price line says "+ tax, billed in your local currency" deliberately:
 * Dodo adds tax on top and localises the currency, so an Indian customer sees
 * roughly ₹351 for a "$3" pack. A total that changes between this button and
 * the payment page is how cheap purchases get abandoned.
 */
export function BuyCreditsModal({ open, onClose, blockedAction }: BuyCreditsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Checkout failed (${res.status})`);
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buy credits"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: FONT_BODY,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.12)",
          padding: 28,
        }}
      >
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
          Out of credits
        </p>

        <h2 style={{ fontSize: 20, color: "#fff", margin: "10px 0 6px", fontWeight: 600 }}>
          20 credits for $3
        </h2>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 18px" }}>
          + tax, billed in your local currency
        </p>

        {blockedAction && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "0 0 18px" }}>
            You need credits to {blockedAction}.
          </p>
        )}

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 22px",
            fontSize: 13,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.9,
          }}
        >
          <li>20 image conversions</li>
          <li>0.1 credits per edited export</li>
          <li>Re-download anything you own, free</li>
          <li>Credits never expire</li>
        </ul>

        {error && (
          <p style={{ fontSize: 12, color: "#ff8b8b", margin: "0 0 14px" }} role="alert">
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleBuy}
            disabled={loading}
            style={{
              flex: 1,
              height: 38,
              background: loading ? "rgba(255,255,255,0.35)" : "#ffffff",
              color: "#161516",
              border: "none",
              fontSize: 10,
              fontFamily: FONT_MONO,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              borderRadius: 0,
            }}
          >
            {loading ? "Opening checkout…" : "Buy credits"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 38,
              padding: "0 16px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.55)",
              fontSize: 10,
              fontFamily: FONT_MONO,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              cursor: "pointer",
              borderRadius: 0,
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
