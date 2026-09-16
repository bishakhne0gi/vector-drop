"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PACK_CREDITS } from "@/lib/credits/constants";

const FONT_MONO = "auxMono, monospace";

/**
 * The public entry point for buying credits.
 *
 * Deliberately does NOT branch on a client-side auth hook. The server decides
 * whether the caller is signed in — /api/payments/checkout returns 401 — and a
 * client hook that disagrees just produces a button that lies about its own
 * behaviour. A 401 sends the user to sign in and back.
 */
export function BuyCreditsButton({
  label = `Buy ${PACK_CREDITS} credits`,
}: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", { method: "POST" });

      if (res.status === 401) {
        router.push("/login?redirect_url=/pricing");
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
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
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 40,
          padding: "0 22px",
          background: loading ? "rgba(255,255,255,0.4)" : "#fff",
          color: "#161516",
          border: "none",
          fontSize: 11,
          fontFamily: FONT_MONO,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontWeight: 700,
          cursor: loading ? "wait" : "pointer",
          borderRadius: 0,
        }}
      >
        {loading ? "Opening checkout…" : label}
      </button>

      {error && (
        <p style={{ fontSize: 12, color: "#ff8b8b", margin: "10px 0 0" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
