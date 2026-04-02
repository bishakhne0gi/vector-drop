"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CaretDoubleRightIcon,
  CloudArrowUp,
  DownloadSimple,
  BezierCurveIcon,
  FigmaLogo,
  Code,
  Palette,
  PaintBrushBroad,
  ShoppingCart,
  ShareNetwork,
} from "@phosphor-icons/react";
import { LogoMark } from "./Logo";
import { LegoStud } from "./LegoStud";
import { useEffect, useRef } from "react";

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
      <div className="hidden xl:block absolute left-[80px] top-0 -translate-x-1/2 -translate-y-1/2">
        <LegoStud color={accentColor} size={14} />
      </div>
      {/* Right corner — LEGO stud marker */}
      <div className="hidden xl:block absolute right-[80px] top-0 translate-x-1/2 -translate-y-1/2">
        <LegoStud color={accentColor} size={14} />
      </div>
      {children}
    </section>
  );
}

// ─── Before / After visual ─────────────────────────────────────────────────────
function BeforeAfterVisual() {
  const starPath =
    "M70,18 L84,52 L118,54 L93,78 L100,110 L70,92 L40,110 L47,78 L22,54 L56,52 Z";
  const anchorPts: [number, number][] = [
    [70,18],[84,52],[118,54],[93,78],[100,110],
    [70,92],[40,110],[47,78],[22,54],[56,52],
  ];

  return (
    <div
      className="relative overflow-hidden border border-white/[0.08]"
      style={{ background: "#0f0f0f" }}
    >
      <div className="flex" style={{ height: 300 }}>
        {/* BEFORE — blurry raster look */}
        <div
          className="flex-1 relative flex items-center justify-center border-r border-white/[0.07] overflow-hidden"
          style={{ background: "linear-gradient(135deg,#1c1b1c 0%,#141414 100%)" }}
        >
          {/* Pixel grid */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.04,
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 7px,rgba(255,255,255,1) 7px,rgba(255,255,255,1) 8px),repeating-linear-gradient(90deg,transparent,transparent 7px,rgba(255,255,255,1) 7px,rgba(255,255,255,1) 8px)",
            }}
          />
          <svg className="relative z-10" width="130" height="130" viewBox="0 0 140 140">
            <defs>
              <filter id="rBlur">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            {Array.from({ length: 30 }, (_, i) => (
              <rect
                key={i}
                x={10 + (i % 6) * 20}
                y={10 + Math.floor(i / 6) * 22}
                width={2 + (i % 4)}
                height={2 + (i % 3)}
                fill={`rgba(${110 + (i * 11) % 70},${110 + (i * 9) % 70},${110 + (i * 7) % 70},${0.08 + (i % 5) * 0.04})`}
              />
            ))}
            <path d={starPath} fill="#484848" filter="url(#rBlur)" opacity="0.75" />
          </svg>
          <span
            className="absolute bottom-3 left-3 text-[9px] uppercase tracking-[0.2em]"
            style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.22)" }}
          >
            Before · PNG
          </span>
        </div>

        {/* AFTER — clean SVG */}
        <div
          className="flex-1 relative flex items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg,#07100f 0%,#0d0d0d 100%)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%,rgba(34,211,238,0.09),transparent)" }}
          />
          <svg className="relative z-10" width="130" height="130" viewBox="0 0 140 140">
            <path d={starPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round" />
            {anchorPts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.5" fill="#22d3ee" opacity="0.6" />
            ))}
          </svg>
          <span
            className="absolute bottom-3 right-3 text-[9px] uppercase tracking-[0.2em]"
            style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.22)" }}
          >
            After · SVG
          </span>
        </div>
      </div>
      {/* VS divider */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none z-10">
        <div className="w-px h-8 bg-white/[0.08]" />
        <div
          className="border border-white/[0.1] px-2 py-[4px] text-[8px] uppercase tracking-[0.15em]"
          style={{ fontFamily: "auxMono, monospace", color: "rgba(255,255,255,0.28)", background: "#0f0f0f" }}
        >
          vs
        </div>
        <div className="w-px h-8 bg-white/[0.08]" />
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
    // col = null → normal dark stud; col = hex string → fully-colored stud
    const drawStud = (x: number, y: number, col: string | null) => {
      // Drop shadow
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.beginPath(); ctx.arc(x, y + 2.4, 7.6, 0, Math.PI * 2); ctx.fill();
      // Outer dark border ring
      ctx.fillStyle = col ? blend(col, 0.42) : "#121212";
      ctx.beginPath(); ctx.arc(x, y, 7.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col ? blend(col, 0.58) : "#1d1d1d";
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col ? blend(col, 0.74) : "#242424";
      ctx.beginPath(); ctx.arc(x, y, 6.7, 0, Math.PI * 2); ctx.fill();
      // Main stud surface (the color)
      ctx.fillStyle = col ? col : "#232323";
      ctx.beginPath(); ctx.arc(x, y, 6.4, 0, Math.PI * 2); ctx.fill();
      // Upper lighter rim (specular highlight)
      ctx.fillStyle = col ? blend(col, 1.30) : "#4b4b4b";
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      // Mid recession — darker
      ctx.fillStyle = col ? blend(col, 0.50) : "#101010";
      ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col ? blend(col, 0.64) : "#2e2e2e";
      ctx.beginPath(); ctx.arc(x, y, 4.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col ? blend(col, 0.44) : "#1f1f1f";
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col ? blend(col, 0.34) : "#181818";
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      // Center raised nub with shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 3; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 2.5;
      ctx.fillStyle = col ? blend(col, 0.46) : "#262626";
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Arc specular highlight
      ctx.strokeStyle = col ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.15)";
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
          drawStud(x, y, activeCells.get(`${gx},${gy}`) ?? null);
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
          className="flex items-center gap-2 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-black transition-all hover:opacity-85"
          style={{ fontFamily: "auxMono, monospace", background: C.cyan }}
        >
          Try for free <span className="ml-1 opacity-50">›</span>
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
            Turn any image into a<br />clean SVG.
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
              className="inline-flex items-center gap-3 px-7 py-[12px] text-[11px] font-semibold uppercase tracking-[0.18em] text-black transition-all hover:opacity-88"
              style={{ fontFamily: "auxMono, monospace", background: C.cyan }}
            >
              Convert image →
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-3 px-7 py-[12px] text-[11px] uppercase tracking-[0.18em] transition-all"
              style={{
                fontFamily: "auxMono, monospace",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              See how it works ›
            </a>
          </div>
        </div>

        {/* Before / After panel — centered, floating below text */}
        <div className="relative z-20 mx-auto max-w-[860px] px-6 pb-0">
          <div className="a4">
            <BeforeAfterVisual />
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
                className="grid lg:grid-cols-2 gap-0 border-t"
                style={{ borderColor: "rgba(255,255,255,0.07)", paddingTop: 52, paddingBottom: 52 }}
              >
                {/* Visual panel */}
                <div
                  className="relative flex items-center justify-center lg:mr-8 overflow-hidden"
                  style={{
                    background: "#111011",
                    border: "1px solid rgba(255,255,255,0.07)",
                    minHeight: 240,
                  }}
                >
                  <span
                    className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.25em]"
                    style={{ fontFamily: "auxMono, monospace", color: step.color, opacity: 0.45 }}
                  >
                    Step {step.num}
                  </span>
                  <div className="flex flex-col items-center gap-5">
                    <div
                      className="flex h-14 w-14 items-center justify-center border"
                      style={{ borderColor: `${step.color}40`, color: step.color, background: `${step.color}0e` }}
                    >
                      {step.icon}
                    </div>
                    <div className="w-44 space-y-2">
                      <div className="h-[3px]" style={{ background: `${step.color}38`, width: "100%" }} />
                      <div className="h-[3px]" style={{ background: `${step.color}24`, width: "73%" }} />
                      <div className="h-[3px]" style={{ background: `${step.color}15`, width: "52%" }} />
                    </div>
                  </div>
                  {/* Top-right accent corner — LEGO stud */}
                  <div className="absolute top-0 right-0">
                    <LegoStud color={step.color} size={14} />
                  </div>
                </div>

                {/* Text panel */}
                <div className="flex flex-col justify-center pl-0 lg:pl-12 pt-8 lg:pt-0">
                  <div className="flex items-center gap-3 mb-5">
                    <LegoStud color={step.color} size={20} />
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
                  className="inline-flex items-center gap-4 px-9 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-black transition-all hover:opacity-88"
                  style={{ fontFamily: "auxMono, monospace", background: C.cyan }}
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
