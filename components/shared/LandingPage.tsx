"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CloudArrowUp,
  DownloadSimple,
  BezierCurveIcon,
  FigmaLogo,
  Code,
  Palette,
  PaintBrushBroad,
  ShoppingCart,
  ShareNetwork,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { LogoMark } from "./Logo";
import { LegoStud } from "./LegoStud";
import { useEffect, useRef, useState } from "react";

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
  { label: "Use cases",    href: "#use-cases",    color: C.orange },
  { label: "Why us",       href: "#why-us",       color: C.green },
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
    description: "Intelligent tracing converts your raster into clean vector paths — no noise or jagged edges.",
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

const USE_CASES = [
  {
    title: "Logos",
    description: "Convert low-quality logos into scalable assets",
    icon: <Palette size={22} weight="light" />,
    color: C.orange,
  },
  {
    title: "UI/UX Design",
    description: "Turn images into editable vectors for Figma",
    icon: <FigmaLogo size={22} weight="light" />,
    color: C.purple,
  },
  {
    title: "Web Development",
    description: "Create lightweight SVGs for faster websites",
    icon: <Code size={22} weight="light" />,
    color: C.blue,
  },
  {
    title: "Print & Merchandise",
    description: "Get high-resolution vectors for t-shirts and posters",
    icon: <PaintBrushBroad size={22} weight="light" />,
    color: C.pink,
  },
  {
    title: "Icons",
    description: "Convert sketches into reusable icon sets",
    icon: <ShoppingCart size={22} weight="light" />,
    color: C.green,
  },
  {
    title: "Social Media",
    description: "Create sharp, scalable visuals for every platform",
    icon: <ShareNetwork size={22} weight="light" />,
    color: C.cyan,
  },
];

const WHY_CARDS = [
  {
    title: "No Illustrator Required",
    description: "Works entirely in your browser. No downloads, no app installs, no subscriptions.",
    cta: "Start converting →",
    href: "/dashboard",
    bgFrom: "#1e0f03",
    bgTo: "#2d1800",
    accentColor: C.orange,
  },
  {
    title: "No Login Needed",
    description: "Just drop an image and go. Your files stay private — nothing stored on our servers.",
    cta: "Try it now →",
    href: "/dashboard",
    bgFrom: "#130025",
    bgTo: "#1e0038",
    accentColor: C.purple,
  },
  {
    title: "Free Means Free",
    description: "No hidden charges, no credit card, no premium tier you'll hit on day one.",
    cta: "See the product →",
    href: "/dashboard",
    bgFrom: "#031409",
    bgTo: "#052212",
    accentColor: C.green,
  },
  {
    title: "Built for Speed",
    description: "From upload to SVG in seconds. We obsessed over every millisecond of performance.",
    cta: "Start converting →",
    href: "/dashboard",
    bgFrom: "#021218",
    bgTo: "#031e28",
    accentColor: C.cyan,
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
      {/* Left rail line */}
      <div
        className="hidden xl:block absolute left-[80px] top-0 bottom-0 w-px"
        style={{ background: "rgba(255,255,255,0.055)" }}
      />
      {/* Right rail line */}
      <div
        className="hidden xl:block absolute right-[80px] top-0 bottom-0 w-px"
        style={{ background: "rgba(255,255,255,0.055)" }}
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

// ─── Raster cell opacities for VectorizeGraphic (7×7 deterministic grid) ─────
const RASTER_CELLS = [
  0.18, 0.08, 0.13, 0.06, 0.15, 0.09, 0.11,
  0.06, 0.14, 0.07, 0.17, 0.05, 0.12, 0.08,
  0.13, 0.07, 0.16, 0.09, 0.11, 0.14, 0.06,
  0.08, 0.12, 0.06, 0.10, 0.13, 0.07, 0.15,
  0.15, 0.06, 0.11, 0.14, 0.08, 0.10, 0.07,
  0.07, 0.13, 0.09, 0.11, 0.06, 0.15, 0.12,
  0.10, 0.08, 0.14, 0.06, 0.12, 0.07, 0.09,
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
      <div className="flex" style={{ minHeight: 440 }}>

        {/* ── Left sidebar — thumbnails with mini color strips ── */}
        <div className="flex flex-col flex-shrink-0"
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
            style={{ background: "#0f0f0f", padding: "24px 20px" }}>
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
                <div className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: `calc(${progress * 100}% - 0.5px)`, width: 1,
                    background: "rgba(255,255,255,0.70)",
                    boxShadow: "0 0 10px rgba(255,255,255,0.25), 0 0 3px rgba(255,255,255,0.9)",
                  }} />
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
                    textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>SVG</span>
              </div>
            </div>
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
        <div className="flex flex-col flex-shrink-0 border-l"
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
          <CloudArrowUp size={20} weight="light" style={{ color, opacity: 0.88 }} />
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
            background: `linear-gradient(90deg, rgba(255,255,255,0.08) 0%, ${color} 100%)`,
            animation: "stepProgressFill 3s ease-in-out infinite",
          }} />
        </div>
      </div>
    </div>
  );
}

function VectorizeGraphic({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 200, width: "100%" }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }} />
      <div style={{ position: "relative", width: 220, height: 140, overflow: "hidden" }}>
        {/* Raster pixel grid – left */}
        <div style={{
          position: "absolute", left: 0, top: 10, width: 95, height: 120,
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridTemplateRows: "repeat(7, 1fr)",
          gap: 2, padding: 4,
        }}>
          {RASTER_CELLS.map((op, i) => (
            <div key={i} style={{ background: `rgba(255,255,255,${op})`, borderRadius: 1 }} />
          ))}
        </div>

        {/* Animated scan line */}
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: 0, width: 2,
          background: `linear-gradient(to bottom, transparent 5%, ${color}80 40%, ${color}cc 50%, ${color}80 60%, transparent 95%)`,
          animation: "stepScanLine 3s ease-in-out infinite",
          willChange: "transform",
        }} />

        {/* Vector paths – right */}
        <svg
          style={{ position: "absolute", right: 0, top: 10, width: 110, height: 120 }}
          viewBox="0 0 110 120" fill="none"
        >
          <path
            d="M 8 90 C 28 55, 55 72, 75 36 C 85 16, 100 26, 100 46"
            stroke="rgba(255,255,255,0.68)" strokeWidth="1.6" strokeLinecap="round"
            style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: "stepDrawPath 3s ease-in-out infinite" }}
          />
          <path
            d="M 8 108 C 40 100, 70 90, 102 80"
            stroke="rgba(255,255,255,0.20)" strokeWidth="1" strokeLinecap="round"
            style={{ strokeDasharray: 130, strokeDashoffset: 130, animation: "stepDrawPath 3s ease-in-out 0.4s infinite" }}
          />
          {/* Handle dashes */}
          <line x1="8" y1="90" x2="28" y2="55" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" strokeDasharray="2.5 2" />
          <line x1="75" y1="36" x2="55" y2="72" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" strokeDasharray="2.5 2" />
          {/* Anchor nodes */}
          <circle cx="8" cy="90" r="3" fill="#0e0e0e" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
          <circle cx="75" cy="36" r="3" fill="#0e0e0e" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
          <circle cx="100" cy="46" r="3" fill="#0e0e0e" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
        </svg>

        {/* Arrow divider */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 10, color: "rgba(255,255,255,0.14)",
          fontFamily: "auxMono, monospace", zIndex: 2,
          background: "#0e0e0e", padding: "2px 4px",
        }}>→</div>
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
              <DownloadSimple size={13} weight="light" style={{ color, opacity: 0.88 }} />
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
                border: `1px solid ${i === 0 ? `${color}55` : "rgba(255,255,255,0.07)"}`,
                background: i === 0 ? `${color}10` : "rgba(255,255,255,0.03)",
                color: i === 0 ? color : "rgba(255,255,255,0.25)",
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
            background: `linear-gradient(90deg, rgba(255,255,255,0.08) 0%, ${color} 100%)`,
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

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/[0.07]"
      style={{ background: "rgba(22,21,22,0.95)", backdropFilter: "blur(18px)" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={18} />
          <span className="text-sm font-semibold text-white tracking-tight">VectorDrop</span>
        </Link>
        <div className="hidden md:flex items-center">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors"
              style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.42)" }}
            >
              <LegoStud color={item.color} size={10} />
              {item.label}
            </a>
          ))}
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center bg-white gap-6 px-7 py-2 text-[11px] font-normal uppercase tracking-[0.02em] text-black transition-all hover:opacity-88"
          style={{ fontFamily: "auxMono, monospace" }}
        >
          Try for free <CaretRightIcon size={12} />
        </Link>
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
        @keyframes stepDrawPath {
          0%, 3% { stroke-dashoffset: 200; opacity: 0; }
          8% { opacity: 1; }
          68% { stroke-dashoffset: 0; opacity: 1; }
          90%, 100% { stroke-dashoffset: 0; opacity: 0.6; }
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
            <SectionLabel text="Image to SVG Converter" color={C.cyan} />
          </div>
          <h1
            className="a1 mt-8 text-[3rem] md:text-[3.8rem] xl:text-[4.4rem] font-bold leading-[1.04] tracking-[-0.025em] text-white"
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
                border: "1px solid rgba(255,255,255,0.18)",
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
              ["Lightning Fast","Clean SVG Output","No Login Required","Export to Figma",
               "Illustrator Ready","Free Forever","Pixel-perfect Tracing","WebP Support"].map((f, i) => (
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
          <div className="grid lg:grid-cols-2 gap-8 mb-20 items-end">
            <h2 className="text-[2.6rem] font-bold tracking-[-0.022em] text-white leading-[1.08]">
              From image to SVG in seconds
            </h2>
            <p className="text-[15px] leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
              Three simple steps. No design skills needed.
            </p>
          </div>

          <div>
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="grid lg:grid-cols-2 gap-0"
                style={{ borderColor: "rgba(255,255,255,0.07)", paddingTop: 52, paddingBottom: 52 }}
              >
                {/* Visual panel */}
                <div
                  className="relative flex items-center justify-center lg:mr-8 overflow-hidden"
                  style={{
                    background: "#0e0e0e",
                    border: "1px solid rgba(255,255,255,0.07)",
                    minHeight: 260,
                  }}
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
                <div className="flex flex-col justify-center pl-0 lg:pl-12 pt-8 lg:pt-0">
                  <div className="flex items-center gap-3 mb-5">
                    <LegoStud color="rgba(255,255,255,0.22)" size={20} />
                    <h3 className="text-[1.7rem] font-bold text-white tracking-[-0.01em]">{step.title}</h3>
                  </div>
                  <p className="text-[15px] leading-7 mb-3 max-w-[370px]" style={{ color: "rgba(255,255,255,0.47)" }}>
                    {step.description}
                  </p>
                  <p className="text-[13px] leading-6 max-w-[360px]" style={{ color: "rgba(255,255,255,0.27)" }}>
                    {step.detail}
                  </p>
                  <div
                    className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border self-start"
                    style={{
                      fontFamily: "auxMono, monospace",
                      color: step.color,
                      borderColor: `${step.color}40`,
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
          SECTION 3: USE CASES
      ═══════════════════════════════════════════════════════ */}
      <RailedSection
        id="use-cases"
        accentColor={C.blue}
        className="py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties}
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-4">
            <SectionLabel text="Use cases" color={C.blue} />
          </div>
          <div className="grid lg:grid-cols-2 gap-8 mb-16 items-end">
            <h2 className="text-[2.6rem] font-bold tracking-[-0.022em] text-white leading-[1.08]">
              Made for real design workflows
            </h2>
            <p className="text-[15px] leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
              If it's an image, you can vectorize it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="relative overflow-hidden p-7 transition-all"
                style={{ background: "#111011", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: uc.color, opacity: 0.5 }} />
                {/* Micro corner LEGO stud */}
                <div className="absolute top-2 right-2 opacity-60">
                  <LegoStud color={uc.color} size={10} />
                </div>

                <div
                  className="flex h-10 w-10 items-center justify-center border mb-5"
                  style={{ borderColor: `${uc.color}38`, color: uc.color, background: `${uc.color}0d` }}
                >
                  {uc.icon}
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <LegoStud color={uc.color} size={14} />
                  <h3 className="text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.90)" }}>
                    {uc.title}
                  </h3>
                </div>
                <p className="text-sm leading-6 pl-[22px]" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </RailedSection>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: WHY VECTORDROP
          — Large solid colored cards (direct reference match)
      ═══════════════════════════════════════════════════════ */}
      <RailedSection
        id="why-us"
        accentColor={C.green}
        className="py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties}
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <h2 className="text-[2.6rem] font-bold tracking-[-0.022em] text-white mb-5">
            Why VectorDrop?
          </h2>
          <p className="text-[15px] leading-7 max-w-[480px] mb-14" style={{ color: "rgba(255,255,255,0.43)" }}>
            We built VectorDrop because the tools that existed were either too heavy, too expensive, or simply didn't produce good output. So we stripped everything back.
          </p>

          {/* 2×2 large colored card grid — direct reference match */}
          <div className="grid md:grid-cols-2 gap-4">
            {WHY_CARDS.map((card) => (
              <div
                key={card.title}
                className="why-card relative overflow-hidden p-10 border"
                style={{
                  background: `linear-gradient(135deg,${card.bgFrom} 0%,${card.bgTo} 100%)`,
                  borderColor: `${card.accentColor}28`,
                }}
              >
                {/* Right-side glow */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at right,${card.accentColor}1a,transparent 70%)` }}
                />
                {/* Wireframe geometric decoration — matching reference 3D wireframe aesthetic */}
                <svg
                  className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ opacity: 0.16 }}
                  width="116"
                  height="116"
                  viewBox="0 0 120 120"
                  fill="none"
                >
                  <rect x="18" y="18" width="60" height="60" stroke={card.accentColor} strokeWidth="1" />
                  <rect x="34" y="34" width="60" height="60" stroke={card.accentColor} strokeWidth="1" />
                  <line x1="18" y1="18" x2="34" y2="34" stroke={card.accentColor} strokeWidth="1" />
                  <line x1="78" y1="18" x2="94" y2="34" stroke={card.accentColor} strokeWidth="1" />
                  <line x1="18" y1="78" x2="34" y2="94" stroke={card.accentColor} strokeWidth="1" />
                  <line x1="78" y1="78" x2="94" y2="94" stroke={card.accentColor} strokeWidth="1" />
                  {([
                    [18,18],[78,18],[18,78],[78,78],
                    [34,34],[94,34],[34,94],[94,94],
                  ] as [number,number][]).map(([x,y],i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill={card.accentColor} />
                  ))}
                </svg>

                <div className="relative z-10">
                  <h3 className="text-[1.45rem] font-bold text-white leading-tight max-w-[260px] mb-4">
                    {card.title}
                  </h3>
                  <p className="text-[14px] leading-6 mb-8 max-w-[280px]" style={{ color: "rgba(255,255,255,0.50)" }}>
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] px-4 py-2 border transition-all hover:opacity-75"
                    style={{
                      fontFamily: "auxMono, monospace",
                      color: card.accentColor,
                      borderColor: `${card.accentColor}50`,
                    }}
                  >
                    {card.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p
            className="mt-10 text-sm border-l-2 pl-4"
            style={{ color: "rgba(255,255,255,0.25)", borderColor: C.green }}
          >
            "Built for speed and simplicity — not complexity."
          </p>
        </div>
      </RailedSection>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <RailedSection
        accentColor={C.cyan}
        className="py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties}
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div
            className="relative overflow-hidden text-center px-10 py-24"
            style={{ background: "#0f0f10", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            {/* Cyan top glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top,rgba(34,211,238,0.1),transparent 70%)" }}
            />
            {/* Corner LEGO studs — 4 corners of CTA block */}
            <div className="absolute top-0 left-0"><LegoStud color={C.cyan} size={14} /></div>
            <div className="absolute top-0 right-0"><LegoStud color={C.cyan} size={14} /></div>
            <div className="absolute bottom-0 left-0"><LegoStud color={C.cyan} size={14} /></div>
            <div className="absolute bottom-0 right-0"><LegoStud color={C.cyan} size={14} /></div>

            <div className="relative">
              <SectionLabel text="Get started free" color={C.cyan} />
              <h2 className="mt-8 text-[2.8rem] md:text-[3.4rem] font-bold tracking-[-0.022em] text-white leading-[1.06]">
                Stop wasting time on<br />manual vector work
              </h2>
              <p className="mt-5 text-[15px] max-w-[380px] mx-auto" style={{ color: "rgba(255,255,255,0.44)" }}>
                Upload your image and get a clean SVG in seconds
              </p>
              <div className="mt-11">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center bg-white gap-6 px-7 py-2 text-[11px] font-normal uppercase tracking-[0.02em] text-black transition-all hover:opacity-88"
                  style={{ fontFamily: "auxMono, monospace" }}
                >
                  Convert now — it's free →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RailedSection>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer
        className="border-t py-10"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0e0d0e" }}
      >
        <div className="mx-auto max-w-[1280px] px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <LogoMark size={18} />
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.70)" }}>
              VectorDrop
            </span>
          </div>
          <div className="flex items-center gap-8">
            {[{ label: "Sign in", href: "/login" }, { label: "Dashboard", href: "/dashboard" }].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[11px] uppercase tracking-[0.18em] transition-colors"
                style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.30)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.20)" }}
          >
            © 2026 VectorDrop
          </p>
        </div>
      </footer>
    </main>
  );
}
