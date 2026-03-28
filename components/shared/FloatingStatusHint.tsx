"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const MESSAGES: Record<string, string[]> = {
  uploading: [
    "Reading your image...",
    "Scanning pixel data...",
    "Preparing for conversion...",
    "Measuring colour depth...",
  ],
  converting: [
    "Quantizing colour clusters...",
    "Tracing bezier curves...",
    "Drawing vector paths...",
    "Separating colour masks...",
    "Running Potrace engine...",
    "Smoothing path nodes...",
    "Assembling SVG layers...",
    "Optimising anchor points...",
    "Almost there...",
  ],
  done: [
    "SVG ready. Opening editor...",
  ],
};

type Phase = "uploading" | "converting" | "done";

interface FloatingStatusHintProps {
  phase: Phase | null;
}

export function FloatingStatusHint({ phase }: FloatingStatusHintProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // Cycle messages every 2.8s
  useEffect(() => {
    if (!phase) return;
    const messages = MESSAGES[phase];
    setMsgIndex(0);
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 2800);
    return () => clearInterval(id);
  }, [phase]);

  // Delay mount slightly so it doesn't flash on instant ops
  useEffect(() => {
    if (!phase) {
      const id = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(id);
  }, [phase]);

  const currentMessage = phase ? MESSAGES[phase][msgIndex] : "";
  const isDone = phase === "done";

  return (
    <AnimatePresence>
      {visible && phase && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          style={{
            position: "fixed",
            bottom: "24px",
            left: "24px",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            borderRadius: "999px",
            background: "var(--bg-glass-strong)",
            border: "1px solid var(--border-default)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6) inset",
            pointerEvents: "none",
          }}
        >
          {/* Animated orb */}
          <div style={{ position: "relative", flexShrink: 0, width: 8, height: 8 }}>
            {!isDone && (
              <motion.span
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  opacity: 0.2,
                }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span
              style={{
                display: "block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isDone ? "#10b981" : "var(--accent)",
                transition: "background 0.4s ease",
              }}
            />
          </div>

          {/* Cycling message */}
          <div style={{ position: "relative", overflow: "hidden", height: "16px", minWidth: "180px" }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentMessage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {currentMessage}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
