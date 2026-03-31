"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { X } from "lucide-react";

type Page = "dashboard" | "editor" | "landing";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  page: Page;
}

const STARS = [1, 2, 3, 4, 5] as const;

export function FeedbackModal({ open, onClose, page }: FeedbackModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setRating(0);
        setHovered(0);
        setMessage("");
        setStatus("idle");
      }, 300);
    }
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, rating, message: message.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setTimeout(() => onClose(), 1800);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      aria-hidden={!open}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 16px 24px",
        background: open ? "rgba(0,0,0,0.4)" : "transparent",
        backdropFilter: open ? "blur(4px)" : "none",
        pointerEvents: open ? "auto" : "none",
        transition: "background 0.25s ease, backdrop-filter 0.25s ease",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Send feedback"
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          padding: "28px 28px 24px",
          transform: open ? "translateY(0)" : "translateY(110%)",
          opacity: open ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Share your feedback
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Help us make VectorDrop better
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-glass-strong)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "var(--accent-glow)", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 12px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Thank you!</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Your feedback means a lot.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Stars */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                How&apos;s your experience?
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {STARS.map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                      fontSize: 28,
                      lineHeight: 1,
                      transition: "transform 0.1s ease",
                      transform: hovered >= star || rating >= star ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    <span style={{
                      color: hovered >= star || rating >= star ? "#f59e0b" : "var(--border-default)",
                      filter: hovered >= star || rating >= star ? "drop-shadow(0 0 6px rgba(245,158,11,0.5))" : "none",
                      transition: "color 0.15s, filter 0.15s",
                      display: "block",
                    }}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="feedback-message" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                Anything to add? <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="What's working well? What could be better?"
                style={{
                  width: "100%",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
              />
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 10,
                  border: "1px solid var(--border-default)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rating === 0 || status === "loading"}
                style={{
                  flex: 2,
                  padding: "9px 0",
                  borderRadius: 10,
                  border: "none",
                  background: rating === 0 ? "var(--bg-glass-strong)" : "var(--accent)",
                  color: rating === 0 ? "var(--text-muted)" : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: rating === 0 ? "not-allowed" : "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {status === "loading" ? "Sending…" : "Send feedback"}
              </button>
            </div>

            {status === "error" && (
              <p style={{ marginTop: 10, fontSize: 12, color: "var(--destructive)", textAlign: "center" }}>
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
