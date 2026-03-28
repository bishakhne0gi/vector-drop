"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogoMark } from "./Logo";
import { AiComingSoon } from "./AiComingSoon";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/* ── Motion helpers ──────────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-72px" },
  transition: { duration: 0.5, ease: EASE, delay },
});

const staggerList = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const staggerListView = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/* ────────────────────────────────────────────────────────────────────────── */
/* ── Step mockups ─────────────────────────────────────────────────────────  */
/* ────────────────────────────────────────────────────────────────────────── */

function MockupUpload() {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-1.5 border-b px-4 py-2.5"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)" }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: "#ef4444", opacity: 0.5 }} />
        <span className="h-2 w-2 rounded-full" style={{ background: "#f59e0b", opacity: 0.5 }} />
        <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e", opacity: 0.5 }} />
        <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>vectorai.app/dashboard</span>
      </div>

      {/* Drop zone */}
      <div className="p-5">
        <motion.div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8"
          style={{
            borderColor: "var(--accent-border)",
            background: "var(--accent-glow, rgba(13,148,136,0.03))",
          }}
          animate={{ borderColor: ["var(--accent-border)", "var(--accent)", "var(--accent-border)"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--accent-bg)" }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
          </motion.div>
          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Drop your image here</p>
            <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>JPEG · PNG · WebP · up to 10 MB</p>
          </div>
          <div
            className="rounded-lg px-3 py-1 text-[10px] font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Browse files
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MockupConvert() {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex items-center gap-1.5 border-b px-4 py-2.5"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)" }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: "#ef4444", opacity: 0.5 }} />
        <span className="h-2 w-2 rounded-full" style={{ background: "#f59e0b", opacity: 0.5 }} />
        <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e", opacity: 0.5 }} />
        <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>Converting logo.png…</span>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Steps */}
        {[
          { label: "Uploading image", done: true },
          { label: "Normalizing colors", done: true },
          { label: "Tracing paths", active: true },
          { label: "Assembling SVG", done: false },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{
                background: s.done ? "var(--accent)" : s.active ? "var(--accent-bg)" : "var(--border-default)",
                border: s.active ? "2px solid var(--accent)" : "none",
              }}
            >
              {s.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {s.active && (
                <motion.span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "var(--accent)" }}
                  animate={{ scale: [1, 0.6, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <span className="text-xs" style={{ color: s.done || s.active ? "var(--text-primary)" : "var(--text-muted)" }}>
              {s.label}
            </span>
            {s.done && <span className="ml-auto text-[10px]" style={{ color: "var(--accent)" }}>Done</span>}
            {s.active && (
              <motion.span
                className="ml-auto text-[10px]"
                style={{ color: "var(--accent)" }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                Running…
              </motion.span>
            )}
          </div>
        ))}

        {/* Progress bar */}
        <div className="mt-1">
          <div className="mb-1.5 flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span>Progress</span><span style={{ color: "var(--accent)" }}>75%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--accent-bg)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--accent)" }}
              initial={{ width: "0%" }}
              whileInView={{ width: "75%" }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 1.2, ease: EASE }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupEditor() {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex items-center gap-1.5 border-b px-4 py-2.5"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)" }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: "#ef4444", opacity: 0.5 }} />
        <span className="h-2 w-2 rounded-full" style={{ background: "#f59e0b", opacity: 0.5 }} />
        <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e", opacity: 0.5 }} />
        <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>logo.svg — Editor</span>
        <div
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download SVG
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x" style={{ borderColor: "var(--border-subtle)" }}>
        {/* Layers panel */}
        <div className="p-3 border-r" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Layers</p>
          {["Path 1", "Path 2", "Path 3"].map((l, i) => (
            <div
              key={l}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 mb-0.5 text-[10px]"
              style={{
                background: i === 0 ? "var(--accent-bg)" : "transparent",
                color: i === 0 ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: i === 0 ? "var(--accent)" : "var(--border-default)" }} />
              {l}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          className="flex items-center justify-center p-4"
          style={{ background: "var(--bg-subtle)" }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path d="M8 56 C12 40 24 24 32 32 C40 40 52 16 56 8" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M8 40 C14 36 22 32 32 32" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
            <circle cx="8" cy="56" r="3.5" fill="var(--accent)" />
            <circle cx="32" cy="32" r="3" fill="var(--accent)" />
            <circle cx="56" cy="8" r="3.5" fill="var(--accent)" />
          </svg>
        </div>

        {/* Properties */}
        <div className="p-3">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Properties</p>
          {[{ k: "Fill", v: "#0d9488" }, { k: "Stroke", v: "None" }, { k: "Opacity", v: "100%" }].map(({ k, v }) => (
            <div key={k} className="flex items-center justify-between mb-1.5">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{k}</span>
              <span className="text-[10px] font-medium" style={{ color: "var(--text-primary)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Step data ────────────────────────────────────────────────────────────── */
const steps = [
  {
    n: "01",
    title: "Upload your image",
    desc: "Drag and drop or click to browse. Supports JPEG, PNG, and WebP files up to 10 MB. No sign-up needed to try.",
    mockup: <MockupUpload />,
  },
  {
    n: "02",
    title: "We trace it to vector",
    desc: "Our engine quantizes colors, runs potrace path tracing on each layer, and assembles a clean multi-path SVG — in seconds.",
    mockup: <MockupConvert />,
  },
  {
    n: "03",
    title: "Edit and download",
    desc: "Tweak paths, colors, and layers in the built-in editor. When you're happy, export a production-ready SVG file.",
    mockup: <MockupEditor />,
  },
];

/* ── Features ─────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    ),
    title: "Upload any image",
    desc: "JPEG, PNG, WebP — up to 10 MB.",
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07" />
      </svg>
    ),
    title: "AI-powered tracing",
    desc: "Color quantization + potrace for precision.",
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    title: "Browser-based editor",
    desc: "Adjust paths and colors without Figma.",
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    title: "Export clean SVG",
    desc: "Optimized files ready for the web.",
  },
];

/* ── Hero product preview ─────────────────────────────────────────────────── */
function HeroMockup() {
  return (
    <motion.div
      className="mx-auto mt-14 w-full max-w-3xl"
      {...fadeUp(0.35)}
    >
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-default)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.08)",
        }}
      >
        {/* Chrome */}
        <div
          className="flex items-center gap-1.5 border-b px-4 py-3"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)" }}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444", opacity: 0.65 }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b", opacity: 0.65 }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e", opacity: 0.65 }} />
          <span
            className="ml-3 rounded-md px-3 py-0.5 text-xs"
            style={{ background: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            vectorai.app — image.png → vector.svg
          </span>
        </div>

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
          {/* Stat — hidden on mobile */}
          <div className="hidden flex-col justify-between border-r p-5 sm:flex" style={{ borderColor: "var(--border-subtle)" }}>
            <div>
              <p className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>SVGs Converted</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>1,247</span>
                <span className="mb-0.5 rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>+12%</span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>total files processed</p>
            </div>
            <div className="mt-4 flex items-end gap-1 h-8">
              {[30, 55, 40, 70, 45, 80, 65].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.6 + i * 0.06, duration: 0.4, ease: "easeOut" }}
                  style={{ background: i === 6 ? "var(--accent)" : "var(--accent-bg)", height: `${h}%`, transformOrigin: "bottom" }}
                />
              ))}
            </div>
          </div>

          {/* Conversion preview */}
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="flex w-full items-center gap-3">
              <div className="flex flex-1 aspect-square items-center justify-center rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-default)" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  {[0,1,2,3].flatMap((r) => [0,1,2,3].map((c) => (
                    <rect key={`${r}${c}`} x={3+c*5} y={3+r*5} width="4" height="4" rx="0.5" fill="var(--accent)" opacity={(r+c)%2===0 ? 0.5 : 0.1} />
                  )))}
                </svg>
              </div>
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--accent)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </motion.div>
              <div className="flex flex-1 aspect-square items-center justify-center rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "var(--accent-border)" }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M4 30 C7 22 13 14 18 18 C23 22 28 10 32 5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <circle cx="4" cy="30" r="2.5" fill="var(--accent)" />
                  <circle cx="18" cy="18" r="1.8" fill="var(--accent)" opacity="0.45" />
                  <circle cx="32" cy="5" r="2.5" fill="var(--accent)" />
                </svg>
              </div>
            </div>
            <div className="w-full">
              <div className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>Tracing</span><span style={{ color: "var(--accent)" }}>Complete</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--accent-bg)" }}>
                <motion.div className="h-full rounded-full" style={{ background: "var(--accent)" }}
                  initial={{ width: "0%" }} animate={{ width: "100%" }}
                  transition={{ delay: 1, duration: 1.4, ease: EASE }}
                />
              </div>
            </div>
          </div>

          {/* Recent — hidden on mobile */}
          <div className="hidden flex-col border-l p-5 sm:flex" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>Recent</p>
            {[
              { name: "logo.png", status: "Done" },
              { name: "icon.jpg", status: "Done" },
              { name: "photo.png", status: "Running" },
            ].map((f, i) => (
              <motion.div key={f.name} className="flex items-center justify-between py-2 text-xs"
                style={{ borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none" }}
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.35 }}
              >
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={f.status === "Done"
                    ? { background: "var(--accent-bg)", color: "var(--accent)" }
                    : { background: "rgba(245,158,11,0.1)", color: "#d97706" }}
                >
                  {f.status}
                </span>
              </motion.div>
            ))}
            <div className="mt-auto pt-4">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Avg. time</p>
              <p className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>1.8s</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 divide-x border-t sm:grid-cols-4" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)" }}>
          {[
            { label: "Formats", value: "PNG · JPG · WebP" },
            { label: "Max size", value: "10 MB" },
            { label: "Output", value: "Clean SVG" },
            { label: "Uptime", value: "99.9%" },
          ].map((s) => (
            <div key={s.label} className="px-5 py-3" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
const faqs = [
  {
    q: "What image formats are supported?",
    a: "JPEG, PNG, and WebP files up to 10 MB. For best results use high-contrast images with clear edges.",
  },
  {
    q: "How accurate is the vector tracing?",
    a: "Very. We use color quantization to reduce noise, then run potrace path tracing on each isolated color layer. Complex images may need minor touch-ups in the editor.",
  },
  {
    q: "Can I edit the SVG after conversion?",
    a: "Yes — the built-in editor lets you select, recolor, and adjust individual paths before exporting. You can also open the SVG in Figma or Illustrator.",
  },
  {
    q: "What does the output SVG look like?",
    a: "A clean, multi-layer SVG with separate paths per color. No embedded bitmaps, no inline styles — just pure vector markup.",
  },
  {
    q: "Is there a limit on how many files I can convert?",
    a: "Free accounts get 5 conversions per minute. Sign up for unlimited access and to save your conversion history.",
  },
  {
    q: "What's in v2?",
    a: "AI Icon Generation — describe any icon in plain English and get a pixel-perfect SVG instantly, powered by Claude.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="border-b"
      style={{ borderColor: "var(--border-subtle)" }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: open ? "var(--accent)" : "var(--border-default)" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={open ? "white" : "var(--text-muted)"} strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <main className="flex flex-col">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 pt-32 pb-12 text-center">
        <motion.div className="mx-auto flex max-w-2xl flex-col items-center" initial="initial" animate="animate" variants={staggerList}>
          <motion.div variants={staggerItem}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium"
              style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
              Your all-in-one SVG conversion platform
            </span>
          </motion.div>

          <motion.h1 variants={staggerItem} className="mb-5 text-[3.2rem] font-bold leading-[1.08] tracking-[-0.04em] md:text-[4.5rem]">
            Convert Images to{" "}
            <span className="gradient-text">Perfect Vectors</span>
          </motion.h1>

          <motion.p variants={staggerItem} className="mb-8 max-w-lg text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Upload any raster image, get a clean editable SVG in seconds.
            No design software — works right in your browser.
          </motion.p>

          <motion.div variants={staggerItem} className="flex flex-col items-center gap-3 sm:flex-row">
            <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
              <Link href="/login" className="btn-accent inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium">
                Start for free
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </motion.div>
            <motion.a
              href="#how-it-works"
              className="btn-ghost rounded-xl px-6 py-3 text-sm"
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              See how it works
            </motion.a>
          </motion.div>
        </motion.div>

        <HeroMockup />
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div className="mb-14 text-center" {...inView()}>
            <h2 className="mb-3 text-3xl font-bold tracking-[-0.03em]">Everything you need</h2>
            <p style={{ color: "var(--text-secondary)" }}>Professional-grade conversion — no design skills required.</p>
          </motion.div>
          <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} variants={staggerList}>
            {features.map((f) => (
              <motion.div key={f.title} variants={staggerItem}
                className="rounded-2xl border p-6 transition-shadow"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-card)" }}
                whileHover={{ y: -3, boxShadow: "var(--shadow-card-hover)", transition: { duration: 0.2 } }}>
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--accent-bg)" }}>
                  {f.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works — with mockups ─────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div className="mb-16 text-center" {...inView()}>
            <h2 className="mb-3 text-3xl font-bold tracking-[-0.03em]">Three steps to perfection</h2>
            <p style={{ color: "var(--text-secondary)" }}>From upload to export in under 5 seconds.</p>
          </motion.div>

          <div className="flex flex-col gap-20">
            {steps.map(({ n, title, desc, mockup }, i) => (
              <motion.div
                key={n}
                className={`flex flex-col gap-10 md:flex-row md:items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                {/* Text */}
                <div className="flex flex-col gap-4 md:w-[42%]">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {n}
                    </span>
                    <div className="h-px flex-1" style={{ background: "var(--border-default)" }} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", maxWidth: "28rem" }}>{desc}</p>
                </div>

                {/* Mockup */}
                <motion.div
                  className="md:w-[58%]"
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                >
                  {mockup}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coming Soon: AI Icon Generation ─────────────────────────────── */}
      <AiComingSoon />

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <motion.div className="mb-12 text-center" {...inView()}>
            <h2 className="mb-3 text-3xl font-bold tracking-[-0.03em]">Frequently asked</h2>
            <p style={{ color: "var(--text-secondary)" }}>Everything you need to know about VectorDrop.</p>
          </motion.div>
          <div className="divide-y" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {faqs.map((f) => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mt-4 border-t px-6 py-10" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mx-auto max-w-4xl flex flex-col gap-8">
          {/* Top row */}
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div className="flex items-center gap-2.5">
              <LogoMark size={22} />
              <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>VectorDrop</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm transition-opacity hover:opacity-60" style={{ color: "var(--text-muted)" }}>Sign in</Link>
              <Link href="/login" className="text-sm transition-opacity hover:opacity-60" style={{ color: "var(--text-muted)" }}>Get started</Link>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>© 2026 VectorDrop. All rights reserved.</p>
          </div>

          {/* Competitors / alternatives row */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Better than:</span>
            {[
              "Adobe Illustrator Image Trace",
              "Vectorizer.AI",
              "SVGtrace",
              "Figma Vectorize",
              "Vector Magic",
              "Autotracer",
              "Inkscape",
            ].map((name) => (
              <span
                key={name}
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  background: "var(--bg-glass)",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </footer>

    </main>
  );
}
