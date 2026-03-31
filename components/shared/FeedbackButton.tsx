"use client";

import { useState, useEffect } from "react";
import { FeedbackModal } from "./FeedbackModal";

type Page = "dashboard" | "editor" | "landing";

interface FeedbackButtonProps {
  page: Page;
}

export function FeedbackButton({ page }: FeedbackButtonProps) {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling ~one viewport height (past first section)
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };

    // For editor/dashboard pages that may not scroll much, show after a short delay
    const timer = setTimeout(() => setVisible(true), 3000);

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="Give feedback"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 40,
          border: "1px solid var(--border-default)",
          background: "var(--bg-card)",
          color: "var(--text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          backdropFilter: "blur(12px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.3s ease, transform 0.3s ease, background 0.15s, color 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
          (e.currentTarget as HTMLButtonElement).style.color = "white";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-default)";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      <FeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        page={page}
      />
    </>
  );
}
