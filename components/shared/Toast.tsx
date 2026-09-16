"use client";

import { useEffect, useState, type ReactNode } from "react";

const FONT_MONO = "auxMono, monospace";
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export type ToastTone = "success" | "error";

/**
 * Tone palettes use explicit dark values rather than theme variables, matching
 * the convention DropZone and ConversionProgress already follow: several of the
 * --bg-* tokens resolve LIGHT, which would paint a white panel into a black app.
 */
const TONE = {
  success: { accent: "rgba(120,255,180,0.9)", border: "rgba(120,255,180,0.30)" },
  error: { accent: "rgba(248,113,113,0.95)", border: "rgba(248,113,113,0.40)" },
} as const satisfies Record<ToastTone, { accent: string; border: string }>;

interface ToastProps {
  tone?: ToastTone;
  children: ReactNode;
  onDismiss: () => void;
  /** Auto-dismiss delay. Pass null to require a manual dismiss. */
  durationMs?: number | null;
}

/**
 * Transient confirmation or failure notice, pinned bottom-centre.
 *
 * One implementation for every toast in the app: two copies of a floating
 * panel drift apart the moment either is touched, and a failure that does not
 * look like the app's other notices reads as a browser error rather than
 * something VectorDrop is telling the user.
 *
 * Errors are announced assertively and given longer on screen than a success —
 * a confirmation missed costs nothing, an unread failure costs a retry.
 */
export function Toast({
  tone = "success",
  children,
  onDismiss,
  durationMs = 5000,
}: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (durationMs === null) return;
    const hide = setTimeout(() => setLeaving(true), durationMs);
    const remove = setTimeout(onDismiss, durationMs + 400);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [durationMs, onDismiss]);

  const palette = TONE[tone];
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
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
        border: `1px solid ${palette.border}`,
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
          background: palette.accent,
          flexShrink: 0,
        }}
      />

      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.88)", minWidth: 0 }}>
        {children}
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
          flexShrink: 0,
        }}
      >
        Close
      </button>
    </div>
  );
}
