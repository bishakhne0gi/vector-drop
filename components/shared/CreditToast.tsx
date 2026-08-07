"use client";

import { useEffect, useState } from "react";

const FONT_MONO = "auxMono, monospace";
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface CreditToastProps {
  /** Credits added, as a display string (e.g. "20"). */
  credits: string;
  onDismiss: () => void;
}

/**
 * Confirms credits landing on the account.
 *
 * Payment happens on Dodo's site and the grant arrives out of band, so without
 * this the user comes back to a page that looks unchanged and has to hunt for a
 * number to work out whether their money did anything.
 */
export function CreditToast({ credits, onDismiss }: CreditToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), 5000);
    const remove = setTimeout(onDismiss, 5400);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${leaving ? "12px" : "0"})`,
        opacity: leaving ? 0 : 1,
        transition: "opacity 0.35s ease, transform 0.35s ease",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        background: "#131313",
        border: "1px solid rgba(120,255,180,0.30)",
        borderRadius: 0,
        fontFamily: FONT_BODY,
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "rgba(120,255,180,0.9)",
          flexShrink: 0,
        }}
      />

      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.88)" }}>
        <strong style={{ fontWeight: 600 }}>{credits} credits</strong> added to your account
      </span>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.35)",
          fontFamily: FONT_MONO,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          cursor: "pointer",
          padding: 0,
          marginLeft: 4,
        }}
      >
        Close
      </button>
    </div>
  );
}
