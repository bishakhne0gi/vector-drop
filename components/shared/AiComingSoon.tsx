"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ── Demo prompts + hand-crafted SVG paths ──────────────────────────────── */
const demos = [
  {
    prompt: "a minimal fire flame",
    label: "fire.svg",
    color: "#f97316",
    glow: "rgba(249,115,22,0.35)",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 56 C18 56 10 46 10 36 C10 24 20 18 24 12 C24 22 28 26 32 26 C28 18 34 8 40 4 C40 18 48 22 50 32 C52 40 46 56 32 56Z"
          fill="#f97316" opacity="0.9"
        />
        <path
          d="M32 48 C24 48 20 42 20 36 C20 30 26 26 28 22 C28 30 32 34 36 30 C34 40 40 44 32 48Z"
          fill="#fbbf24" opacity="0.85"
        />
        <path
          d="M32 42 C28 42 26 38 28 34 C30 38 34 36 32 42Z"
          fill="white" opacity="0.6"
        />
      </svg>
    ),
  },
  {
    prompt: "a bold lightning bolt",
    label: "lightning.svg",
    color: "#eab308",
    glow: "rgba(234,179,8,0.35)",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path
          d="M38 6 L18 36 L30 36 L26 58 L46 28 L34 28 Z"
          fill="#eab308"
          stroke="#fef08a"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    prompt: "a rounded water droplet",
    label: "water.svg",
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.35)",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 8 C32 8 12 30 12 40 C12 51.05 21 58 32 58 C43 58 52 51.05 52 40 C52 30 32 8 32 8Z"
          fill="#0ea5e9" opacity="0.9"
        />
        <ellipse cx="25" cy="36" rx="4" ry="6" fill="white" opacity="0.25" transform="rotate(-20 25 36)" />
      </svg>
    ),
  },
  {
    prompt: "a minimal leaf shape",
    label: "leaf.svg",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.35)",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 56 C20 56 10 42 10 28 C10 14 20 8 32 8 C44 8 54 14 54 28 C54 42 44 56 32 56Z"
          fill="#22c55e" opacity="0.9"
        />
        <line x1="32" y1="56" x2="32" y2="20" stroke="#bbf7d0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M32 28 Q22 32 18 42" stroke="#bbf7d0" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M32 36 Q42 32 46 42" stroke="#bbf7d0" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
      </svg>
    ),
  },
  {
    prompt: "a simple star icon",
    label: "star.svg",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.35)",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 8 L37.09 23.27 L53.27 23.27 L40.09 32.73 L45.18 48 L32 38.55 L18.82 48 L23.91 32.73 L10.73 23.27 L26.91 23.27 Z"
          fill="#a855f7"
          stroke="#e9d5ff"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/* ── Typewriter hook ─────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 38) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayed, done };
}

/* ── Sparkle particle ────────────────────────────────────────────────────── */
function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -20, -40] }}
      transition={{ duration: 1.8, delay, ease: "easeOut", repeat: Infinity, repeatDelay: 3 }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 0 L5.7 3.3 L9 4 L5.7 4.7 L5 8 L4.3 4.7 L1 4 L4.3 3.3 Z" fill="white" opacity="0.7" />
      </svg>
    </motion.div>
  );
}

/* ── Animated demo panel ─────────────────────────────────────────────────── */
function DemoPanel() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "generating" | "result">("typing");
  const demo = demos[index];
  const { displayed, done } = useTypewriter(demo.prompt, 42);

  useEffect(() => {
    setPhase("typing");
  }, [index]);

  useEffect(() => {
    if (!done) return;
    const t1 = setTimeout(() => setPhase("generating"), 400);
    const t2 = setTimeout(() => setPhase("result"), 1900);
    const t3 = setTimeout(() => {
      setIndex((i) => (i + 1) % demos.length);
    }, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [done]);

  const sparkles = [
    { x: 20, y: 15, delay: 0 }, { x: 75, y: 10, delay: 0.6 },
    { x: 88, y: 55, delay: 1.2 }, { x: 12, y: 70, delay: 0.3 },
    { x: 50, y: 5, delay: 0.9 }, { x: 65, y: 80, delay: 1.5 },
  ];

  return (
    <div className="relative w-full max-w-sm">
      {/* Ambient glow behind card */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl blur-3xl"
        animate={{ background: demo.glow, opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transform: "scale(1.1)" }}
      />

      {/* Sparkles */}
      {sparkles.map((s, i) => <Sparkle key={i} {...s} />)}

      {/* Main card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Prompt input row */}
        <div
          className="mb-4 flex items-center gap-2.5 rounded-xl px-4 py-3"
          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="flex-1 text-sm" style={{ color: "var(--text-primary)", fontFamily: "monospace", letterSpacing: "0" }}>
            {displayed}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ display: "inline-block", width: 2, height: "1em", background: "var(--text-secondary)", marginLeft: 2, verticalAlign: "middle" }}
            />
          </span>
          <motion.div
            className="flex h-6 w-6 items-center justify-center rounded-lg text-xs"
            style={{ background: demo.color }}
            whileHover={{ scale: 1.1 }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </motion.div>
        </div>

        {/* Output area */}
        <div
          className="relative flex min-h-[140px] flex-col items-center justify-center gap-3 overflow-hidden rounded-xl"
          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}
        >
          <AnimatePresence mode="wait">
            {phase === "typing" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--border-default)" }}
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Waiting for prompt…</span>
              </motion.div>
            )}

            {phase === "generating" && (
              <motion.div key="gen"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${demo.color}`, borderTopColor: "transparent" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={demo.color} strokeWidth="1.75" strokeLinecap="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Generating with Claude…</p>
                  <motion.div
                    className="mx-auto mt-1.5 h-0.5 rounded-full"
                    style={{ background: demo.color, width: 60 }}
                    animate={{ scaleX: [0, 1] }}
                    transition={{ duration: 1.3, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div key="result"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {demo.svg}
                </motion.div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>{demo.label}</span>
                  <span className="rounded-sm px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: `${demo.color}30`, color: demo.color }}>
                    SVG ready
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {demos.map((_, i) => (
              <motion.span key={i} className="h-1 rounded-full"
                animate={{ width: i === index ? 16 : 4, background: i === index ? demo.color : "var(--border-default)" }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Powered by Claude</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main section ─────────────────────────────────────────────────────────── */
export function AiComingSoon() {
  return (
    /* Icon Generation — v2 feature, not yet available */
    <section className="relative overflow-hidden px-6 py-28">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Teal ambient glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: "60vw", height: "60vw", maxWidth: 700, maxHeight: 700, background: "radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-16 md:flex-row md:gap-12">

        {/* Left — copy */}
        <motion.div
          className="flex flex-col items-start gap-6 md:w-1/2"
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Coming in v2
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>2025</span>
          </div>

          <h2
            className="text-4xl font-bold leading-[1.1] tracking-[-0.04em] md:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            Generate any icon{" "}
            <span style={{
              background: "linear-gradient(135deg, #14b8a6, #2dd4bf, #0891b2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              from a prompt.
            </span>
          </h2>

          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)", maxWidth: "36ch" }}>
            Describe any icon in plain English — a fire flame, a water droplet, a lightning bolt — and get a pixel-perfect, production-ready SVG in seconds.
          </p>

          <div className="flex flex-col gap-3">
            {[
              "Hand-crafted SVG paths, not bitmaps",
              "Any style — minimal, bold, outlined",
              "Powered by Claude Sonnet",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--accent-bg)" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>

          <motion.button
            type="button"
            disabled
            className="mt-2 inline-flex cursor-not-allowed items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium opacity-70"
            style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}
            whileHover={{ opacity: 0.85 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            Notify me when it's ready
          </motion.button>
        </motion.div>

        {/* Right — animated demo */}
        <motion.div
          className="flex w-full items-center justify-center md:w-1/2"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <DemoPanel />
        </motion.div>

      </div>
    </section>
  );
}
