"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CloudArrowUp,
  DownloadSimple,
  BezierCurveIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { LegoStud } from "./LegoStud";
import { SiteLinks } from "@/components/pseo/SiteLinks";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useInView, animate } from "motion/react";

// ─── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  orange: "#f97316",
  purple: "#a855f7",
  blue:   "#38bdf8",
  green:  "#a3e635",
  cyan:   "#22d3ee",
  pink:   "#ec4899",
} as const;

// ─── Data ─────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "How it works", href: "#how-it-works", color: C.purple },
  { label: "Why us",       href: "#why-us",       color: C.green  },
  { label: "Icon styles",  href: "#icon-styles",  color: C.pink   },
];

const STEPS = [
  {
    num: "01",
    title: "Upload",
    description: "Drag & drop your image or browse files. Supports PNG, JPG, WebP.",
    detail: "Instant ingestion, zero setup. Your files never leave your browser.",
    icon: <CloudArrowUp size={22} weight="light" />,
    color: C.orange,
    badge: "Instant ingestion",
  },
  {
    num: "02",
    title: "Auto vectorize",
    description: "Intelligent tracing converts your raster into clean vector paths, no noise or jagged edges.",
    detail: "Crisp SVG output with editable anchor points, ready to use immediately.",
    icon: <BezierCurveIcon size={22} weight="light" />,
    color: C.green,
    badge: "Crisp output",
  },
  {
    num: "03",
    title: "Edit & export",
    description: "Fine-tune directly in your browser and download SVG ready for Figma, Illustrator, or web.",
    detail: "Workflow-ready files that open instantly in every design tool.",
    icon: <DownloadSimple size={22} weight="light" />,
    color: C.cyan,
    badge: "Workflow-ready",
  },
];


// ─── Shared UI components ──────────────────────────────────────────────────────

/** Thin 1px bordered label badge — matches reference "THE CASE FOR PLASTICITY" style exactly */
function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-[10px] py-[5px] text-[10.5px] tracking-[0.2em] uppercase leading-none"
      style={{ fontFamily: "auxMono, monospace", color, border: `1px solid ${color}` }}
    >
      {text}
    </span>
  );
}

/** Section wrapper with thin side-rail lines and colored corner-dot markers at top of each section */
function RailedSection({
  children,
  accentColor,
  className = "",
  id,
  style,
}: {
  children: ReactNode;
  accentColor: string;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section id={id} className={`relative ${className}`} style={style}>
      {/* Left rail line — dashed */}
      <div
        className="hidden xl:block absolute left-[80px] top-0 bottom-0 w-px overflow-hidden"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 3px, transparent 3px, transparent 6px)",
        }}
      />
      {/* Right rail line — dashed */}
      <div
        className="hidden xl:block absolute right-[80px] top-0 bottom-0 w-px overflow-hidden"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 3px, transparent 3px, transparent 6px)",
        }}
      />
      {/* Left corner — LEGO stud marker */}
      <div className="hidden xl:block absolute left-[80px] top-2 -translate-x-1/2 -translate-y-1/2">
        <LegoStud color={accentColor} size={14} />
      </div>
      {/* Right corner — LEGO stud marker */}
      <div className="hidden xl:block absolute right-[80px] top-2 translate-x-1/2 -translate-y-1/2">
        <LegoStud color={accentColor} size={14} />
      </div>
      {children}
    </section>
  );
}

// ─── Staircase raster pixel grid: 6 cols × 8 rows ────────────────────────────
// Diagonal band of alternating bright/dark stripes (zebra staircase pattern).
// Even rows = bright stripe, odd rows = dark stripe; row 3 has a person hint.
const STAIR_CELLS = [
  0.03, 0.03, 0.60, 0.60, 0.60, 0.03,  // row 0: bright stripe, band at cols 2–4
  0.03, 0.03, 0.05, 0.05, 0.05, 0.03,  // row 1: dark stripe
  0.03, 0.60, 0.60, 0.60, 0.03, 0.03,  // row 2: bright stripe, band shifts left
  0.03, 0.05, 0.16, 0.05, 0.03, 0.03,  // row 3: dark stripe (person silhouette at col 2)
  0.60, 0.60, 0.60, 0.03, 0.03, 0.03,  // row 4: bright stripe, band at cols 0–2
  0.05, 0.05, 0.05, 0.03, 0.03, 0.03,  // row 5: dark stripe
  0.42, 0.42, 0.03, 0.03, 0.03, 0.03,  // row 6: bright stripe, fading out
  0.05, 0.05, 0.03, 0.03, 0.03, 0.03,  // row 7: dark stripe
];

// ─── Real pre-converted examples (SVGs in /public/vectors/) ──────────────────
const PLAYGROUND_EXAMPLES = [
  {
    id: "flower", label: "Flower", category: "Botanical", paths: 24, size: "1080 × 1080", aspect: "1/1",
    colors: ["#000000","#101313","#152621","#27292a","#283935","#3e3e3f","#3c4a48","#555457","#4f5957","#616666","#6e6669","#746e7a","#777677","#84777a","#8c8386","#8f818f","#9c8c90","#a391a1","#ab989c","#b9a6aa","#b6a6b6","#c8b7b8","#cbbbc9","#e3d6db"],
  },
  {
    id: "planet", label: "Planet", category: "Cosmic", paths: 24, size: "1080 × 1079", aspect: "1/1",
    colors: ["#060606","#14110b","#1e1609","#281d0d","#231f16","#352610","#332b1d","#433014","#423522","#543d1a","#514229","#65491e","#645032","#7a5926","#755c35","#8c682c","#8b6f41","#9a793f","#a37f38","#ae8f55","#b49344","#bfa158","#c9ab57","#d5bc70"],
  },
  {
    id: "yellow", label: "Yellow bloom", category: "Botanical", paths: 24, size: "1080 × 1079", aspect: "1/1",
    colors: ["#2b0902","#3c1202","#481904","#552105","#632506","#74310a","#8c3104","#843e10","#b72b04","#724f39","#924a16","#a15723","#b36422","#d17b28","#759ac4","#fa8805","#fa9706","#8dacd0","#faa617","#f7a63e","#a1bdd8","#fcb42d","#dec19a","#c5cfd5"],
  },
  {
    id: "beigh", label: "Portrait", category: "Portrait", paths: 24, size: "1080 × 1350", aspect: "4/5",
    colors: ["#120a07","#2a1a15","#301d16","#37231b","#46291e","#553125","#613526","#5f3b2d","#6b3b2a","#673d2d","#704231","#6c4736","#794c3a","#824a35","#875843","#92634a","#8d6d5e","#a47b5d","#c09a79","#d8b79a","#f0d0ad","#f2d7bc","#f9e5cb"],
  },
];

// hex "#rrggbb" → "rgb(r,g,b)" matching SVG fill format
function hexToSvgRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r},${g},${b})`;
}

// ─── Vector Playground — premium macOS-style UI ───────────────────────────────
function VectorPlayground() {
  const [activeIdx,      setActiveIdx]      = useState(0);
  const [progress,       setProgress]       = useState(0);
  const [isAnimating,    setIsAnimating]    = useState(false);
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({});
  const [displaySrc,     setDisplaySrc]     = useState(`/vectors/flower.svg`);

  const animRef  = useRef<number>(0);
  const startRef = useRef(0);
  // Per-image caches — survive image switches
  const svgCache     = useRef<Record<string, string>>({}); // id → original SVG text
  const blobUrls     = useRef<Record<string, string>>({});  // id → latest blob URL (or static path)
  const overridesSig = useRef<Record<string, string>>({});  // id → JSON signature of overrides used to generate current blob
  const DURATION = 2400;

  // Initialise blobUrls with static paths so switching is instant even before a fetch
  useEffect(() => {
    PLAYGROUND_EXAMPLES.forEach(e => {
      if (!blobUrls.current[e.id]) blobUrls.current[e.id] = `/vectors/${e.id}.svg`;
    });
  }, []);

  // ── Regenerate display SVG for the active image whenever overrides change ──
  useEffect(() => {
    const ex = PLAYGROUND_EXAMPLES[activeIdx];
    let cancelled = false;

    // Compute a signature of the current overrides for this image
    const sig = JSON.stringify(ex.colors.map((_, j) => colorOverrides[`${ex.id}-${j}`] ?? ""));

    // If the blob is already up-to-date for this exact set of overrides, just restore displaySrc
    if (overridesSig.current[ex.id] === sig && blobUrls.current[ex.id]) {
      setDisplaySrc(blobUrls.current[ex.id]);
      return;
    }

    const generate = async () => {
      // Fetch and cache the raw SVG text once per image
      if (!svgCache.current[ex.id]) {
        const res = await fetch(`/vectors/${ex.id}.svg`);
        if (cancelled) return;
        svgCache.current[ex.id] = await res.text();
      }
      if (cancelled) return;

      const hasOverrides = ex.colors.some((_, j) => `${ex.id}-${j}` in colorOverrides);

      let newUrl: string;
      if (!hasOverrides) {
        newUrl = `/vectors/${ex.id}.svg`;
      } else {
        // Apply color substitutions to the cached SVG text
        let modified = svgCache.current[ex.id];
        for (let j = 0; j < ex.colors.length; j++) {
          const newHex = colorOverrides[`${ex.id}-${j}`];
          if (!newHex) continue;
          modified = modified
            .split(`fill="${hexToSvgRgb(ex.colors[j])}"`)
            .join(`fill="${hexToSvgRgb(newHex)}"`);
        }
        const blob = new Blob([modified], { type: "image/svg+xml" });
        newUrl = URL.createObjectURL(blob);
      }

      if (cancelled) {
        // Discard the newly created blob — it will never be used
        if (newUrl.startsWith("blob:")) URL.revokeObjectURL(newUrl);
        return;
      }

      // Update cache, then revoke OLD blob AFTER new one is stored
      const oldUrl = blobUrls.current[ex.id];
      blobUrls.current[ex.id] = newUrl;
      overridesSig.current[ex.id] = sig;
      setDisplaySrc(newUrl);
      if (oldUrl?.startsWith("blob:")) URL.revokeObjectURL(oldUrl);
    };

    generate();
    return () => { cancelled = true; };
  }, [activeIdx, colorOverrides]);

  // Revoke all blob URLs on unmount
  useEffect(() => () => {
    Object.values(blobUrls.current).forEach(u => u?.startsWith("blob:") && URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    startRef.current = performance.now();
    setIsAnimating(true);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;
    const tick = (now: number) => {
      const p = Math.min((now - startRef.current) / DURATION, 1);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setProgress(eased);
      if (p < 1) { animRef.current = requestAnimationFrame(tick); }
      else { setProgress(1); setIsAnimating(false); }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isAnimating]);

  const triggerTransform = (idx: number) => {
    cancelAnimationFrame(animRef.current);
    // ── Immediately restore the last known src for the target image (no async flash) ──
    const targetId = PLAYGROUND_EXAMPLES[idx].id;
    setDisplaySrc(blobUrls.current[targetId] ?? `/vectors/${targetId}.svg`);
    setActiveIdx(idx);
    setProgress(0);
    startRef.current = performance.now();
    setIsAnimating(true);
  };

  const ex          = PLAYGROUND_EXAMPLES[activeIdx];
  const clipRight   = `${(1 - progress) * 100}%`;
  const changedKeys = Object.keys(colorOverrides).filter(k => k.startsWith(ex.id + "-"));

  return (
    <>
    <style>{`
      @keyframes scanShimmer {
        0%   { top: -32%; opacity: 0; }
        8%   { opacity: 1; }
        92%  { opacity: 1; }
        100% { top: 112%; opacity: 0; }
      }
      @keyframes scanGlint {
        0%   { top: -20%; opacity: 0; }
        6%   { opacity: 1; }
        94%  { opacity: 1; }
        100% { top: 110%; opacity: 0; }
      }
      @keyframes scanPulse {
        0%, 100% { opacity: 0.55; }
        50%       { opacity: 0.90; }
      }
    `}</style>
    <div
      className="relative overflow-hidden"
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── macOS titlebar ── */}
      <div className="flex items-center px-4 select-none border-b"
        style={{ height: 40, background: "#131313", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-[7px] flex-shrink-0">
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-[11px]"
            style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.28)" }}>
            {ex.id}.png
          </span>
          <span style={{ color: "rgba(255,255,255,0.14)", fontSize: 10 }}>→</span>
          <span className="text-[11px] font-medium"
            style={{ fontFamily: "auxMono, monospace", color: `rgba(255,255,255,${0.14 + progress * 0.60})` }}>
            {ex.id}.svg
          </span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {isAnimating ? (
            <>
              <div style={{ width: 32, height: 1.5, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${progress * 100}%`, height: "100%", background: "rgba(255,255,255,0.38)", transition: "none" }} />
              </div>
              <span className="text-[9px] uppercase tracking-[0.12em]"
                style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.26)" }}>
                Converting
              </span>
            </>
          ) : (
            <span className="text-[9px] uppercase tracking-[0.12em]"
              style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.18)" }}>
              {ex.paths} paths
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex min-h-[280px] md:min-h-[360px] lg:min-h-[440px]">

        {/* ── Left sidebar — thumbnails with mini color strips ── */}
        <div className="hidden md:flex flex-col flex-shrink-0"
          style={{ width: 136, background: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="px-3 pt-3 pb-1.5 text-[7.5px] uppercase tracking-[0.22em]"
            style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.16)" }}>
            Examples
          </div>
          {PLAYGROUND_EXAMPLES.map((e, i) => (
            <button key={e.id} onClick={() => triggerTransform(i)}
              className="mx-2 mb-2 p-1.5 rounded text-left transition-all"
              style={{
                background: activeIdx === i ? "rgba(255,255,255,0.06)" : "transparent",
                border:     `1px solid ${activeIdx === i ? "rgba(255,255,255,0.11)" : "transparent"}`,
                outline:    "none",
              }}>
              {/* Thumbnail */}
              <div className="w-full overflow-hidden rounded-sm"
                style={{ height: 56, background: "#1a1a1a" }}>
                <img src={`/${e.id}.png`} alt={e.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                    filter: activeIdx === i ? "none" : "brightness(0.55) saturate(0.6)" }} />
              </div>
              {/* Label */}
              <div className="text-[9.5px] font-medium mt-1.5 px-0.5 leading-tight"
                style={{ color: activeIdx === i ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.26)" }}>
                {e.label}
              </div>
              {/* Mini color palette strip — 6 representative swatches */}
              <div className="flex gap-[2px] mt-1.5 px-0.5">
                {e.colors.filter((_, ci) => ci % 4 === 0).map((hex, ci) => (
                  <div key={ci} className="flex-1 rounded-sm"
                    style={{ height: 3, background: colorOverrides[`${e.id}-${ci * 4}`] || hex }} />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* ── Main canvas ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative flex items-center justify-center"
            style={{ background: "#0f0f0f", padding: "12px 12px" }}>
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }} />
            {/* Image wipe container */}
            <div className="relative overflow-hidden"
              style={{
                height: "100%", maxHeight: 370,
                aspectRatio: ex.aspect,
                boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
              {/* Original PNG */}
              <img src={`/${ex.id}.png`} alt={ex.label} draggable={false}
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: "cover", display: "block", userSelect: "none" }} />
              {/* Vector SVG — wipes from left; src is either static or color-replaced blob */}
              <img
                src={displaySrc}
                alt={`${ex.label} — vector`}
                draggable={false}
                key={ex.id}   /* remount only on example change (resets wipe), not on color change */
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: "cover", display: "block", userSelect: "none",
                  clipPath: `inset(0 ${clipRight} 0 0)` }}
              />
              {/* Scan line */}
              {isAnimating && progress > 0.01 && progress < 0.99 && (
                <>
                  {/* Atmospheric bloom */}
                  <div className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: `calc(${progress * 100}% - 14px)`,
                      width: 28,
                      background: "linear-gradient(to right, transparent 0%, rgba(210,210,210,0.03) 25%, rgba(220,220,220,0.06) 50%, rgba(210,210,210,0.03) 75%, transparent 100%)",
                      animation: "scanPulse 2.4s ease-in-out infinite",
                    }} />
                  {/* Inner glow */}
                  <div className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: `calc(${progress * 100}% - 3px)`,
                      width: 6,
                      background: "linear-gradient(to right, transparent 0%, rgba(220,220,220,0.14) 30%, rgba(232,232,232,0.28) 50%, rgba(220,220,220,0.14) 70%, transparent 100%)",
                    }} />
                  {/* Core line — near-white, faded at top/bottom */}
                  <div className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: `calc(${progress * 100}% - 0.5px)`,
                      width: 1,
                      background: "linear-gradient(to bottom, transparent 0%, rgba(180,180,180,0.28) 3%, rgba(210,210,210,0.68) 12%, rgba(230,230,230,0.85) 30%, rgba(240,240,240,0.92) 50%, rgba(230,230,230,0.85) 70%, rgba(210,210,210,0.68) 88%, rgba(180,180,180,0.28) 97%, transparent 100%)",
                      boxShadow: "0 0 2px 0.5px rgba(200,200,200,0.20), 0 0 1px rgba(230,230,230,0.55)",
                    }} />
                  {/* Moving glint */}
                  <div className="pointer-events-none"
                    style={{
                      position: "absolute",
                      left: `calc(${progress * 100}% - 6px)`,
                      width: 12,
                      height: "16%",
                      background: "radial-gradient(ellipse 6px 100% at 50% 50%, rgba(248,248,248,0.48) 0%, rgba(228,228,228,0.16) 50%, transparent 100%)",
                      animation: "scanGlint 1.8s ease-in-out infinite",
                    }} />
                  {/* Top tick */}
                  <div className="absolute pointer-events-none"
                    style={{
                      left: `calc(${progress * 100}% - 3px)`,
                      top: 5, width: 6, height: 1,
                      background: "linear-gradient(to right, transparent, rgba(200,200,200,0.42) 50%, transparent)",
                    }} />
                  {/* Bottom tick */}
                  <div className="absolute pointer-events-none"
                    style={{
                      left: `calc(${progress * 100}% - 3px)`,
                      bottom: 5, width: 6, height: 1,
                      background: "linear-gradient(to right, transparent, rgba(200,200,200,0.42) 50%, transparent)",
                    }} />
                </>
              )}
              {/* Format labels */}
              <div className="absolute bottom-2 left-3 pointer-events-none"
                style={{ opacity: Math.max(0, 1 - progress * 2) }}>
                <span className="text-[8px] uppercase tracking-[0.18em]"
                  style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.45)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>PNG</span>
              </div>
              <div className="absolute bottom-2 left-3 pointer-events-none"
                style={{ opacity: Math.max(0, (progress - 0.5) * 2) }}>
                <span className="text-[8px] uppercase tracking-[0.18em]"
                  style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.50)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>VECTOR</span>
              </div>
            </div>
          </div>

          {/* ── Mobile example selector (hidden on md+) ── */}
          <div className="flex md:hidden items-center gap-2 px-3 py-2.5 border-t overflow-x-auto"
            style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)" }}>
            {PLAYGROUND_EXAMPLES.map((e, i) => (
              <button key={e.id} onClick={() => triggerTransform(i)}
                className="flex-shrink-0 flex flex-col items-center gap-1 transition-all"
                style={{ outline: "none" }}>
                <div className="rounded overflow-hidden"
                  style={{
                    width: 44, height: 44,
                    border: `1px solid ${activeIdx === i ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.07)"}`,
                  }}>
                  <img src={`/${e.id}.png`} alt={e.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                      filter: activeIdx === i ? "none" : "brightness(0.40) saturate(0.5)" }} />
                </div>
                <span className="text-[7px] uppercase tracking-[0.10em]"
                  style={{ fontFamily: "auxMono, monospace",
                    color: activeIdx === i ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.20)" }}>
                  {e.label}
                </span>
              </button>
            ))}
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center gap-5 px-5 border-t flex-shrink-0"
            style={{ height: 38, background: "#0d0d0d", borderColor: "rgba(255,255,255,0.05)" }}>
            {[ex.size, `${ex.paths} paths`, ex.category].map((s) => (
              <span key={s} className="text-[8px] uppercase tracking-[0.15em]"
                style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.18)" }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right palette panel ── */}
        <div className="hidden lg:flex flex-col flex-shrink-0 border-l"
          style={{ width: 92, background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)" }}>
          {/* Header */}
          <div className="px-2.5 pt-3 pb-2 flex items-center justify-between">
            <span className="text-[7.5px] uppercase tracking-[0.22em]"
              style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.16)" }}>
              Palette
            </span>
            {changedKeys.length > 0 && (
              <button
                onClick={() => setColorOverrides(prev => {
                  const next = { ...prev };
                  changedKeys.forEach(k => delete next[k]);
                  return next;
                })}
                className="text-[7px] uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
                style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.30)" }}>
                Reset
              </button>
            )}
          </div>

          {/* 24 color swatches — 4 columns × 6 rows */}
          <div className="px-2"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
            {ex.colors.map((hex, j) => {
              const key  = `${ex.id}-${j}`;
              const show = colorOverrides[key] || hex;
              const changed = key in colorOverrides;
              return (
                <div key={j} style={{ position: "relative", aspectRatio: "1" }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    background: show, borderRadius: 2,
                    border: changed
                      ? "1px solid rgba(255,255,255,0.50)"
                      : "1px solid rgba(0,0,0,0.28)",
                  }}>
                    {changed && (
                      <div style={{
                        position: "absolute", top: 1, right: 1,
                        width: 3, height: 3, borderRadius: "50%",
                        background: "rgba(255,255,255,0.9)",
                        pointerEvents: "none",
                      }} />
                    )}
                  </div>
                  <input type="color" defaultValue={hex}
                    title={show}
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      opacity: 0, cursor: "pointer", border: "none", padding: 0,
                    }}
                    onChange={e => setColorOverrides(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              );
            })}
          </div>

          {/* Changed count */}
          {changedKeys.length > 0 && (
            <div className="px-2.5 mt-2">
              <span className="text-[7px] uppercase tracking-[0.12em]"
                style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.24)" }}>
                {changedKeys.length} modified
              </span>
            </div>
          )}

          {/* Spacer + label */}
          <div className="flex-1" />
          <div className="px-2.5 pb-3">
            <span className="text-[7px] leading-[1.5] block"
              style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.14)" }}>
              Click any swatch to edit its color
            </span>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}

// ─── Step graphic components ──────────────────────────────────────────────────

function UploadGraphic({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 200, width: "100%" }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }} />
      <div style={{
        position: "relative",
        width: 210, height: 134,
        border: "1.5px dashed rgba(255,255,255,0.08)",
        borderRadius: 10,
        background: "rgba(255,255,255,0.012)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 10, left: 0, right: 0,
          textAlign: "center", fontSize: 7.5, letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.14)", fontFamily: "auxMono, monospace",
          textTransform: "uppercase",
        }}>Drop image here</div>

        {/* Animated file card */}
        <div style={{
          width: 68, height: 80,
          background: "#1e1e1e",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 6,
          boxShadow: "0 10px 28px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 5, position: "relative",
          animation: "stepFileFloat 3s ease-in-out infinite",
        }}>
          <div style={{
            position: "absolute", top: 0, right: 0, width: 14, height: 14,
            background: "#2a2a2a",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "0 6px 0 2px",
          }} />
          <CloudArrowUp size={20} weight="light" style={{ color: "rgba(255,255,255,0.55)", opacity: 0.88 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ fontSize: 6.5, letterSpacing: "0.12em", color: "rgba(255,255,255,0.32)", fontFamily: "auxMono, monospace", textTransform: "uppercase" }}>image.png</div>
            <div style={{ fontSize: 6, letterSpacing: "0.1em", color: "rgba(255,255,255,0.16)", fontFamily: "auxMono, monospace" }}>2.4 MB</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          position: "absolute", bottom: 11, left: 16, right: 16,
          height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.42) 100%)",
            animation: "stepProgressFill 3s ease-in-out infinite",
          }} />
        </div>
      </div>
    </div>
  );
}

function VectorizeGraphic({ color: _color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 200, width: "100%" }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }} />

      <div style={{ position: "relative", width: 222, height: 148, overflow: "hidden" }}>

        {/* ── LEFT: actual stairs.png with pixel-grid overlay ── */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 104, height: 148, overflow: "hidden" }}>
          <img
            src="/stairs.png"
            alt="source raster"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "35% 40%", display: "block", opacity: 0.88 }}
          />
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }} />
          <span style={{
            position: "absolute", bottom: 5, left: 6,
            fontSize: 6.5, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.18)", fontFamily: "auxMono, monospace",
          }}>raster</span>
        </div>

        {/* ── CENTER: arrow ── */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)", zIndex: 20,
          fontSize: 9, color: "rgba(255,255,255,0.14)",
          fontFamily: "auxMono, monospace",
          background: "#0d0d0d", padding: "2px 3px",
        }}>→</div>

        {/* ── RIGHT: vectorization animation ── */}
        <div style={{ position: "absolute", right: 0, top: 0, width: 106, height: 148, overflow: "hidden" }}>

          {/* Base: dark background */}
          <div style={{ position: "absolute", inset: 0, background: "#080808" }} />

          {/* ── Layer A: the REAL converted SVG — wipes in (Phase 3) then zooms (Phase 5) ── */}
          <img
            src="/vectors/stairs.svg"
            alt="vector result"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "35% 40%",
              display: "block",
              transformOrigin: "35% 40%",
              animation: "stairSvgAnim 7s cubic-bezier(0.4,0,0.2,1) infinite",
            }}
          />

          {/* ── Layer B: overlay SVG for Phase 1 (raster) + Phase 2 (scan) ── */}
          <svg width="106" height="148" viewBox="0 0 106 148" fill="none"
            style={{ position: "absolute", inset: 0, display: "block" }}>

            {/* Dark curtain — covers the real SVG during Phase 1 & 2 */}
            <rect width="106" height="148" fill="#080808"
              style={{ animation: "stairDarkCover 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />

            {/* Phase 1: staircase-shaped raster pixel cells */}
            {STAIR_CELLS.map((op, i) => {
              const col = i % 6;
              const row = Math.floor(i / 6);
              const cw = 106 / 6;
              const ch = 148 / 8;
              return (
                <rect key={`rc${i}`}
                  x={col * cw + 1} y={row * ch + 1}
                  width={cw - 2} height={ch - 2}
                  fill={`rgba(255,255,255,${op})`} rx="1"
                  style={{ animation: "stairRasterCell 7s cubic-bezier(0.4,0,0.2,1) infinite" }}
                />
              );
            })}
            {/* Grid lines */}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`gv${i}`} x1={i * (106 / 6)} y1="0" x2={i * (106 / 6)} y2="148"
                stroke="rgba(255,255,255,0.06)" strokeWidth="0.7"
                style={{ animation: "stairRasterCell 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`gh${i}`} x1="0" y1={i * (148 / 8)} x2="106" y2={i * (148 / 8)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="0.7"
                style={{ animation: "stairRasterCell 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
            ))}

            {/* Phase 2: scan line that sweeps across */}
            <line x1="0" y1="0" x2="0" y2="148"
              stroke="rgba(255,255,255,0.32)" strokeWidth="1.5"
              strokeLinecap="round"
              style={{ animation: "stairScanGlide 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
          </svg>

          {/* ── Layer C: wireframe paths overlay (Phase 4) + ∞ label (Phase 5) ── */}
          <svg width="106" height="148" viewBox="0 0 106 148" fill="none"
            style={{ position: "absolute", inset: 0, display: "block", pointerEvents: "none" }}>
            {/* Diagonal band polygon — stroke draws in via dashoffset */}
            <polygon
              points="46,4 104,20 62,144 4,128"
              fill="none"
              stroke="rgba(255,255,255,0.26)"
              strokeWidth="0.8"
              strokeDasharray="400"
              style={{ animation: "stairWireDraw 7s cubic-bezier(0.4,0,0.2,1) infinite" }}
            />
            {/* Stair tread dashed horizontal lines */}
            {([
              [35, 18.5, 88, 18.5],
              [17.7, 55.5, 70.7, 55.5],
              [0, 92.5, 53, 92.5],
            ] as [number, number, number, number][]).map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.18)" strokeWidth="0.65" strokeDasharray="3 2.5"
                style={{ opacity: 0, animation: "stairStepLine 7s cubic-bezier(0.4,0,0.2,1) infinite", animationDelay: `${i * 0.12}s`, animationFillMode: "backwards" }}
              />
            ))}
            {/* Anchor dots at band corners + long-side midpoints */}
            {([[46, 4], [104, 20], [62, 144], [4, 128], [83, 82], [25, 66]] as [number, number][]).map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="2"
                fill="#080808" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9"
                style={{ opacity: 0, animation: "stairVecDot 7s cubic-bezier(0.4,0,0.2,1) infinite", animationDelay: `${i * 0.05}s`, animationFillMode: "backwards" }} />
            ))}
            {/* Bezier handle lines from midpoint anchors */}
            <line x1="75" y1="70" x2="91" y2="94"
              stroke="rgba(255,255,255,0.13)" strokeWidth="0.6"
              style={{ opacity: 0, animation: "stairVecDot 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
            <line x1="17" y1="55" x2="33" y2="77"
              stroke="rgba(255,255,255,0.13)" strokeWidth="0.6"
              style={{ opacity: 0, animation: "stairVecDot 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
            {/* PATHS label — Phase 4 */}
            <text x="5" y="11" fontSize="5.5" fill="rgba(255,255,255,0.22)"
              style={{ fontFamily: "auxMono, monospace", letterSpacing: "0.22em", opacity: 0, animation: "stairVecLabel 7s cubic-bezier(0.4,0,0.2,1) infinite" }}>
              PATHS
            </text>
            {/* ∞ SCALABLE label — Phase 5 zoom */}
            <text x="53" y="143" textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.5)"
              style={{ fontFamily: "auxMono, monospace", letterSpacing: "0.15em", opacity: 0, animation: "stairScaleLabel 7s cubic-bezier(0.4,0,0.2,1) infinite" }}>
              ∞ SCALABLE
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

function ExportGraphic({ color }: { color: string }) {
  const formats = ["SVG", "AI", "Figma"] as const;
  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 200, width: "100%" }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
        {/* File card */}
        <div style={{
          width: 200,
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 9,
          padding: "12px 14px",
          boxShadow: "0 10px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)",
          animation: "stepExportFloat 3.6s ease-in-out infinite",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, background: "#242424",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <DownloadSimple size={13} weight="light" style={{ color: "rgba(255,255,255,0.55)", opacity: 0.88 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.52)", fontFamily: "auxMono, monospace", marginBottom: 2 }}>output</div>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.18)", fontFamily: "auxMono, monospace", letterSpacing: "0.08em" }}>14 KB · vector</div>
            </div>
          </div>
          {/* Format chips */}
          <div style={{ display: "flex", gap: 5 }}>
            {formats.map((fmt, i) => (
              <div key={fmt} style={{
                padding: "3px 8px", fontSize: 7, letterSpacing: "0.12em",
                fontFamily: "auxMono, monospace", textTransform: "uppercase", borderRadius: 3,
                border: `1px solid ${i === 0 ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.07)"}`,
                background: i === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                color: i === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
                animation: "stepChipFadeIn 3s ease-in-out infinite",
                animationDelay: `${i * 0.14}s`,
              }}>
                {fmt}
              </div>
            ))}
          </div>
        </div>
        {/* Download bar */}
        <div style={{ width: 200, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.42) 100%)",
            animation: "stepProgressFill 3s ease-in-out 0.5s infinite",
          }} />
        </div>
        <div style={{ fontSize: 7.5, letterSpacing: "0.18em", color: "rgba(255,255,255,0.16)", fontFamily: "auxMono, monospace", textTransform: "uppercase" }}>
          Ready to download
        </div>
      </div>
    </div>
  );
}

// ─── Icon Generation Demo (Coming Soon) ──────────────────────────────────────

const REF_ICON_PATHS = [
  "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",
  "M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM21 21l-4.35-4.35",
  "M12 2l8 4.5-8 4.5-8-4.5zM4 13l8 4.5 8-4.5M4 18l8 4.5 8-4.5",
  "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
];

type PandaPhase = "idle" | "searching" | "learning" | "generating" | "done";

const PIPELINE_STEPS: PandaPhase[] = ["searching", "learning", "generating", "done"];

function PandaIconDemo() {
  const [phase,    setPhase]    = useState<PandaPhase>("idle");
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if      (phase === "idle")       t = setTimeout(() => setPhase("searching"),  1000);
    else if (phase === "searching")  t = setTimeout(() => setPhase("learning"),   2600);
    else if (phase === "learning")   t = setTimeout(() => setPhase("generating"), 1600);
    else if (phase === "generating") t = setTimeout(() => setPhase("done"),       2400);
    else if (phase === "done")       t = setTimeout(() => { setPhase("idle"); setCycleKey(k => k + 1); }, 3200);
    return () => { if (t) clearTimeout(t); };
  }, [phase]);

  const stepIdx = PIPELINE_STEPS.indexOf(phase);

  return (
    <div style={{
      background: "#0b0b0b",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 4px 16px rgba(0,0,0,0.35)",
    }}>
      {/* macOS titlebar — desaturated */}
      <div style={{ height: 40, background: "#111", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 16px" }}>
        <div style={{ display: "flex", gap: 7 }}>
          {(["#3d3d3d","#3d3d3d","#3d3d3d"] as const).map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.18)" }}>
          icon-generator · panda
        </div>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: phase === "done" ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.15)",
          boxShadow: phase === "done" ? "0 0 6px rgba(255,255,255,0.3)" : "none",
          animation: "genStatusPulse 1.4s ease-in-out infinite",
          flexShrink: 0, transition: "background 0.4s, box-shadow 0.4s",
        }} />
      </div>

      <div style={{ padding: "14px 16px 18px" }}>
        {/* Prompt */}
        <div style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.40)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.50)", flex: 1 }}>
            "a panda icon"
          </span>
          <span style={{ fontSize: 12, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.30)", animation: "genCursor 1s step-end infinite" }}>▋</span>
        </div>

        {/* Style — static */}
        <div style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: 1, background: "rgba(255,255,255,0.20)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.55)", flex: 1 }}>Phosphor Duotone</span>
          <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.10)", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.08em" }}>duotone</span>
        </div>

        {/* Pipeline progress bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {phase === "idle" ? "ready" : phase === "searching" ? "searching web..." : phase === "learning" ? "learning style..." : phase === "generating" ? "generating..." : "✓ done"}
          </span>
          <div style={{ display: "flex", gap: 3 }}>
            {PIPELINE_STEPS.map((_, i) => (
              <div key={i} style={{ width: 20, height: 2, borderRadius: 1, background: stepIdx >= i ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
            ))}
          </div>
        </div>

        {/* Main display — key resets all animations on each cycle */}
        <div
          key={cycleKey}
          style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, minHeight: 210, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {/* Dot grid */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

          {/* ── idle ── */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: phase === "idle" ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none" }}>
            <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.10)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              awaiting input...
            </span>
          </div>

          {/* ── searching — mini browser with panda chrome.png ── */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: phase === "searching" ? 1 : 0, transition: "opacity 0.35s", pointerEvents: "none", padding: "12px 14px" }}>
            <div style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden" }}>
              {/* Browser chrome */}
              <div style={{ height: 26, background: "#151515", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 8px", gap: 5 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                </div>
                <div style={{ flex: 1, height: 14, background: "#0d0d0d", borderRadius: 3, display: "flex", alignItems: "center", padding: "0 6px" }}>
                  <span style={{ fontSize: 7, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.18)", whiteSpace: "nowrap", overflow: "hidden" }}>
                    images.google.com/search?q=panda+icon+phosphor+duotone
                  </span>
                </div>
              </div>
              {/* Image + scan */}
              <div style={{ position: "relative", overflow: "hidden", maxHeight: 108 }}>
                <img src="/panda chrome.png" alt="" style={{ width: "100%", display: "block", opacity: 0.50, objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.25)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.40), transparent)", boxShadow: "0 0 8px rgba(255,255,255,0.15)", top: 0, animation: "pandaSearchScan 2.4s ease-in-out forwards" }} />
              </div>
            </div>
            <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.18)", letterSpacing: "0.18em", textTransform: "uppercase", animation: "genStatusPulse 0.9s ease-in-out infinite" }}>
              scanning reference...
            </span>
          </div>

          {/* ── learning — ref icon grid (monochrome) ── */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: phase === "learning" ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none" }}>
            <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.20)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              learning phosphor style...
            </span>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 36px)", gap: 6 }}>
                {REF_ICON_PATHS.map((iconPath, i) => (
                  <div key={i} style={{ width: 36, height: 36, border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.025)", animation: phase === "learning" ? "genIconFlash 1.1s ease-in-out infinite" : "none", animationDelay: `${(i * 0.1).toFixed(2)}s` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d={iconPath} stroke="rgba(255,255,255,0.38)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.05)" opacity={0.7} />
                    </svg>
                  </div>
                ))}
              </div>
              {phase === "learning" && (
                <div style={{ position: "absolute", top: -4, bottom: -4, width: 2, left: 0, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.40), transparent)", boxShadow: "0 0 8px rgba(255,255,255,0.18)", animation: "genScanLine 1.5s ease-in-out forwards", borderRadius: 1 }} />
              )}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {[18, 30, 22, 26, 16].map((w, n) => (
                <div key={n} style={{ height: 2, width: w, borderRadius: 2, background: "rgba(255,255,255,0.18)", animation: "genStatusPulse 0.55s ease-in-out infinite", animationDelay: `${(n * 0.1).toFixed(2)}s` }} />
              ))}
            </div>
          </div>

          {/* ── generating — panda.svg sweep reveal ── */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: phase === "generating" ? 1 : 0, transition: "opacity 0.35s", pointerEvents: "none" }}>
            <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.20)", letterSpacing: "0.22em", textTransform: "uppercase", animation: "genStatusPulse 0.7s ease-in-out infinite" }}>
              drawing paths...
            </span>
            <div style={{ position: "relative", width: 96, height: 96, overflow: "hidden" }}>
              <img src="/panda.svg" alt="panda" style={{ width: 96, height: 96, objectFit: "contain", filter: "grayscale(100%) brightness(0.82)", animation: "pandaSvgReveal 2.2s cubic-bezier(0.4,0,0.2,1) forwards" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent)", animation: "pandaSearchScan 2.2s ease-in-out forwards" }} />
            </div>
            <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.14)", letterSpacing: "0.14em" }}>
              applying duotone style...
            </span>
          </div>

          {/* ── done ── */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: phase === "done" ? 1 : 0, transition: "opacity 0.5s", pointerEvents: "none" }}>
            <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.48)", letterSpacing: "0.18em", textTransform: "uppercase", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", padding: "2px 9px", borderRadius: 4 }}>
              ✓ SVG ready
            </span>
            <div style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,0.10))" }}>
              <img src="/panda.svg" alt="panda" style={{ width: 96, height: 96, objectFit: "contain", filter: "grayscale(100%) brightness(0.85) contrast(1.05)", opacity: 0.90 }} />
            </div>
            <span style={{ fontSize: 8, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em" }}>
              256px · phosphor duotone
            </span>
          </div>

          {phase === "done" && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 55%, rgba(255,255,255,0.04) 0%, transparent 60%)" }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LEGO cursor configs — 5 independent roaming highlights ───────────────────
const LEGO_CURSORS = [
  { phase: 0.0, freqX: 1.30, freqY: 0.70, speed: 1.00, color: "#f97316" }, // orange
  { phase: 1.8, freqX: 0.90, freqY: 1.50, speed: 0.75, color: "#22d3ee" }, // cyan
  { phase: 3.2, freqX: 1.70, freqY: 0.55, speed: 1.15, color: "#a3e635" }, // green
  { phase: 4.7, freqX: 0.65, freqY: 1.20, speed: 0.88, color: "#a855f7" }, // purple
  { phase: 2.1, freqX: 1.10, freqY: 1.85, speed: 1.05, color: "#ec4899" }, // pink
];

// ─── LEGO background — multi-color auto-animating ─────────────────────────────
function LegoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoTime  = useRef(0);
  const rafId     = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SS = 32; // stud spacing

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    resize();

    // Parse hex → rgb
    const h2r = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });

    // Scale a hex color brighter/darker by factor f
    const blend = (hex: string, f: number) => {
      const { r, g, b } = h2r(hex);
      const c = (v: number) => Math.min(255, Math.max(0, Math.round(v * f)));
      return `rgb(${c(r)},${c(g)},${c(b)})`;
    };

    // Draw a single stud cylinder at (x, y).
    // col = base block color (hex); studs are always derived from it via shading.
    const drawStud = (x: number, y: number, col: string) => {
      // Drop shadow
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.beginPath(); ctx.arc(x, y + 2.4, 7.6, 0, Math.PI * 2); ctx.fill();
      // Outer dark border ring (dark but still hued)
      ctx.fillStyle = blend(col, 0.55);
      ctx.beginPath(); ctx.arc(x, y, 7.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = blend(col, 0.68);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = blend(col, 0.82);
      ctx.beginPath(); ctx.arc(x, y, 6.7, 0, Math.PI * 2); ctx.fill();
      // Main stud surface (the color)
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, 6.4, 0, Math.PI * 2); ctx.fill();
      // Upper lighter rim (specular highlight)
      ctx.fillStyle = blend(col, 1.25);
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      // Mid recession — clearly darker but visibly hued
      ctx.fillStyle = blend(col, 0.82);
      ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = blend(col, 0.88);
      ctx.beginPath(); ctx.arc(x, y, 4.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = blend(col, 0.76);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = blend(col, 0.68);
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      // Center raised nub with shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 3; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 2.5;
      ctx.fillStyle = blend(col, 0.72);
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Arc specular highlight
      ctx.strokeStyle = "rgba(255,255,255,0.40)";
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(x, y - 0.1, 2.1, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    };

    const drawLego = () => {
      ctx.fillStyle = "#161516";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      autoTime.current += 0.007;
      const t = autoTime.current;

      // Compute active cells for all cursors: grid-key → color
      const activeCells = new Map<string, string>();
      for (const cur of LEGO_CURSORS) {
        const cx = canvas.width  * (0.5 + 0.42 * Math.sin(t * cur.freqX * cur.speed + cur.phase));
        const cy = canvas.height * (0.5 + 0.42 * Math.sin(t * cur.freqY * cur.speed + cur.phase + 1.0));
        const bx = Math.floor(cx / SS);
        const by = Math.floor(cy / SS);
        // 2×2 block per cursor
        for (let dx = 0; dx <= 1; dx++) {
          for (let dy = 0; dy <= 1; dy++) {
            const key = `${bx + dx},${by + dy}`;
            if (!activeCells.has(key)) activeCells.set(key, cur.color);
          }
        }
      }

      // Paint colored plates for highlighted cells
      for (const [key, color] of activeCells) {
        const [gx, gy] = key.split(",").map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(gx * SS, gy * SS, SS, SS);
      }

      // Draw every stud
      for (let x = 16; x < canvas.width; x += SS) {
        for (let y = 16; y < canvas.height; y += SS) {
          const gx = Math.round((x - 16) / SS);
          const gy = Math.round((y - 16) / SS);
          drawStud(x, y, activeCells.get(`${gx},${gy}`) ?? "#161516");
        }
      }

      // Grid lines
      ctx.strokeStyle = "#030303"; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.5;
      for (let x = 0; x < canvas.width; x += SS) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += SS) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const animate = () => { drawLego(); rafId.current = requestAnimationFrame(animate); };
    animate();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── VectorDrop Logo ──────────────────────────────────────────────────────────
function VectorDropLogo({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 9.32256L8.08064 8.13363L10.1613 9.32256L10.018 21.5092L12.1924 22.6517L16.4032 20.3202V17.8433L18.5829 16.5553L18.3848 2.08986L20.5645 1L22.8433 2.08986V16.7534L20.7131 17.8433V20.3202L18.5829 21.4811V23.788L12.2419 27.5529L9.96313 26.1784L7.98156 24.9832L6 23.788V9.32256Z" fill="white"/>
      <path d="M6 9.32256L8.08064 8.13363L10.1613 9.32256M6 9.32256L8.08064 10.5115M6 9.32256V23.788L7.98156 24.9832M10.1613 9.32256L8.08064 10.5115M10.1613 9.32256L10.018 21.5092M8.08064 10.5115L7.98156 24.9832M12.2419 27.5529L18.5829 23.788V21.3606M12.2419 27.5529L9.96313 26.1784M12.2419 27.5529L12.1924 22.6517M18.5829 18.9331L20.7131 17.8433M18.5829 18.9331V21.3606M18.5829 18.9331L16.4032 17.8433M22.8433 2.08986V16.7534L20.7131 17.8433M22.8433 2.08986L20.5645 3.08064M22.8433 2.08986L20.5645 1L18.3848 2.08986M20.5645 3.08064L18.3848 2.08986M20.5645 3.08064L20.7131 17.8433M18.3848 2.08986L18.5829 16.5553M20.7131 17.8433V20.3202L9.96313 26.1784M20.7131 17.8433L18.5829 16.5553M18.5829 16.5553L16.4032 17.8433M9.96313 26.1784L7.98156 24.9832M9.96313 26.1784L10.018 21.5092M7.98156 24.9832L12.1924 22.6517M16.4032 20.3202L18.5829 21.3606M16.4032 20.3202L12.1924 22.6517M16.4032 20.3202V17.8433M10.018 21.5092L12.1924 22.6517" stroke="#383838" strokeWidth="0.2"/>
    </svg>
  );
}

// ─── Quality Comparison — VectorDrop vs Other Tools ──────────────────────────
//
// Same VectorDrop logo silhouette, two qualities.
// Left half = VectorDrop (the 20 designed vertices, clean polygon).
// Right half = Other tools (~50 subdivided vertices with edge wobble).
// Desktop: drag the divider. Mobile: toggle the view.

const COMPARE_VB = 400;

// VectorDrop logo silhouette (from /public/vectordrop-logo.svg, viewBox 28×28)
// scaled to a 400×400 canvas (×400/28 ≈ ×14.286).
const LOGO_POINTS: ReadonlyArray<readonly [number, number]> = [
  [85.71, 133.18],  [115.44, 116.19], [145.16, 133.18], [143.11, 307.27],
  [174.18, 323.60], [234.33, 290.29], [234.33, 254.90], [265.47, 236.50],
  [262.64, 29.85],  [293.78, 14.28],  [326.33, 29.85],  [326.33, 239.34],
  [295.90, 254.90], [295.90, 290.29], [265.47, 306.87], [265.47, 339.83],
  [174.88, 393.61], [142.33, 374.00], [114.02, 356.97], [85.71, 339.83],
];

const SMOOTH_PATH_D =
  "M " + LOGO_POINTS.map(([x, y]) => `${x} ${y}`).join(" L ") + " Z";
const SMOOTH_ANCHORS: ReadonlyArray<readonly [number, number]> = LOGO_POINTS;

// Deterministic noisy outline — same silhouette, but each edge is subdivided
// into 2–4 pieces with each new vertex pushed perpendicular to the line by a
// small, stable "noise". Result: ~50 anchors with visibly jagged edges.
function buildNoisyPoints(): [number, number][] {
  const out: [number, number][] = [];
  let k = 0;
  for (let i = 0; i < LOGO_POINTS.length; i++) {
    const a = LOGO_POINTS[i];
    const b = LOGO_POINTS[(i + 1) % LOGO_POINTS.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py =  dx / len;

    // Original vertex with very small offset
    const baseN = Math.sin(k * 1.93) * 1.2 + Math.cos(k * 0.71) * 0.7;
    out.push([a[0] + baseN * px, a[1] + baseN * py]);
    k++;

    // 1–3 subdivisions per edge, proportional to length
    const subs = Math.max(1, Math.min(3, Math.round(len / 36)));
    for (let j = 1; j <= subs; j++) {
      const t = j / (subs + 1);
      const x = a[0] + dx * t;
      const y = a[1] + dy * t;
      const noise = Math.sin(k * 2.17) * 4.4 + Math.cos(k * 1.31) * 2.2;
      out.push([x + noise * px, y + noise * py]);
      k++;
    }
  }
  return out;
}

function SmoothShape({ accentColor, idSuffix }: { accentColor: string; idSuffix: string }) {
  return (
    <svg viewBox={`0 0 ${COMPARE_VB} ${COMPARE_VB}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <path d={SMOOTH_PATH_D} fill={`${accentColor}10`} />
      <motion.path
        d={SMOOTH_PATH_D}
        fill="none"
        stroke="rgba(255,255,255,0.88)"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
        viewport={{ once: true, margin: "-12%" }}
      />
      {SMOOTH_ANCHORS.map(([x, y], i) => (
        <motion.rect
          key={`smooth-${idSuffix}-${i}`}
          x={x - 4}
          y={y - 4}
          width={8}
          height={8}
          fill="#0e0e0e"
          stroke={accentColor}
          strokeWidth={1.2}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.45 + i * 0.09, duration: 0.34, ease: [0.4, 0, 0.2, 1] }}
          viewport={{ once: true, margin: "-12%" }}
          style={{ transformOrigin: `${x}px ${y}px`, transformBox: "fill-box" } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

function NoisyShape({ idSuffix }: { idSuffix: string }) {
  const points = useMemo(() => buildNoisyPoints(), []);
  const pathD = useMemo(
    () =>
      `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)} ` +
      points.slice(1).map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") +
      " Z",
    [points],
  );
  return (
    <svg viewBox={`0 0 ${COMPARE_VB} ${COMPARE_VB}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <path d={pathD} fill="rgba(255,255,255,0.025)" />
      <motion.path
        d={pathD}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.0}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
        viewport={{ once: true, margin: "-12%" }}
      />
      {points.map(([x, y], i) => (
        <motion.rect
          key={`noisy-${idSuffix}-${i}`}
          x={x - 3}
          y={y - 3}
          width={6}
          height={6}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={0.8}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.45 + i * 0.025, duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          viewport={{ once: true, margin: "-12%" }}
          style={{ transformOrigin: `${x}px ${y}px`, transformBox: "fill-box" } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

function CornerLabel({
  position,
  delay,
  children,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  delay: number;
  children: React.ReactNode;
}) {
  const cls = {
    "top-left":     "top-4 left-5 md:top-5 md:left-6",
    "top-right":    "top-4 right-5 md:top-5 md:right-6",
    "bottom-left":  "bottom-4 left-5 md:bottom-5 md:left-6",
    "bottom-right": "bottom-4 right-5 md:bottom-5 md:right-6",
  }[position];
  const fromY = position.startsWith("top") ? -4 : 4;
  return (
    <motion.div
      className={`absolute ${cls} text-[9.5px] uppercase tracking-[0.22em] pointer-events-none z-10`}
      style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.42)" }}
      initial={{ opacity: 0, y: fromY }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      viewport={{ once: true, margin: "-12%" }}
    >
      {children}
    </motion.div>
  );
}

function CaretMini({ dir }: { dir: "left" | "right" }) {
  return dir === "left" ? (
    <svg width={6} height={9} viewBox="0 0 6 9" fill="none" aria-hidden>
      <path d="M5 1 L1 4.5 L5 8" stroke="rgba(255,255,255,0.62)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width={6} height={9} viewBox="0 0 6 9" fill="none" aria-hidden>
      <path d="M1 1 L5 4.5 L1 8" stroke="rgba(255,255,255,0.62)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QualityCompareDesktop({ accentColor }: { accentColor: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState(false);

  const splitPct = useMotionValue(0.5);
  const dividerLeft = useTransform(splitPct, (p) => `${p * 100}%`);
  const vdClip = useTransform(splitPct, (p) => `inset(0 ${(1 - p) * 100}% 0 0)`);
  const accentLineWidth = useTransform(splitPct, (p) => `${p * 100}%`);

  const inView = useInView(triggerRef, { once: true, amount: 0.35 });

  // After paths/anchors land, slowly pan the divider to show both extremes
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => {
      animate(splitPct, [0.5, 0.74, 0.26, 0.5], {
        duration: 4.6,
        ease: [0.42, 0, 0.2, 1],
        times: [0, 0.36, 0.72, 1],
      });
    }, 1900);
    return () => clearTimeout(t);
  }, [inView, splitPct]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setDraggingHandle(true);
    const update = (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      splitPct.set(Math.max(0.06, Math.min(0.94, (clientX - rect.left) / rect.width)));
    };
    update(e.clientX);
    const move = (ev: PointerEvent) => update(ev.clientX);
    const up = () => {
      setDraggingHandle(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <div ref={triggerRef}>
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none"
        style={{
          aspectRatio: "16 / 9",
          background: "#0e0e0e",
          border: "1px dashed rgba(255,255,255,0.10)",
          touchAction: "none",
          cursor: draggingHandle ? "grabbing" : "ew-resize",
        }}
        onPointerDown={startDrag}
      >
        {/* Top accent — green over VectorDrop side, neutral over Other side */}
        <motion.div
          className="absolute top-0 left-0 h-px pointer-events-none"
          style={{ width: accentLineWidth, background: accentColor, opacity: 0.55 }}
        />
        <motion.div
          className="absolute top-0 right-0 h-px pointer-events-none"
          style={{ left: dividerLeft, background: "rgba(255,255,255,0.40)", opacity: 0.35 }}
        />

        {/* Dot grid (matches Vector Playground canvas) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Other shape — full canvas, underneath */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="aspect-square h-[78%] max-h-[440px]">
            <NoisyShape idSuffix="d" />
          </div>
        </div>

        {/* VectorDrop shape — clipped from the right by the divider */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ clipPath: vdClip, WebkitClipPath: vdClip as unknown as string }}
        >
          <div className="aspect-square h-[78%] max-h-[440px]">
            <SmoothShape accentColor={accentColor} idSuffix="d" />
          </div>
        </motion.div>

        {/* Annotations — max 2 per side */}
        <CornerLabel position="top-left"     delay={2.3}>Refined paths</CornerLabel>
        <CornerLabel position="bottom-left"  delay={2.45}>Fewer points</CornerLabel>
        <CornerLabel position="top-right"    delay={2.3}>More points</CornerLabel>
        <CornerLabel position="bottom-right" delay={2.45}>Irregular curves</CornerLabel>

        {/* Divider line */}
        <motion.div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: dividerLeft,
            width: 1,
            marginLeft: -0.5,
            background: "rgba(255,255,255,0.18)",
          }}
        />

        {/* Drag handle — minimal dashed pill with two carets */}
        <motion.div
          className="absolute top-1/2 z-20"
          style={{ left: dividerLeft, x: "-50%", y: "-50%" }}
          onPointerDown={(e) => { e.stopPropagation(); startDrag(e); }}
        >
          <div
            className="flex items-center justify-center gap-[5px] backdrop-blur-sm"
            style={{
              width: 38,
              height: 28,
              background: "rgba(14,14,14,0.92)",
              border: `1px dashed ${draggingHandle ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.30)"}`,
              cursor: draggingHandle ? "grabbing" : "grab",
              transition: "border-color 180ms ease",
            }}
          >
            <CaretMini dir="left" />
            <CaretMini dir="right" />
          </div>
        </motion.div>
      </div>

      {/* Hint */}
      <div
        className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.24em]"
        style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.24)" }}
      >
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor, opacity: 0.85 }} />
        Drag to compare
      </div>
    </div>
  );
}

function QualityCompareMobile({ accentColor }: { accentColor: string }) {
  const [view, setView] = useState<"vd" | "other">("vd");
  return (
    <div>
      {/* Toggle */}
      <div
        className="flex items-stretch mb-3"
        style={{ border: "1px dashed rgba(255,255,255,0.12)" }}
      >
        {([
          { key: "vd",    label: "VectorDrop", color: accentColor },
          { key: "other", label: "Other",      color: "rgba(255,255,255,0.55)" },
        ] as const).map((t, i) => {
          const active = view === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] uppercase tracking-[0.18em] transition-all"
              style={{
                fontFamily: "auxMono, monospace",
                color: active ? "#fff" : "rgba(255,255,255,0.32)",
                background: active ? "rgba(255,255,255,0.04)" : "transparent",
                borderLeft: i === 1 ? "1px dashed rgba(255,255,255,0.12)" : undefined,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: active ? t.color : "rgba(255,255,255,0.18)",
                  display: "inline-block",
                }}
              />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Single shape canvas */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          background: "#0e0e0e",
          border: "1px dashed rgba(255,255,255,0.10)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: view === "vd" ? accentColor : "rgba(255,255,255,0.40)",
            opacity: view === "vd" ? 0.55 : 0.35,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <motion.div
          key={view}
          className="absolute inset-0 flex items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="w-full max-w-[300px] aspect-square">
            {view === "vd"
              ? <SmoothShape accentColor={accentColor} idSuffix="m" />
              : <NoisyShape idSuffix="m" />}
          </div>
        </motion.div>

        {/* Two annotations — swap with view */}
        <div
          className="absolute top-3 left-4 text-[9px] uppercase tracking-[0.22em] pointer-events-none"
          style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.42)" }}
        >
          {view === "vd" ? "Refined paths" : "More points"}
        </div>
        <div
          className="absolute bottom-3 right-4 text-[9px] uppercase tracking-[0.22em] pointer-events-none"
          style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.42)" }}
        >
          {view === "vd" ? "Fewer points" : "Irregular curves"}
        </div>
      </div>
    </div>
  );
}

function QualityComparison({ accentColor }: { accentColor: string }) {
  return (
    <>
      <div className="hidden md:block"><QualityCompareDesktop accentColor={accentColor} /></div>
      <div className="block md:hidden"><QualityCompareMobile  accentColor={accentColor} /></div>
    </>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(22,21,22,0.95)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px dashed rgba(255,255,255,0.1)",
      }}
    >
      <div className="relative mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <VectorDropLogo size={18} />
          <span className="text-sm font-medium text-white">VectorDrop</span>
        </Link>
        <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.15em] transition-colors"
              style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.42)" }}
            >
              <LegoStud color={item.color} size={9} />
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-[10px] font-normal uppercase tracking-[0.04em] transition-all hover:opacity-75"
            style={{
              fontFamily: "auxMono, monospace",
              color: "rgba(255,255,255,0.62)",
              border: "1px dashed rgba(255,255,255,0.22)",
            }}
          >
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center bg-white gap-6 px-7 py-2 text-[11px] font-normal uppercase tracking-[0.02em] text-black transition-all hover:opacity-88"
            style={{ fontFamily: "auxMono, monospace" }}
          >
            Try for free <CaretRightIcon size={12} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "#161516", fontFamily: "'Helvetica Neue', Helvetica, sans-serif" }}
    >
      <style>{`
        @font-face {
          font-family: 'auxMono';
          src: url('/AuxMono-Regular.ttf') format('truetype');
          font-display: swap;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .anim-marquee { animation: marquee 28s linear infinite; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .a0 { opacity:0; animation:fadeUp 0.6s ease forwards; animation-delay:0.05s; }
        .a1 { opacity:0; animation:fadeUp 0.6s ease forwards; animation-delay:0.16s; }
        .a2 { opacity:0; animation:fadeUp 0.6s ease forwards; animation-delay:0.28s; }
        .a3 { opacity:0; animation:fadeUp 0.6s ease forwards; animation-delay:0.42s; }
        .a4 { opacity:0; animation:fadeUp 0.6s ease forwards; animation-delay:0.58s; }

        .why-card { transition: filter 0.2s ease; }
        .why-card:hover { filter: brightness(1.12); }

        @keyframes stepFileFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes stepProgressFill {
          0%, 4% { width: 0%; }
          70% { width: 82%; }
          90%, 100% { width: 82%; }
        }
        @keyframes stepScanLine {
          0% { transform: translateX(0); opacity: 0; }
          4% { opacity: 1; }
          94% { opacity: 1; }
          100% { transform: translateX(222px); opacity: 0; }
        }
        /* ── Stair conversion animation (7s loop) ── */

        /* Phase 1: Raster pixel grid — 0–25% visible, gone by 38% */
        @keyframes stairRasterCell {
          0%, 25% { opacity: 1; }
          38%, 100% { opacity: 0; }
        }

        /* Dark curtain — covers SVG during Phase 1 & 2, lifts in Phase 3 */
        @keyframes stairDarkCover {
          0%, 45%  { opacity: 1; }
          63%, 90% { opacity: 0; }
          100%     { opacity: 1; }
        }

        /* Phase 2: scan line glides left→right (25–52%) */
        @keyframes stairScanGlide {
          0%, 25%   { transform: translateX(0px);   opacity: 0; }
          29%       { opacity: 1; }
          52%       { transform: translateX(106px);  opacity: 1; }
          57%, 100% { transform: translateX(106px);  opacity: 0; }
        }

        /* Phase 3: SVG wipes in, Phase 5: zooms to demonstrate infinite crispness */
        @keyframes stairSvgAnim {
          0%, 47%   { clip-path: inset(0 100% 0 0); transform: scale(1);   opacity: 0; }
          50%       { clip-path: inset(0 80%  0 0); transform: scale(1);   opacity: 1; }
          63%       { clip-path: inset(0 0%   0 0); transform: scale(1);   opacity: 1; }
          76%       { clip-path: inset(0 0%   0 0); transform: scale(1);   opacity: 1; }
          83%, 91%  { clip-path: inset(0 0%   0 0); transform: scale(2.4); opacity: 1; }
          97%       { clip-path: inset(0 0%   0 0); transform: scale(2.4); opacity: 0; }
          100%      { clip-path: inset(0 100% 0 0); transform: scale(1);   opacity: 0; }
        }

        /* Phase 4: diagonal band polygon draws in via stroke-dashoffset */
        @keyframes stairWireDraw {
          0%, 61%  { stroke-dashoffset: 400; opacity: 0; }
          63%      { opacity: 1; }
          75%      { stroke-dashoffset: 0;   opacity: 1; }
          88%      { stroke-dashoffset: 0;   opacity: 1; }
          94%      { stroke-dashoffset: 0;   opacity: 0; }
          100%     { stroke-dashoffset: 400; opacity: 0; }
        }

        /* Phase 4: stair tread dashed lines fade in */
        @keyframes stairStepLine {
          0%, 64%   { opacity: 0; }
          72%, 87%  { opacity: 1; }
          94%, 100% { opacity: 0; }
        }

        /* Phase 4: anchor dots pop in */
        @keyframes stairVecDot {
          0%, 67%   { opacity: 0; transform: scale(0); }
          74%, 88%  { opacity: 1; transform: scale(1); }
          95%, 100% { opacity: 0; transform: scale(0.5); }
        }

        /* Phase 4: PATHS label */
        @keyframes stairVecLabel {
          0%, 70%   { opacity: 0; }
          76%, 87%  { opacity: 1; }
          94%, 100% { opacity: 0; }
        }

        /* Phase 5: ∞ SCALABLE label during zoom */
        @keyframes stairScaleLabel {
          0%, 78%   { opacity: 0; transform: scale(0.9) translateY(4px); }
          84%, 90%  { opacity: 1; transform: scale(1)   translateY(0px); }
          96%, 100% { opacity: 0; transform: scale(0.9) translateY(4px); }
        }
        @keyframes stepExportFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes stepChipFadeIn {
          0%, 5% { opacity: 0; transform: translateY(3px); }
          22%, 82% { opacity: 1; transform: translateY(0); }
          96%, 100% { opacity: 0; transform: translateY(3px); }
        }

        /* ── Icon Generation Demo ── */
        @keyframes genCursor {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes genIconFlash {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        @keyframes genScanLine {
          from { left: -2px; opacity: 0; }
          8%   { opacity: 1; }
          88%  { opacity: 1; }
          to   { left: 100%; opacity: 0; }
        }
        @keyframes genStatusPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes genDonePop {
          from { transform: scale(0.8); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes pandaSearchScan {
          from { top: -2px; opacity: 0; }
          8%   { opacity: 1; }
          88%  { opacity: 1; }
          to   { top: 100%; opacity: 0; }
        }
        @keyframes pandaSvgReveal {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0); }
        }
      `}</style>

      <Navbar />

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HERO — centered Cartesia-style layout
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "95vh" }}>

        {/* LEGO canvas — full width, covers top ~58% of hero, fades out */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: "58%" }}
        >
          <div className="relative w-full h-full overflow-hidden">
            <LegoBackground />
          </div>
          {/* Gradient fade to page bg */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "60%",
              background: "linear-gradient(to bottom, transparent 0%, #161516 100%)",
            }}
          />
           <div
            className="absolute inset-x-0 top-0"
            style={{
              height: "60%",
              background: "linear-gradient(to top, transparent 0%, #161516 100%)",
            }}
          />
         
          {/* Side vignettes */}
          <div
            className="absolute inset-y-0 left-0 w-32"
            style={{ background: "linear-gradient(to right, #161516, transparent)" }}
          />
          <div
            className="absolute inset-y-0 right-0 w-32"
            style={{ background: "linear-gradient(to left, #161516, transparent)" }}
          />
        </div>

        {/* Centered text content */}
        <div className="relative z-20 flex flex-col items-center text-center mx-auto max-w-[820px] px-6 pt-20 pb-10">
          <div className="a0">
            <SectionLabel text="Image to Vector Converter" color={C.cyan} />
          </div>
          <h1
            className="a1 mt-8 text-[3rem] md:text-[3.8rem] xl:text-[4.4rem] font-medium leading-[1.04] tracking-[-0.025em] text-white"
          >
            Turn any image into <br />editable vectors.
          </h1>
          <p
            className="a2 mt-6 text-[15px] leading-7 max-w-[480px]"
            style={{ color: "rgba(255,255,255,0.50)" }}
          >
            Upload a PNG, JPG, or WebP and get a crisp, editable vector in seconds.
            No Illustrator. No messy traces. No waiting.
          </p>
          <div className="a3 mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-white gap-6 px-7 py-2 text-[11px] font-normal uppercase tracking-[0.02em] text-black transition-all hover:opacity-88"
              style={{ fontFamily: "auxMono, monospace"}}
            >
              Convert image
              <CaretRightIcon size={12} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-6 px-7 py-2 text-[11px] font-normal uppercase tracking-[0.02em] transition-all hover:opacity-88"
              style={{
                fontFamily: "auxMono, monospace",
                border: "1px dashed rgba(255,255,255,0.22)",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              How it works
              <CaretRightIcon size={12} />
            </a>
          </div>
        </div>

        {/* Before / After panel — centered, floating below text */}
        <div className="relative z-20 mx-auto max-w-[860px] px-6 pb-0">
          <div className="a4">
            <VectorPlayground />
          </div>
        </div>

        {/* Marquee */}
        <div
          className="relative z-20 border-y overflow-hidden py-3 mt-10"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "#101010" }}
        >
          <div className="flex anim-marquee gap-14 whitespace-nowrap">
            {[...Array(2)].flatMap((_, ri) =>
              ["Lightning Fast","Clean SVG Output","Browser-Based","Export to Figma",
               "Illustrator Ready","Free to Try","Pixel-perfect Tracing","WebP Support"].map((f, i) => (
                <div key={`${ri}-${i}`} className="flex items-center gap-4">
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.30)" }}
                  >
                    {f}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: HOW IT WORKS
          — Feature rows: large visual left, text right (reference style)
      ═══════════════════════════════════════════════════════ */}
      <RailedSection id="how-it-works" accentColor={C.purple} className="py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-4">
            <SectionLabel text="How it works" color={C.purple} />
          </div>
          <div className="grid lg:grid-cols-3 gap-8 mb-20 items-end">
            <h2 className="text-[2.6rem] col-span-2 font-medium tracking-[-0.022em] text-white leading-[1.08]">
              From image to vectors in seconds
            </h2>
            {/* <p className="text-[15px] col-span-1 leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
              Three simple steps. No design skills needed.
            </p> */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="relative flex flex-col overflow-hidden"
                style={{
                  background: "#0e0e0e",
                  border: "1px dashed rgba(255,255,255,0.1)",
                }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: step.color, opacity: 0.5 }} />

                {/* Visual panel */}
                <div
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{ minHeight: 220 }}
                >
                  <span
                    className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.25em]"
                    style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.18)" }}
                  >
                    Step {step.num}
                  </span>
                  {step.num === "01" && <UploadGraphic color={step.color} />}
                  {step.num === "02" && <VectorizeGraphic color={step.color} />}
                  {step.num === "03" && <ExportGraphic color={step.color} />}
                </div>

                {/* Text panel */}
                <div className="flex flex-col p-7 pt-5 flex-1" style={{ borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <LegoStud color="rgba(255,255,255,0.22)" size={20} />
                    <h3 className="text-[1.35rem] font-bold text-white tracking-[-0.01em]">{step.title}</h3>
                  </div>
                  <p className="text-[14px] leading-6 mb-3" style={{ color: "rgba(255,255,255,0.47)" }}>
                    {step.description}
                  </p>
                  {/* <p className="text-[12px] leading-5" style={{ color: "rgba(255,255,255,0.27)" }}>
                    {step.detail}
                  </p> */}
                  <div
                    className="mt-5 inline-block text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 self-start"
                    style={{
                      fontFamily: "auxMono, monospace",
                      color: step.color,
                      border: `1px dashed ${step.color}60`,
                      background: `${step.color}0a`,
                    }}
                  >
                    {step.badge}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RailedSection>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: WHY VECTORDROP
          — Large solid colored cards (direct reference match)
      ═══════════════════════════════════════════════════════ */}
      <RailedSection
        id="why-us"
        accentColor={C.green}
        className="py-28"
        style={{ borderTop: "1px dashed rgba(255,255,255,0.07)" } as React.CSSProperties}
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-4">
            <SectionLabel text="Output quality" color={C.green} />
          </div>
          <div className="grid lg:grid-cols-3 gap-8 mb-14 items-end">
            <h2 className="col-span-2 text-[2.6rem] font-medium tracking-[-0.022em] text-white leading-[1.08]">
              Why choose VectorDrop
            </h2>
            <p className="text-[15px] leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
              Precision in every path, smoother curves, fewer anchor points,
              cleaner output. The difference is in the detail.
            </p>
          </div>

          <QualityComparison accentColor={C.green} />

          {/* Pricing strip — very low emphasis, editorial caption */}
          <div
            className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.20em]"
            style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.22)" }}
          >
            <span>Vector Magic $30/mo</span>
            <span aria-hidden style={{ color: "rgba(255,255,255,0.14)" }}>·</span>
            <span>Adobe $60/mo</span>
            <span aria-hidden style={{ color: "rgba(255,255,255,0.14)" }}>·</span>
            <span>Vectorizer.ai $14/mo</span>
            <span aria-hidden style={{ color: "rgba(255,255,255,0.14)" }}>·</span>
            <span style={{ color: "rgba(163,230,53,0.78)" }}>VectorDrop Free*</span>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-white gap-6 px-7 py-2 text-[11px] font-normal uppercase tracking-[0.02em] text-black transition-all hover:opacity-88"
              style={{ fontFamily: "auxMono, monospace" }}
            >
              Try VectorDrop
              <CaretRightIcon size={12} />
            </Link>
            <span
              className="text-[10px] uppercase tracking-[0.20em]"
              style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.32)" }}
            >
              Free to start
            </span>
          </div>
        </div>
      </RailedSection>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: ICON STYLE GENERATION (Coming soon)
      ═══════════════════════════════════════════════════════ */}
      <RailedSection
        id="icon-styles"
        accentColor={C.pink}
        className="py-28"
        style={{ borderTop: "1px dashed rgba(255,255,255,0.07)" } as React.CSSProperties}
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

            {/* Left: text */}
            <div>
              {/* Coming soon badge */}
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 px-[10px] py-[5px] text-[10px] tracking-[0.18em] uppercase leading-none"
                  style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)" }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.40)", display: "inline-block", animation: "genStatusPulse 1.4s ease-in-out infinite" }} />
                  Coming soon
                </span>
                <SectionLabel text="Icon generation" color={C.pink} />
              </div>

              <h2 className="text-[2.5rem] font-medium tracking-[-0.022em] text-white leading-[1.07] mb-5">
                Generate icons in<br />any design system style
              </h2>
              <p className="text-[15px] leading-7 mb-10 max-w-[420px]" style={{ color: "rgba(255,255,255,0.42)" }}>
                Describe any icon. VectorDrop learns your design system and generates a new icon that feels native.
              </p>
              

              {/* Pipeline steps */}
              <div className="flex flex-col gap-4 mb-10">
                {[
                  { num: "01", label: "Search", desc: "Find visual references" },
                  { num: "02", label: "Learn",  desc: "Extract design rules" },
                  { num: "03", label: "Generate", desc: "Create SVG output" },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-4">
                    <span style={{ fontSize: 9, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.20)", letterSpacing: "0.14em", flexShrink: 0, marginTop: 1 }}>
                      {step.num}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)", marginTop: 6, flexShrink: 0 }} />
                    <div className="text-right">
                      <div style={{ fontSize: 11, fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em", marginBottom: 1 }}>{step.label}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] px-5 py-2"
                style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.30)", border: "1px dashed rgba(255,255,255,0.12)" }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-block", animation: "genStatusPulse 1.2s ease-in-out infinite" }} />
                Notify me when it launches
              </div>
            </div>

            {/* Right: demo */}
            <div>
              <PandaIconDemo />
            </div>
          </div>
        </div>
      </RailedSection>

      {/* ═══════════════════════════════════════════════════════
          COMBINED CTA + FOOTER
      ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#161516", borderTop: "1px dashed rgba(255,255,255,0.07)" }}
      >
        {/* ── Rail lines (left + right) matching site-wide pattern ── */}
        <div
          className="hidden xl:block absolute left-[80px] top-0 bottom-0 w-px pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 3px, transparent 3px, transparent 6px)" }}
        />
        <div
          className="hidden xl:block absolute right-[80px] top-0 bottom-0 w-px pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 3px, transparent 3px, transparent 6px)" }}
        />

        {/* ── 1. CTA Block ── */}
        <div className="relative mx-auto max-w-[1280px] px-6 py-20">
          {/* Rail corner studs */}
          <div className="hidden xl:block absolute left-[80px] top-20 -translate-x-1/2"><LegoStud color={C.cyan} size={14} /></div>
          <div className="hidden xl:block absolute right-[80px] top-20 translate-x-1/2"><LegoStud color={C.cyan} size={14} /></div>

          <div
            className="relative overflow-hidden text-center px-8 py-24"
            style={{ background: "#0f0f10", border: "1px dashed rgba(255,255,255,0.12)" }}
          >

            {/* Corner LEGO studs — 4 corners */}
            <div className="absolute top-0 left-0"><LegoStud color={C.cyan} size={14} /></div>
            <div className="absolute top-0 right-0"><LegoStud color={C.cyan} size={14} /></div>
            <div className="absolute bottom-0 left-0"><LegoStud color={C.cyan} size={14} /></div>
            <div className="absolute bottom-0 right-0"><LegoStud color={C.cyan} size={14} /></div>

            {/* Mid-edge studs for extra Lego structure feel */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2"><LegoStud color={C.cyan} size={10} /></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2"><LegoStud color={C.cyan} size={10} /></div>

            <div className="relative">
              <SectionLabel text="Get started free" color={C.cyan} />
              <h2 className="mt-8 text-[2.8rem] md:text-[3.4rem] font-medium tracking-[-0.022em] text-white leading-[1.06]">
                Stop wasting time on<br />manual vector work
              </h2>
              <div className="mt-11">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center bg-white gap-6 px-7 py-2 text-[11px] font-normal uppercase tracking-[0.02em] text-black transition-all hover:opacity-88"
                  style={{ fontFamily: "auxMono, monospace" }}
                >
                  Convert now — it&apos;s free →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── 1b. Site links — pSEO hubs ── */}
        <SiteLinks />

        {/* ── 2. Footer content row ── */}
        <div
          className="relative mx-auto max-w-[1280px] px-6"
          style={{ borderTop: "1px dashed rgba(255,255,255,0.07)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
            {/* Left: logo + name + copyright */}
            <div className="flex items-center gap-3">
              <VectorDropLogo size={18} />
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                VectorDrop
              </span>
              <span
                className="hidden sm:inline text-[10px] uppercase tracking-[0.16em]"
                style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.18)", marginLeft: 6 }}
              >
                · © 2026
              </span>
            </div>

            {/* Center: Better Launch badge */}
            <div className="flex items-center gap-8">
              <a
                href="https://www.betterlaunch.co"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src="https://www.betterlaunch.co/badge-light.svg"
                  alt="Featured on Better Launch"
                  style={{ width: 200, height: "auto" }}
                />
              </a>
            </div>

            {/* Right: pricing + actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-[10px] font-normal uppercase tracking-[0.04em] transition-all hover:opacity-75"
                style={{
                  fontFamily: "auxMono, monospace",
                  color: "rgba(255,255,255,0.62)",
                  border: "1px dashed rgba(255,255,255,0.22)",
                }}
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3. Brand block — large VectorDrop watermark ── */}
        <div
          className="relative overflow-hidden select-none"
          style={{ borderTop: "1px dashed rgba(255,255,255,0.05)" }}
        >
          {/* Scattered Lego studs — like structural nodes of an invisible grid */}
          <div className="absolute left-[5%]  top-[28%]" style={{ opacity: 0.55 }}><LegoStud color={C.cyan}   size={10} /></div>
          <div className="absolute left-[12%] top-[58%]" style={{ opacity: 0.35 }}><LegoStud color={C.orange} size={8}  /></div>
          <div className="absolute left-[28%] top-[18%]" style={{ opacity: 0.28 }}><LegoStud color={C.green}  size={8}  /></div>
          <div className="absolute right-[6%]  top-[22%]" style={{ opacity: 0.50 }}><LegoStud color={C.purple} size={10} /></div>
          <div className="absolute right-[15%] top-[62%]" style={{ opacity: 0.32 }}><LegoStud color={C.cyan}   size={8}  /></div>
          <div className="absolute right-[32%] top-[70%]" style={{ opacity: 0.22 }}><LegoStud color={C.pink}   size={8}  /></div>

          {/* Large brand wordmark — logo mark + text together */}
          <div className="flex items-center justify-center gap-[0.04em] overflow-hidden pt-6 pb-10" style={{ lineHeight: 1 }}>
            {/* Integrated logo mark, sized to cap-height of the wordmark */}
            <div
              className="shrink-0 [&>svg]:w-full [&>svg]:h-full"
              style={{
                opacity: 0.038,
                marginBottom: "0.055em",
                alignSelf: "flex-end",
                width: "clamp(28px, 11.2vw, 168px)",
                height: "clamp(28px, 11.2vw, 168px)",
              }}
            >
              <VectorDropLogo size={168} />
            </div>

            {/* VectorDrop wordmark */}
            <span
              className="font-medium text-white leading-none"
              style={{
                fontFamily: "auxMono, monospace",
                fontSize: "clamp(30px, 12vw, 180px)",
                opacity: 0.038,
                letterSpacing: "-0.14em",
              }}
            >
              VectorDrop
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
