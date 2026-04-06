"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

/* ─── Tokens — exact match with LandingPage.tsx ─────────────────────────────
   background:     #161516
   surface:        #0d0d0d
   surface-raised: #1a1a1a
   border:         rgba(255,255,255,0.08)
   border-dashed:  rgba(255,255,255,0.18)
   text-primary:   #ffffff
   text-secondary: rgba(255,255,255,0.50)
   text-muted:     rgba(255,255,255,0.28)
   font-ui:        'Helvetica Neue', Helvetica, sans-serif
   font-mono:      auxMono, monospace
   btn-primary:    bg #fff, text #000, no radius, uppercase, auxMono 11px tracking-[0.02em]
   btn-ghost:      border 1px dashed rgba(255,255,255,0.22), same type/size
   card radius:    14px (surface), 8px (inner)
──────────────────────────────────────────────────────────────────────────── */

const PAGE_BG   = "#161516";
const SURFACE   = "#0d0d0d";
const SURFACE2  = "#131313";
const BORDER    = "rgba(255,255,255,0.08)";
// BORDER_D intentionally unused — kept for token reference
// const BORDER_D = "rgba(255,255,255,0.18)";
const TEXT_PRI  = "#ffffff";
const TEXT_SEC  = "rgba(255,255,255,0.50)";
const TEXT_MUT  = "rgba(255,255,255,0.28)";
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_MONO = "auxMono, monospace";

/* ─── Inline LEGO stud — same as LegoStud component, no import needed ───────── */
function LegoStudInline({ color, size = 12 }: { color: string; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.30;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill={color} />
      <rect x={size - size * 0.09} y={0} width={size * 0.09} height={size} fill="rgba(0,0,0,0.38)" />
      <rect x={0} y={size - size * 0.09} width={size} height={size * 0.09} fill="rgba(0,0,0,0.32)" />
      <rect x={0} y={0} width={size} height={size * 0.07} fill="rgba(255,255,255,0.14)" />
      <rect x={0} y={0} width={size * 0.07} height={size} fill="rgba(255,255,255,0.10)" />
      <circle cx={cx} cy={cy + r * 0.38} r={r + size * 0.06} fill="rgba(0,0,0,0.45)" />
      <circle cx={cx} cy={cy} r={r + size * 0.04} fill="rgba(0,0,0,0.30)" />
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy - r * 0.08} r={r * 0.82} fill="rgba(255,255,255,0.18)" />
      <circle cx={cx} cy={cy} r={r * 0.60} fill="rgba(0,0,0,0.18)" />
      <circle cx={cx} cy={cy} r={r * 0.44} fill="rgba(0,0,0,0.26)" />
      <circle cx={cx} cy={cy} r={r * 0.30} fill="rgba(255,255,255,0.06)" />
      <path
        d={`M ${cx - r * 0.42} ${cy - r * 0.52} A ${r * 0.58} ${r * 0.58} 0 0 1 ${cx + r * 0.42} ${cy - r * 0.52}`}
        stroke="rgba(255,255,255,0.28)" strokeWidth={size * 0.045} fill="none" strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Staircase raster pixel grid — exact copy from LandingPage.tsx ─────────
   Diagonal band of alternating bright/dark stripes. Even rows = bright stripe. */
const STAIR_CELLS = [
  0.03, 0.03, 0.60, 0.60, 0.60, 0.03,
  0.03, 0.03, 0.05, 0.05, 0.05, 0.03,
  0.03, 0.60, 0.60, 0.60, 0.03, 0.03,
  0.03, 0.05, 0.16, 0.05, 0.03, 0.03,
  0.60, 0.60, 0.60, 0.03, 0.03, 0.03,
  0.05, 0.05, 0.05, 0.03, 0.03, 0.03,
  0.42, 0.42, 0.03, 0.03, 0.03, 0.03,
  0.05, 0.05, 0.03, 0.03, 0.03, 0.03,
];

/* ─── Conversion demo — styled to match landing VectorPlayground ───────────── */

const STEPS = [
  { label: "Upload",    desc: "image.png" },
  { label: "Normalize", desc: "resize + blur" },
  { label: "Trace",     desc: "vector paths" },
  { label: "Assemble",  desc: "output.svg" },
];

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function MockConversionDemo() {
  const [step, setStep]       = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setStep(0); setProgress(0); setDone(false);
      await delay(700);
      for (let s = 0; s < STEPS.length; s++) {
        if (cancelled) return;
        setStep(s);
        const start = (s / STEPS.length) * 100;
        const end   = ((s + 1) / STEPS.length) * 100;
        for (let p = start; p <= end; p += 1.5) {
          if (cancelled) return;
          setProgress(Math.round(p));
          await delay(55);
        }
      }
      if (!cancelled) { setDone(true); setProgress(100); }
      await delay(2200);
      if (!cancelled) void run();
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{
      background:   SURFACE,
      border:       `1px solid ${BORDER}`,
      borderRadius: 14,
      overflow:     "hidden",
      boxShadow:    "0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)",
      fontFamily:   FONT_BODY,
    }}>
      {/* macOS titlebar */}
      <div style={{
        height:       40,
        background:   SURFACE2,
        borderBottom: `1px solid ${BORDER}`,
        display:      "flex",
        alignItems:   "center",
        padding:      "0 14px",
        gap:          8,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, fontFamily: FONT_MONO, color: TEXT_MUT }}>
          image.png → vector.svg
        </div>
        {done && (
          <span style={{
            fontSize:    9,
            fontFamily:  FONT_MONO,
            color:       "rgba(255,255,255,0.45)",
            border:      `1px solid rgba(255,255,255,0.14)`,
            padding:     "1px 7px",
            borderRadius: 3,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            ✓ done
          </span>
        )}
      </div>

      {/* Step pills */}
      <div style={{
        display:   "flex",
        alignItems:"center",
        gap:       4,
        padding:   "8px 12px",
        borderBottom: `1px solid ${BORDER}`,
        overflow:  "hidden",
      }}>
        {STEPS.map((s, i) => {
          const isActive = i === step && !done;
          const isDone   = done || i < step;
          return (
            <div
              key={s.label}
              style={{
                display:        "inline-flex",
                alignItems:     "center",
                justifyContent: "center",
                height:         20,
                padding:        "0 6px",
                whiteSpace:     "nowrap",
                fontSize:       8.5,
                fontFamily:     FONT_MONO,
                letterSpacing:  "0.06em",
                textTransform:  "uppercase",
                flexShrink:     0,
                background:     isDone
                  ? "rgba(255,255,255,0.07)"
                  : isActive
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                border:         `1px solid ${isDone
                  ? "rgba(255,255,255,0.18)"
                  : isActive
                    ? "rgba(255,255,255,0.14)"
                    : "rgba(255,255,255,0.05)"}`,
                borderRadius:   2,
                color:          isDone
                  ? "rgba(255,255,255,0.55)"
                  : isActive
                    ? "rgba(255,255,255,0.45)"
                    : TEXT_MUT,
                transition:     "all 0.35s ease",
              }}
            >
              {`${isDone ? "✓ " : isActive ? "· " : ""}${s.label}`}
            </div>
          );
        })}
      </div>

      {/* Central graphic — staircase raster → vector (exact VectorizeGraphic from LandingPage) */}
      <div style={{
        position:   "relative",
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:    "12px 0 8px",
        overflow:   "hidden",
      }}>
        {/* Dot grid background — same as landing page graphics */}
        <div style={{
          position:  "absolute",
          inset:     0,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize:  "18px 18px",
        }} />

        {/* Scale the 222px graphic to fill 100% of available card width */}
        <div style={{ width: "100%", overflow: "hidden", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 222, height: 148, overflow: "hidden", flexShrink: 0, transform: "scale(0.97)", transformOrigin: "center center" }}>

          {/* ── LEFT: stairs.png with pixel-grid overlay ── */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 104, height: 148, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/stairs.png"
              alt="source raster"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "35% 40%", display: "block", opacity: 0.88 }}
            />
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize:  "8px 8px",
            }} />
            <span style={{
              position: "absolute", bottom: 5, left: 6,
              fontSize: 6.5, letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)", fontFamily: FONT_MONO,
            }}>raster</span>
          </div>

          {/* ── CENTER: arrow ── */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)", zIndex: 20,
            fontSize: 9, color: "rgba(255,255,255,0.14)",
            fontFamily: FONT_MONO,
            background: "#0d0d0d", padding: "2px 3px",
          }}>→</div>

          {/* ── RIGHT: vectorization animation ── */}
          <div style={{ position: "absolute", right: 0, top: 0, width: 106, height: 148, overflow: "hidden" }}>

            {/* Base: dark background */}
            <div style={{ position: "absolute", inset: 0, background: "#080808" }} />

            {/* Layer A: converted SVG — wipes in (Phase 3) then zooms (Phase 5) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

            {/* Layer B: overlay SVG for Phase 1 (raster pixel grid) + Phase 2 (scan line) */}
            <svg width="106" height="148" viewBox="0 0 106 148" fill="none"
              style={{ position: "absolute", inset: 0, display: "block" }}>
              {/* Dark curtain covers the real SVG during Phase 1 & 2 */}
              <rect width="106" height="148" fill="#080808"
                style={{ animation: "stairDarkCover 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
              {/* Phase 1: staircase raster pixel cells */}
              {STAIR_CELLS.map((op, i) => {
                const col = i % 6;
                const row = Math.floor(i / 6);
                const cw  = 106 / 6;
                const ch  = 148 / 8;
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
              {/* Phase 2: scan line sweeps across */}
              <line x1="0" y1="0" x2="0" y2="148"
                stroke="rgba(255,255,255,0.32)" strokeWidth="1.5" strokeLinecap="round"
                style={{ animation: "stairScanGlide 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
            </svg>

            {/* Layer C: wireframe paths overlay (Phase 4) + ∞ SCALABLE label (Phase 5) */}
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
              {/* Anchor dots */}
              {([[46, 4], [104, 20], [62, 144], [4, 128], [83, 82], [25, 66]] as [number, number][]).map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="2"
                  fill="#080808" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9"
                  style={{ opacity: 0, animation: "stairVecDot 7s cubic-bezier(0.4,0,0.2,1) infinite", animationDelay: `${i * 0.05}s`, animationFillMode: "backwards" }} />
              ))}
              {/* Bezier handle lines */}
              <line x1="75" y1="70" x2="91" y2="94"
                stroke="rgba(255,255,255,0.13)" strokeWidth="0.6"
                style={{ opacity: 0, animation: "stairVecDot 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
              <line x1="17" y1="55" x2="33" y2="77"
                stroke="rgba(255,255,255,0.13)" strokeWidth="0.6"
                style={{ opacity: 0, animation: "stairVecDot 7s cubic-bezier(0.4,0,0.2,1) infinite" }} />
              {/* PATHS label */}
              <text x="5" y="11" fontSize="5.5" fill="rgba(255,255,255,0.22)"
                style={{ fontFamily: FONT_MONO, letterSpacing: "0.22em", opacity: 0, animation: "stairVecLabel 7s cubic-bezier(0.4,0,0.2,1) infinite" }}>
                PATHS
              </text>
              {/* ∞ SCALABLE label */}
              <text x="53" y="143" textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.5)"
                style={{ fontFamily: FONT_MONO, letterSpacing: "0.15em", opacity: 0, animation: "stairScaleLabel 7s cubic-bezier(0.4,0,0.2,1) infinite" }}>
                ∞ SCALABLE
              </text>
            </svg>
          </div>
        </div>
        </div>

      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 8, fontFamily: FONT_MONO, color: TEXT_MUT, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {done ? "vector ready" : `${STEPS[step]?.desc ?? "processing"}…`}
          </span>
          <span style={{ fontSize: 8, fontFamily: FONT_MONO, color: "rgba(255,255,255,0.38)", fontVariantNumeric: "tabular-nums" }}>
            {progress}%{done ? " ✓" : ""}
          </span>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height:     "100%",
            width:      `${progress}%`,
            background: done
              ? "rgba(255,255,255,0.45)"
              : "linear-gradient(90deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.42) 100%)",
            transition: "width 0.3s ease, background 0.45s ease",
            borderRadius: 2,
          }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function LoginPage() {
  return (
    <>
      {/* auxMono font face — same as LandingPage */}
      <style>{`
        @font-face {
          font-family: 'auxMono';
          src: url('/AuxMono-Regular.ttf') format('truetype');
          font-display: swap;
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .lp-a0 { opacity:0; animation:fadeUp 0.55s ease forwards; animation-delay:0.05s; }
        .lp-a1 { opacity:0; animation:fadeUp 0.55s ease forwards; animation-delay:0.16s; }
        .lp-a2 { opacity:0; animation:fadeUp 0.55s ease forwards; animation-delay:0.28s; }
        .lp-a3 { opacity:0; animation:fadeUp 0.55s ease forwards; animation-delay:0.40s; }

        /* ── Stair conversion animation (7s loop) — exact copy from LandingPage.tsx ── */
        @keyframes stairRasterCell {
          0%, 25% { opacity: 1; }
          38%, 100% { opacity: 0; }
        }
        @keyframes stairDarkCover {
          0%, 45%  { opacity: 1; }
          63%, 90% { opacity: 0; }
          100%     { opacity: 1; }
        }
        @keyframes stairScanGlide {
          0%, 25%   { transform: translateX(0px);   opacity: 0; }
          29%       { opacity: 1; }
          52%       { transform: translateX(106px);  opacity: 1; }
          57%, 100% { transform: translateX(106px);  opacity: 0; }
        }
        @keyframes stairSvgAnim {
          0%, 47%   { clip-path: inset(0 100% 0 0); transform: scale(1);   opacity: 0; }
          50%       { clip-path: inset(0 80%  0 0); transform: scale(1);   opacity: 1; }
          63%       { clip-path: inset(0 0%   0 0); transform: scale(1);   opacity: 1; }
          76%       { clip-path: inset(0 0%   0 0); transform: scale(1);   opacity: 1; }
          83%, 91%  { clip-path: inset(0 0%   0 0); transform: scale(2.4); opacity: 1; }
          97%       { clip-path: inset(0 0%   0 0); transform: scale(2.4); opacity: 0; }
          100%      { clip-path: inset(0 100% 0 0); transform: scale(1);   opacity: 0; }
        }
        @keyframes stairWireDraw {
          0%, 61%  { stroke-dashoffset: 400; opacity: 0; }
          63%      { opacity: 1; }
          75%      { stroke-dashoffset: 0;   opacity: 1; }
          88%      { stroke-dashoffset: 0;   opacity: 1; }
          94%      { stroke-dashoffset: 0;   opacity: 0; }
          100%     { stroke-dashoffset: 400; opacity: 0; }
        }
        @keyframes stairStepLine {
          0%, 64%   { opacity: 0; }
          72%, 87%  { opacity: 1; }
          94%, 100% { opacity: 0; }
        }
        @keyframes stairVecDot {
          0%, 67%   { opacity: 0; transform: scale(0); }
          74%, 88%  { opacity: 1; transform: scale(1); }
          95%, 100% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes stairVecLabel {
          0%, 70%   { opacity: 0; }
          76%, 87%  { opacity: 1; }
          94%, 100% { opacity: 0; }
        }
        @keyframes stairScaleLabel {
          0%, 78%   { opacity: 0; transform: scale(0.9) translateY(4px); }
          84%, 90%  { opacity: 1; transform: scale(1)   translateY(0px); }
          96%, 100% { opacity: 0; transform: scale(0.9) translateY(4px); }
        }

        /* Override Clerk card to be frameless */
        .cl-card {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        .cl-socialButtonsBlockButton {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          color: rgba(255,255,255,0.65) !important;
          border-radius: 0 !important;
          font-family: ${FONT_MONO} !important;
          font-size: 11px !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          transition: background 0.18s ease !important;
        }
        .cl-socialButtonsBlockButton:hover {
          background: rgba(255,255,255,0.08) !important;
        }
        .cl-formButtonPrimary {
          background: #ffffff !important;
          color: #000000 !important;
          border-radius: 0 !important;
          font-family: ${FONT_MONO} !important;
          font-size: 11px !important;
          font-weight: 400 !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          box-shadow: none !important;
          transition: opacity 0.18s ease !important;
        }
        .cl-formButtonPrimary:hover { opacity: 0.88 !important; }
        .cl-formFieldInput {
          background: #0f0f0f !important;
          border: 1px solid rgba(255,255,255,0.10) !important;
          border-radius: 0 !important;
          color: rgba(255,255,255,0.75) !important;
          font-family: ${FONT_MONO} !important;
          font-size: 12px !important;
        }
        .cl-formFieldInput:focus {
          border-color: rgba(255,255,255,0.28) !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .cl-formFieldLabel {
          color: rgba(255,255,255,0.40) !important;
          font-family: ${FONT_MONO} !important;
          font-size: 9px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.14em !important;
        }
        .cl-headerTitle {
          color: #ffffff !important;
          font-family: ${FONT_BODY} !important;
          font-weight: 500 !important;
          letter-spacing: -0.015em !important;
        }
        .cl-headerSubtitle {
          color: ${TEXT_SEC} !important;
          font-family: ${FONT_BODY} !important;
          font-size: 13px !important;
        }
        .cl-footerActionLink {
          color: rgba(255,255,255,0.55) !important;
          font-family: ${FONT_MONO} !important;
        }
        .cl-footerActionLink:hover { color: rgba(255,255,255,0.85) !important; }
        .cl-dividerLine { background: rgba(255,255,255,0.08) !important; }
        .cl-dividerText {
          color: ${TEXT_MUT} !important;
          font-family: ${FONT_MONO} !important;
          font-size: 9px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.14em !important;
        }
        .cl-identityPreviewText { color: rgba(255,255,255,0.65) !important; }
        .cl-identityPreviewEditButton { color: rgba(255,255,255,0.45) !important; }
        .cl-internal-b3fm57 { background: transparent !important; }
        .cl-footerPages { color: ${TEXT_MUT} !important; }
      `}</style>

      <div style={{
        display:      "flex",
        minHeight:    "100svh",
        background:   PAGE_BG,
        fontFamily:   FONT_BODY,
        color:        TEXT_PRI,
        overflow:     "hidden",
      }}>

        {/* ── Left panel (desktop) ───────────────────────────────────────────── */}
        <div style={{
          display:        "none",
          position:       "relative",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          width:          "46%",
          borderRight:    `1px solid ${BORDER}`,
          background:     "rgba(255,255,255,0.01)",
          padding:        "48px 40px",
        }}
        className="lp-left-panel"
        >
          {/* Dot grid bg — same as landing page graphics */}
          <div style={{
            position:   "absolute",
            inset:      0,
            pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize:  "18px 18px",
          }} />

          {/* ── Subtle LEGO studs — positioned at rail corners, same as RailedSection ── */}
          {/* Top-left stud */}
          <div style={{ position: "absolute", top: 18, left: 18, opacity: 0.55 }}>
            <LegoStudInline color="#f97316" size={12} />
          </div>
          {/* Top-right stud */}
          <div style={{ position: "absolute", top: 18, right: 18, opacity: 0.55 }}>
            <LegoStudInline color="#22d3ee" size={12} />
          </div>
          {/* Bottom-left stud */}
          <div style={{ position: "absolute", bottom: 18, left: 18, opacity: 0.55 }}>
            <LegoStudInline color="#a3e635" size={12} />
          </div>
          {/* Bottom-right stud */}
          <div style={{ position: "absolute", bottom: 18, right: 18, opacity: 0.55 }}>
            <LegoStudInline color="#a855f7" size={12} />
          </div>
          {/* Mid-left rail stud */}
          <div style={{ position: "absolute", top: "50%", left: 18, transform: "translateY(-50%)", opacity: 0.35 }}>
            <LegoStudInline color="#ec4899" size={10} />
          </div>
          {/* Mid-right rail stud */}
          <div style={{ position: "absolute", top: "50%", right: 18, transform: "translateY(-50%)", opacity: 0.35 }}>
            <LegoStudInline color="#f97316" size={10} />
          </div>

          <div style={{
            position:   "relative",
            zIndex:     1,
            display:    "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth:   320,
            gap:        28,
            width:      "100%",
          }}>
            {/* Logo */}
            <Link href="/" className="lp-a0" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              {/* LogoMark inline — accent color treated as white on dark bg */}
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 9.32256L8.08064 8.13363L10.1613 9.32256L10.018 21.5092L12.1924 22.6517L16.4032 20.3202V17.8433L18.5829 16.5553L18.3848 2.08986L20.5645 1L22.8433 2.08986V16.7534L20.7131 17.8433V20.3202L18.5829 21.4811V23.788L12.2419 27.5529L9.96313 26.1784L7.98156 24.9832L6 23.788V9.32256Z" fill="white" />
                <path d="M6 9.32256L8.08064 8.13363L10.1613 9.32256M6 9.32256L8.08064 10.5115M6 9.32256V23.788L7.98156 24.9832M10.1613 9.32256L8.08064 10.5115M10.1613 9.32256L10.018 21.5092M8.08064 10.5115L7.98156 24.9832M12.2419 27.5529L18.5829 23.788V21.3606M12.2419 27.5529L9.96313 26.1784M12.2419 27.5529L12.1924 22.6517M18.5829 18.9331L20.7131 17.8433M18.5829 18.9331V21.3606M18.5829 18.9331L16.4032 17.8433M22.8433 2.08986V16.7534L20.7131 17.8433M22.8433 2.08986L20.5645 3.08064M22.8433 2.08986L20.5645 1L18.3848 2.08986M20.5645 3.08064L18.3848 2.08986M20.5645 3.08064L20.7131 17.8433M18.3848 2.08986L18.5829 16.5553M20.7131 17.8433V20.3202L9.96313 26.1784M20.7131 17.8433L18.5829 16.5553M18.5829 16.5553L16.4032 17.8433M9.96313 26.1784L7.98156 24.9832M9.96313 26.1784L10.018 21.5092M7.98156 24.9832L12.1924 22.6517M16.4032 20.3202L18.5829 21.3606M16.4032 20.3202L12.1924 22.6517M16.4032 20.3202V17.8433M10.018 21.5092L12.1924 22.6517" stroke="rgba(0,0,0,0.28)" strokeWidth="0.2" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRI, letterSpacing: "-0.01em" }}>VectorDrop</span>
            </Link>

            {/* Demo */}
            <div className="lp-a1" style={{ width: "100%" }}>
              <MockConversionDemo />
            </div>

            {/* Caption */}
            <p className="lp-a2" style={{
              fontSize:    14,
              lineHeight:  "1.7",
              color:       TEXT_SEC,
              textAlign:   "center",
              margin:      0,
            }}>
              Turn any raster image into a clean, editable vectors in seconds.
            </p>

            {/* Feature list — matches landing page chip style */}
            <div className="lp-a3" style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
              {[
                "Pixel-perfect vector tracing",
                "One-click SVG export",
                "No design tools required",
              ].map((feat) => (
                <div key={feat} style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        9,
                  padding:    "7px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border:     `1px solid ${BORDER}`,
                  fontSize:   10,
                  fontFamily: FONT_MONO,
                  color:      "rgba(255,255,255,0.40)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel — auth form ──────────────────────────────────────────── */}
        <div style={{
          flex:           1,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "64px 24px",
        }}>
          {/* Mobile logo */}
          <div className="lp-mobile-logo lp-a0" style={{ marginBottom: 36 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 9.32256L8.08064 8.13363L10.1613 9.32256L10.018 21.5092L12.1924 22.6517L16.4032 20.3202V17.8433L18.5829 16.5553L18.3848 2.08986L20.5645 1L22.8433 2.08986V16.7534L20.7131 17.8433V20.3202L18.5829 21.4811V23.788L12.2419 27.5529L9.96313 26.1784L7.98156 24.9832L6 23.788V9.32256Z" fill="white" />
                <path d="M6 9.32256L8.08064 8.13363L10.1613 9.32256M6 9.32256L8.08064 10.5115M6 9.32256V23.788L7.98156 24.9832M10.1613 9.32256L8.08064 10.5115M10.1613 9.32256L10.018 21.5092M8.08064 10.5115L7.98156 24.9832M12.2419 27.5529L18.5829 23.788V21.3606M12.2419 27.5529L9.96313 26.1784M12.2419 27.5529L12.1924 22.6517M18.5829 18.9331L20.7131 17.8433M18.5829 18.9331V21.3606M18.5829 18.9331L16.4032 17.8433M22.8433 2.08986V16.7534L20.7131 17.8433M22.8433 2.08986L20.5645 3.08064M22.8433 2.08986L20.5645 1L18.3848 2.08986M20.5645 3.08064L18.3848 2.08986M20.5645 3.08064L20.7131 17.8433M18.3848 2.08986L18.5829 16.5553M20.7131 17.8433V20.3202L9.96313 26.1784M20.7131 17.8433L18.5829 16.5553M18.5829 16.5553L16.4032 17.8433M9.96313 26.1784L7.98156 24.9832M9.96313 26.1784L10.018 21.5092M7.98156 24.9832L12.1924 22.6517M16.4032 20.3202L18.5829 21.3606M16.4032 20.3202L12.1924 22.6517M16.4032 20.3202V17.8433M10.018 21.5092L12.1924 22.6517" stroke="rgba(0,0,0,0.28)" strokeWidth="0.2" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRI }}>VectorDrop</span>
            </Link>
          </div>

          {/* Heading — matches landing h1 weight/tracking */}
          <div className="lp-a1" style={{ width: "100%", maxWidth: 380, marginBottom: 24 }}>
            <h1 style={{
              fontSize:      28,
              fontWeight:    500,
              letterSpacing: "-0.02em",
              color:         TEXT_PRI,
              margin:        0,
              lineHeight:    "1.15",
              fontFamily:    FONT_BODY,
            }}>
              Welcome back
            </h1>
            <p style={{
              fontSize:   14,
              color:      TEXT_SEC,
              marginTop:  8,
              marginBottom: 0,
              lineHeight: "1.55",
              fontFamily: FONT_BODY,
            }}>
              Sign in to save and export your vectors.
            </p>
          </div>

          {/* Clerk widget — frameless, inherits dark theme via global overrides */}
          <div className="lp-a2" style={{ width: "100%", maxWidth: 380 }}>
            <SignIn
              routing="hash"
              signUpUrl="/login"
              forceRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card:    "w-full bg-transparent shadow-none border-none p-0",
                  headerTitle:    "text-white font-medium tracking-tight",
                  headerSubtitle: "text-[rgba(255,255,255,0.50)] text-sm",
                  formButtonPrimary: [
                    "w-full h-10",
                    "bg-white text-black",
                    "font-normal text-[11px] uppercase tracking-[0.04em]",
                    "rounded-none",
                    "hover:opacity-88 transition-opacity",
                  ].join(" "),
                  formFieldInput: [
                    "h-10 px-3 text-xs rounded-none",
                    "bg-[#0f0f0f]",
                    "border border-[rgba(255,255,255,0.10)]",
                    "text-[rgba(255,255,255,0.75)]",
                    "focus:border-[rgba(255,255,255,0.28)] focus:outline-none focus:ring-0",
                  ].join(" "),
                  formFieldLabel: [
                    "text-[9px] uppercase tracking-[0.14em]",
                    "text-[rgba(255,255,255,0.40)]",
                  ].join(" "),
                  socialButtonsBlockButton: [
                    "h-10 rounded-none border",
                    "border-[rgba(255,255,255,0.12)]",
                    "bg-[rgba(255,255,255,0.04)]",
                    "text-[rgba(255,255,255,0.65)]",
                    "text-[11px] uppercase tracking-[0.04em]",
                    "hover:bg-[rgba(255,255,255,0.08)] transition-colors",
                  ].join(" "),
                  dividerLine: "bg-[rgba(255,255,255,0.08)]",
                  dividerText: "text-[rgba(255,255,255,0.28)] text-[9px] uppercase tracking-[0.14em]",
                  footerActionLink: "text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.85)]",
                },
              }}
            />
          </div>

          {/* Footer — same monospace label style as landing */}
          <p className="lp-a3" style={{
            marginTop:   28,
            fontSize:    9,
            fontFamily:  FONT_MONO,
            color:       TEXT_MUT,
            textAlign:   "center",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            By continuing you agree to our{" "}
            <Link href="/terms"   style={{ color: "rgba(255,255,255,0.40)", textDecoration: "underline" }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "rgba(255,255,255,0.40)", textDecoration: "underline" }}>Privacy Policy</Link>
            .
          </p>
        </div>
      </div>

      {/* Responsive: show left panel on lg+ */}
      <style>{`
        @media (min-width: 1024px) {
          .lp-left-panel { display: flex !important; }
          .lp-mobile-logo { display: none !important; }
        }
      `}</style>
    </>
  );
}
