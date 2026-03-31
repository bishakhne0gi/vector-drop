"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CloudArrowUp, DownloadSimple } from "@phosphor-icons/react";
import { LogoMark } from "./Logo";
import { FloatingThemeToggle } from "./FloatingThemeToggle";
import { AiComingSoon } from "./AiComingSoon";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const SPRING = { type: "spring", stiffness: 400, damping: 28 } as const;

/* ─── Decorative SVG shapes ──────────────────────────────────────────────── */
function StarDeco({ size = 24, color = "var(--accent)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.8 9.2L21 12L13.8 14.8L12 22L10.2 14.8L3 12L10.2 9.2L12 2Z" fill={color} />
    </svg>
  );
}

function SparkDeco({ size = 20, color = "var(--accent)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 1L11.2 8.8L19 10L11.2 11.2L10 19L8.8 11.2L1 10L8.8 8.8L10 1Z" fill={color} />
    </svg>
  );
}

function CrossDeco({ size = 18, color = "var(--accent)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 1V17M1 9H17" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FlowerDeco({ size = 28, color = "var(--accent)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="4" fill={color} />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <ellipse key={i} cx="14" cy="7" rx="3" ry="5" fill={color} opacity="0.55"
          transform={`rotate(${deg} 14 14)`} />
      ))}
    </svg>
  );
}

function ArrowDeco({ size = 32, color = "var(--accent)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 24 C8 16 16 8 26 8M26 8L18 6M26 8L24 16" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckDeco({ size = 22, color = "var(--accent)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M3 11L9 17L19 6" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Mascot: LEGO-brick raptor ──────────────────────────────────────────── */
function DinoMascot({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 0.82);
  return (
    <svg width={size} height={h} viewBox="0 0 220 180" fill="none">
      {/* shadow */}
      <ellipse cx="118" cy="175" rx="68" ry="5.5" fill="rgba(0,0,0,0.10)" />

      {/* ── TAIL ── */}
      <rect x="4"  y="44" width="22" height="14" rx="2.5" fill="#0d9488" />
      <circle cx="10" cy="43" r="3.5" fill="#0a7a72" />
      <circle cx="20" cy="43" r="3.5" fill="#0a7a72" />

      <rect x="24" y="52" width="28" height="16" rx="2.5" fill="#0d9488" />
      <circle cx="31" cy="51" r="3.5" fill="#0a7a72" />
      <circle cx="41" cy="51" r="3.5" fill="#0a7a72" />
      <circle cx="51" cy="51" r="3.5" fill="#0a7a72" />

      <rect x="50" y="62" width="22" height="18" rx="2.5" fill="#0d9488" />

      {/* ── BODY ── */}
      <rect x="65" y="70" width="74" height="48" rx="3" fill="#0d9488" />
      <circle cx="74"  cy="69" r="4.5" fill="#0a7a72" />
      <circle cx="88"  cy="69" r="4.5" fill="#0a7a72" />
      <circle cx="102" cy="69" r="4.5" fill="#0a7a72" />
      <circle cx="116" cy="69" r="4.5" fill="#0a7a72" />
      <circle cx="130" cy="69" r="4.5" fill="#0a7a72" />
      {/* belly */}
      <rect x="70" y="97" width="64" height="21" rx="2" fill="#f59e0b" />

      {/* ── NECK ── */}
      <rect x="132" y="56" width="24" height="30" rx="2.5" fill="#0d9488" />
      <circle cx="139" cy="55" r="4" fill="#0a7a72" />
      <circle cx="151" cy="55" r="4" fill="#0a7a72" />

      {/* ── HEAD upper ── */}
      <rect x="136" y="36" width="58" height="24" rx="3" fill="#0d9488" />
      <circle cx="145" cy="35" r="4"   fill="#0a7a72" />
      <circle cx="158" cy="35" r="4"   fill="#0a7a72" />
      <circle cx="171" cy="35" r="4"   fill="#0a7a72" />
      <circle cx="184" cy="35" r="4"   fill="#0a7a72" />
      {/* snout */}
      <rect x="170" y="42" width="26" height="16" rx="2" fill="#f59e0b" />
      {/* nostril */}
      <circle cx="186" cy="46" r="2.2" fill="#d97706" />
      {/* eye */}
      <circle cx="160" cy="46" r="7.5" fill="#f59e0b" />
      <circle cx="161" cy="47" r="4.2" fill="#1c1917" />
      <circle cx="159" cy="45" r="1.5" fill="white" />
      {/* upper teeth */}
      <rect x="170" y="57" width="4"   height="7" rx="1.2" fill="white" />
      <rect x="177" y="58" width="3.5" height="6" rx="1.2" fill="white" />
      <rect x="184" y="57" width="3.5" height="7" rx="1.2" fill="white" />
      <rect x="191" y="58" width="3"   height="5" rx="1.2" fill="white" />

      {/* ── LOWER JAW ── */}
      <rect x="152" y="65" width="48" height="19" rx="3" fill="#0d9488" />
      <rect x="160" y="67" width="37" height="15" rx="2" fill="#f59e0b" />
      {/* lower teeth */}
      <rect x="162" y="61" width="3.5" height="7" rx="1.2" fill="white" />
      <rect x="169" y="62" width="3.5" height="6" rx="1.2" fill="white" />
      <rect x="176" y="61" width="3"   height="7" rx="1.2" fill="white" />
      <rect x="183" y="62" width="3"   height="6" rx="1.2" fill="white" />

      {/* ── FRONT ARM ── */}
      <rect x="132" y="84" width="18" height="13" rx="2.5" fill="#0d9488" />
      <path d="M145 97 L149 91 L153 97" fill="#065f46" />
      <path d="M149 98 L153 92 L157 98" fill="#065f46" />

      {/* ── BACK LEG (slightly behind) ── */}
      <rect x="76"  y="116" width="22" height="25" rx="2.5" fill="#0a7a72" />
      <rect x="74"  y="139" width="18" height="18" rx="2.5" fill="#0a7a72" />
      <rect x="68"  y="154" width="28" height="11" rx="2.5" fill="#0a7a72" />
      <path d="M68 165 L61 161 L66 154"  fill="#065f46" />
      <path d="M78 166 L74 157 L84 159"  fill="#065f46" />
      <path d="M92 165 L88 156 L95 155"  fill="#065f46" />

      {/* ── FRONT LEG ── */}
      <rect x="117" y="116" width="22" height="25" rx="2.5" fill="#0d9488" />
      <rect x="115" y="139" width="18" height="18" rx="2.5" fill="#0d9488" />
      <rect x="109" y="154" width="28" height="11" rx="2.5" fill="#0d9488" />
      <path d="M109 165 L102 161 L107 154" fill="#065f46" />
      <path d="M119 166 L115 157 L125 159" fill="#065f46" />
      <path d="M133 165 L129 156 L136 155" fill="#065f46" />
    </svg>
  );
}

/* ─── Marquee strip ──────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  "PNG → SVG", "JPG → SVG", "100% Free", "Browser-based",
  "No Illustrator", "Clean Vectors", "WebP → SVG", "Instant Export",
];

function MarqueeStrip({ dark = false }: { dark?: boolean }) {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      className="relative overflow-hidden py-3.5 select-none"
      style={{ background: dark ? "var(--bg-invert)" : "var(--accent)" }}
    >
      <div className="marquee-track flex gap-0">
        {items.map((label, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2.5 px-7 text-sm font-semibold"
            style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>
            <span style={{ color: dark ? "var(--accent)" : "rgba(255,255,255,0.45)", fontSize: 10 }}>✦</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Mock cards ─────────────────────────────────────────────────────────── */
function UploadCard() {
  return (
    <div className="overflow-hidden rounded-2xl" style={{
      background: "var(--bg-card)", border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-card)", width: 220,
    }}>
      <div className="px-4 py-3 border-b flex items-center gap-1.5"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)" }}>
        <div className="h-2.5 w-2.5 rounded-full bg-red-400 opacity-60" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400 opacity-60" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400 opacity-60" />
      </div>
      <div className="p-4">
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed py-5"
          style={{ borderColor: "var(--accent)", background: "var(--accent-bg)" }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <CloudArrowUp size={16} color="white" weight="bold" />
          </div>
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Drop image here</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>PNG · JPG · WebP</p>
        </div>
        <div className="mt-3 text-center">
          <span className="inline-block rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "var(--accent)" }}>
            Browse files
          </span>
        </div>
      </div>
    </div>
  );
}

function ConvertCard() {
  return (
    <div className="overflow-hidden rounded-2xl" style={{
      background: "var(--bg-card)", border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-card-hover)", width: 240,
    }}>
      <div className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)" }}>
        <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Converting…</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: "var(--accent)" }}>75%</span>
      </div>
      <div className="p-4 flex gap-3 items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {[0,1,2,3].flatMap((r) => [0,1,2,3].map((c) => (
              <rect key={`${r}${c}`} x={3+c*5} y={3+r*5} width="4" height="4" rx="0.5"
                fill="var(--accent)" opacity={(r+c)%2===0 ? 0.5 : 0.12} />
            )))}
          </svg>
        </div>
        <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowRight size={12} color="var(--accent)" weight="bold" />
        </motion.div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2"
          style={{ borderColor: "var(--accent)", background: "var(--accent-bg)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 20 C6 14 10 8 14 12 C18 16 21 7 22 4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="4" cy="20" r="1.8" fill="var(--accent)" />
            <circle cx="14" cy="12" r="1.5" fill="var(--accent)" opacity="0.5" />
            <circle cx="22" cy="4" r="1.8" fill="var(--accent)" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>logo.png</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--accent-bg)" }}>
            <motion.div className="h-full rounded-full" style={{ background: "var(--accent)" }}
              initial={{ width: "0%" }} animate={{ width: "75%" }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.3 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorCard() {
  return (
    <div className="overflow-hidden rounded-2xl" style={{
      background: "var(--bg-card)", border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-card)", width: 220,
    }}>
      <div className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)" }}>
        <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>logo.svg</span>
        <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: "var(--accent)" }}>
          <DownloadSimple size={8} weight="bold" />
          Export
        </span>
      </div>
      <div className="flex items-center justify-center p-6" style={{ background: "var(--bg-subtle)" }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <path d="M6 60 C12 44 24 28 36 36 C48 44 60 20 66 8" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M6 44 C14 40 24 36 36 36" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
          <circle cx="6" cy="60" r="4" fill="var(--accent)" />
          <circle cx="36" cy="36" r="3" fill="var(--accent)" />
          <circle cx="66" cy="8" r="4" fill="var(--accent)" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Testimonials ───────────────────────────────────────────────────────── */
function TestimonialCard() {
  return (
    <motion.div
      className="overflow-hidden rounded-3xl p-7"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card-hover)", maxWidth: 340 }}
      initial={{ opacity: 0, y: 20, rotate: -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: -2 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: EASE }}
      whileHover={{ rotate: 0, y: -5, transition: { duration: 0.22 } }}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b">
            <path d="M7 1L8.5 5.5H13L9.5 8L11 13L7 10L3 13L4.5 8L1 5.5H5.5L7 1Z" />
          </svg>
        ))}
      </div>
      <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
        "Finally something better than dragging images into Illustrator and getting a janky mess. VectorDrop just works."
      </p>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "var(--accent)" }}>M</div>
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Mika Chen</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>UI Designer, Figma</p>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialCard2() {
  return (
    <motion.div
      className="overflow-hidden rounded-3xl p-7"
      style={{ background: "var(--bg-invert)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "var(--shadow-card-hover)", maxWidth: 320 }}
      initial={{ opacity: 0, y: 20, rotate: 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 2 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.12 }}
      whileHover={{ rotate: 0, y: -5, transition: { duration: 0.22 } }}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="var(--accent)">
            <path d="M7 1L8.5 5.5H13L9.5 8L11 13L7 10L3 13L4.5 8L1 5.5H5.5L7 1Z" />
          </svg>
        ))}
      </div>
      <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.72)" }}>
        "Converted 200 product icons in one afternoon. The output SVGs are so clean, not a single manual fix needed."
      </p>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "var(--accent)" }}>J</div>
        <div>
          <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>James Liu</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Frontend Engineer</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <main className="flex flex-col overflow-x-hidden">
      <FloatingThemeToggle />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center px-6 pt-24 pb-0 text-center overflow-visible">
        {/* Floating deco */}
        <motion.div className="absolute left-[7%] top-40 hidden md:block" animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <StarDeco size={32} />
        </motion.div>
        <motion.div className="absolute right-[9%] top-36 hidden md:block" animate={{ y: [0, 10, 0], rotate: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
          <FlowerDeco size={34} />
        </motion.div>
        <motion.div className="absolute left-[18%] top-72 hidden lg:block" animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}>
          <SparkDeco size={18} color="var(--accent-light)" />
        </motion.div>
        <motion.div className="absolute right-[15%] top-80 hidden lg:block" animate={{ y: [0, 8, 0], rotate: [0, 18, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}>
          <CrossDeco size={20} />
        </motion.div>
        <motion.div className="absolute left-[4%] top-[58%] hidden xl:block" animate={{ y: [0, -10, 0], rotate: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}>
          <ArrowDeco size={36} />
        </motion.div>
        <motion.div className="absolute right-[5%] top-[52%] hidden xl:block" animate={{ y: [0, 7, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
          <StarDeco size={20} color="var(--accent-light)" />
        </motion.div>

        {/* Headline */}
        <motion.div className="mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}>
          <h1 className="mb-1 text-[3.5rem] font-black leading-[1.05] tracking-[-0.045em] md:text-[5.2rem]">
            Turn any image
          </h1>
          <h1 className="mb-1 text-[3.5rem] font-black leading-[1.05] tracking-[-0.045em] md:text-[5.2rem]">
            into a{" "}
            <span className="relative inline-block px-4 pb-1 rounded-2xl text-white" style={{ background: "var(--accent)" }}>
              perfect
              <motion.span className="absolute -top-3 -right-3"
                animate={{ rotate: [0, 20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                <SparkDeco size={16} color="#f59e0b" />
              </motion.span>
            </span>
          </h1>
          <h1 className="text-[3.5rem] font-black leading-[1.05] tracking-[-0.045em] md:text-[5.2rem]">
            <span className="gradient-text">SVG vector</span>
            <motion.span className="inline-block ml-3 align-middle"
              animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
              <CheckDeco size={38} />
            </motion.span>
          </h1>
        </motion.div>

        {/* Subtext */}
        <motion.p className="mx-auto mt-6 max-w-md text-lg leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}>
          Upload a PNG or JPG. Get a clean, editable SVG in seconds.
          No Illustrator. No Figma. Just works.
        </motion.p>

        {/* CTAs */}
        <motion.div className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.3 }}>
          <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING}>
            <Link href="/dashboard" className="btn-accent inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold">
              Convert for free
              <ArrowRight size={13} weight="bold" />
            </Link>
          </motion.div>
          <motion.a href="#how-it-works" className="btn-ghost rounded-2xl px-7 py-3.5 text-sm font-medium"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SPRING}>
            See how it works
          </motion.a>
        </motion.div>

        <motion.p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.4 }}>
          Loved by 2,400+ designers &amp; developers
        </motion.p>

        {/* Tilted product cards */}
        <div className="relative mt-16 w-full max-w-4xl h-[300px] hidden md:block">
          <motion.div className="absolute left-1/2" style={{ x: "-50%", top: 0 }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, rotate: -1.5 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.4 }}
            whileHover={{ rotate: 0, y: -6, transition: { duration: 0.2 } }}>
            <ConvertCard />
          </motion.div>
          <motion.div className="absolute left-6 top-8"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.55 }}
            whileHover={{ rotate: -2, y: -4, transition: { duration: 0.2 } }}>
            <UploadCard />
          </motion.div>
          <motion.div className="absolute right-6 top-12"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, rotate: 3.5 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.7 }}
            whileHover={{ rotate: 1.5, y: -4, transition: { duration: 0.2 } }}>
            <EditorCard />
          </motion.div>
          <motion.div className="absolute bottom-0 left-12"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.9 }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <DinoMascot size={120} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Marquee 1 ─────────────────────────────────────────────────── */}
      <div className="mt-16"><MarqueeStrip /></div>

      {/* ── How it works (inverted) ────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-28" style={{ background: "var(--bg-invert)" }}>
        <div className="mx-auto max-w-5xl">
          <motion.div className="mb-16 text-center"
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, ease: EASE }}>
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              How it works
            </span>
            <h2 className="mb-4 text-4xl font-black tracking-[-0.04em] md:text-6xl" style={{ color: "rgba(255,255,255,0.95)" }}>
              Vectorizing has never
              <br className="hidden sm:block" />
              been this{" "}
              <span className="relative inline-block px-3 rounded-xl" style={{ background: "var(--accent)", color: "white" }}>
                easy
                <motion.span className="absolute -top-2.5 -right-2.5"
                  animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                  <StarDeco size={18} color="#f59e0b" />
                </motion.span>
              </span>
            </h2>
            <p className="max-w-xs mx-auto text-base" style={{ color: "rgba(255,255,255,0.38)" }}>
              Three steps, zero design skills required.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                tag: "Step 01", tilt: "-1.5deg", accent: false,
                title: "Upload any raster image",
                desc: "Drag and drop PNG, JPG or WebP — up to 10 MB. No account needed to try.",
                icon: <CloudArrowUp size={26} weight="regular" />,
              },
              {
                tag: "Step 02", tilt: "0deg", accent: true,
                title: "Algo traces it to vector",
                desc: "Color quantization + potrace path tracing on each layer — clean SVG in seconds.",
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>,
              },
              {
                tag: "Step 03", tilt: "1.5deg", accent: false,
                title: "Edit and export",
                desc: "Tweak paths and colors in the built-in editor, then export a production-ready SVG.",
                icon: <DownloadSimple size={26} weight="regular" />,
              },
            ].map((card, i) => (
              <motion.div key={card.tag}
                className="rounded-3xl p-7 flex flex-col gap-5"
                style={{
                  background: card.accent ? "var(--accent)" : "rgba(255,255,255,0.05)",
                  border: card.accent ? "none" : "1px solid rgba(255,255,255,0.07)",
                  rotate: card.tilt,
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
                whileHover={{ y: -6, rotate: "0deg", transition: { duration: 0.2 } }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{
                    background: card.accent ? "rgba(255,255,255,0.2)" : "var(--accent-bg)",
                    color: card.accent ? "white" : "var(--accent)",
                  }}>{card.tag}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{
                    background: card.accent ? "rgba(255,255,255,0.18)" : "var(--accent-bg)",
                    color: card.accent ? "white" : "var(--accent)",
                  }}>{card.icon}</div>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold tracking-tight"
                    style={{ color: card.accent ? "white" : "rgba(255,255,255,0.9)" }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed"
                    style={{ color: card.accent ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.38)" }}>{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Marquee 2 ─────────────────────────────────────────────────── */}
      <MarqueeStrip dark />

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="px-6 py-28" style={{ background: "var(--bg-primary)" }}>
        <div className="mx-auto max-w-5xl">
          <motion.div className="mb-16 text-center relative"
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, ease: EASE }}>
            <motion.span className="absolute left-2 top-0 hidden lg:block"
              animate={{ y: [0, -7, 0], rotate: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <FlowerDeco size={30} />
            </motion.span>
            <motion.span className="absolute right-2 top-2 hidden lg:block"
              animate={{ y: [0, 8, 0], rotate: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
              <StarDeco size={26} color="var(--accent-light)" />
            </motion.span>
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Features
            </span>
            <h2 className="mb-4 text-4xl font-black tracking-[-0.04em] md:text-5xl">
              So what can you do<br />with <span className="gradient-text">VectorDrop?</span>
            </h2>
            <p className="max-w-sm mx-auto text-base" style={{ color: "var(--text-secondary)" }}>
              Everything you need from pixel to vector — nothing you don't.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Upload */}
            <motion.div className="rounded-3xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card)" }}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, ease: EASE }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <div className="p-7">
                <span className="mb-3 inline-block rounded-xl px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                  style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>Upload</span>
                <h3 className="mb-2 text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Drop any image — PNG, JPG, WebP
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Drag and drop or click to browse. Up to 10 MB, no sign-up needed.
                </p>
              </div>
              <div className="flex items-center justify-center px-7 pb-7">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <UploadCard />
                </motion.div>
              </div>
            </motion.div>

            {/* Right col */}
            <div className="flex flex-col gap-5">
              <motion.div className="rounded-3xl overflow-hidden"
                style={{ background: "var(--accent)", boxShadow: "0 8px 32px rgba(13,148,136,0.28)" }}
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                <div className="p-7">
                  <span className="mb-3 inline-block rounded-xl px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                    style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>Edit</span>
                  <h3 className="mb-2 text-2xl font-black tracking-tight text-white">Built-in path editor</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                    Adjust colors, paths, and layers — no Figma or Illustrator needed.
                  </p>
                </div>
                <div className="flex items-center justify-center px-7 pb-7">
                  <motion.div animate={{ rotate: [0, 1, -1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                    <EditorCard />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div className="rounded-3xl p-7"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card)" }}
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                <span className="mb-3 inline-block rounded-xl px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                  style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>Export</span>
                <h3 className="mb-2 text-xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Clean SVG, every time
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                  Multi-layer, no embedded bitmaps. Open in Figma, Illustrator, or ship straight to production.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {["Figma", "Illustrator", "Web", "Inkscape"].map((tool) => (
                    <span key={tool} className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>{tool}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── v2 AI Coming Soon ─────────────────────────────────────────── */}
      <AiComingSoon />

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="px-6 py-28" style={{ background: "var(--bg-panel)" }}>
        <div className="mx-auto max-w-5xl">
          <motion.div className="mb-16 text-center"
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, ease: EASE }}>
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Reviews
            </span>
            <h2 className="mb-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">
              Designers love it.<br /><span className="gradient-text">Cool product!</span>
            </h2>
          </motion.div>

          <div className="flex flex-col items-center gap-10 md:flex-row md:justify-center md:items-start">
            <TestimonialCard />
            <motion.div className="flex flex-col items-center gap-4 self-center"
              initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                <DinoMascot size={150} />
              </motion.div>
              <motion.div className="rounded-2xl px-4 py-2 text-xs font-bold text-white"
                style={{ background: "var(--accent)" }}
                animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
                You approved this! ✓
              </motion.div>
            </motion.div>
            <TestimonialCard2 />
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-32 text-center" style={{ background: "var(--bg-invert)" }}>
        <motion.div className="absolute left-12 top-12 opacity-25" animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
          <FlowerDeco size={52} />
        </motion.div>
        <motion.div className="absolute right-16 bottom-16 opacity-20" animate={{ rotate: [0, -360] }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }}>
          <StarDeco size={44} color="var(--accent-light)" />
        </motion.div>
        <motion.div className="absolute left-1/4 bottom-8 opacity-15" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <SparkDeco size={24} />
        </motion.div>

        <div className="mx-auto max-w-2xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.55, ease: EASE }}>
            <h2 className="mb-5 text-5xl font-black tracking-[-0.04em] md:text-7xl" style={{ color: "rgba(255,255,255,0.95)" }}>
              Get started.<br /><span style={{ color: "var(--accent)" }}>It&apos;s free.</span>
            </h2>
            <p className="mb-8 text-lg" style={{ color: "rgba(255,255,255,0.38)" }}>
              No account needed. Drop your image, get your SVG.
            </p>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING} className="inline-block">
              <Link href="/dashboard" className="btn-accent inline-flex items-center gap-2.5 rounded-2xl px-9 py-4 text-base font-bold">
                Convert now — it&apos;s free
                <ArrowRight size={14} weight="bold" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Big scrolling marquee ──────────────────────────────────────── */}
      <div className="overflow-hidden py-5 select-none border-y"
        style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}>
        <div className="marquee-track-slow flex items-center gap-0">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="flex shrink-0 items-center gap-4 pr-4">
              <span className="text-[3rem] font-black tracking-[-0.04em] md:text-[5rem]"
                style={{ color: i % 2 === 0 ? "var(--text-primary)" : "var(--accent)" }}>
                VectorDrop
              </span>
              <span className="text-2xl" style={{ color: "var(--accent)", opacity: 0.4 }}>✦</span>
              <span className="text-[3rem] font-black tracking-[-0.04em] md:text-[5rem]"
                style={{ color: "var(--text-primary)", opacity: 0.15 }}>
                Image to SVG
              </span>
              <span className="text-2xl" style={{ color: "var(--accent)", opacity: 0.4 }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-10" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)" }}>
        <div className="mx-auto max-w-4xl flex flex-col gap-7">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div className="flex items-center gap-2.5">
              <LogoMark size={22} />
              <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>VectorDrop</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm transition-opacity hover:opacity-60" style={{ color: "var(--text-muted)" }}>Sign in</Link>
              <Link href="/dashboard" className="text-sm transition-opacity hover:opacity-60" style={{ color: "var(--text-muted)" }}>Dashboard</Link>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>© 2026 VectorDrop. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Better than:</span>
            {["Adobe Image Trace", "Vectorizer.AI", "SVGtrace", "Figma Vectorize", "Vector Magic", "Inkscape"].map((name) => (
              <span key={name} className="rounded-full px-2.5 py-0.5 text-xs"
                style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>{name}</span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
