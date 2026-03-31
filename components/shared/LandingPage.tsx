"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CloudArrowUp, DownloadSimple } from "@phosphor-icons/react";
import { LogoMark } from "./Logo";
import { FloatingThemeToggle } from "./FloatingThemeToggle";
import { GlobalCursor } from "./GlobalCursor";
import { AiComingSoon } from "./AiComingSoon";
import { useRef, useEffect, useCallback, useState, useMemo } from "react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const SPRING = { type: "spring", stiffness: 400, damping: 28 } as const;

/* ─── Hero Interactive Grid Background ────────────────────────────────────── */
function HeroSlimeBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const hoverAmountRef = useRef(0); // smoothly lerped 0→1
  const hoveredRef = useRef(false);
  const trailRef = useRef<{ x: number; y: number; age: number }[]>([]);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const W = cvs.width;
    const H = cvs.height;
    const t = performance.now() * 0.001;

    // Smooth hover lerp (no abrupt jumps)
    const hTarget = hoveredRef.current ? 1 : 0;
    hoverAmountRef.current += (hTarget - hoverAmountRef.current) * 0.04;
    const h = hoverAmountRef.current;

    // Smooth mouse lerp
    mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.06;
    mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.06;
    const mx = mouseRef.current.x * W;
    const my = mouseRef.current.y * H;

    // Update trail
    if (hoveredRef.current) {
      trailRef.current.push({ x: mx, y: my, age: 0 });
      if (trailRef.current.length > 25) trailRef.current.shift();
    }
    trailRef.current = trailRef.current.filter((p) => { p.age += 0.02; return p.age < 1; });

    ctx.clearRect(0, 0, W, H);

    // Subtle background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "rgba(13,148,136,0.08)");
    bgGrad.addColorStop(0.5, "rgba(20,184,166,0.04)");
    bgGrad.addColorStop(1, "rgba(13,148,136,0.06)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid config
    const gridSize = 40;
    const influenceRadius = 280;

    // Draw grid lines — smooth magnetic warp near cursor
    ctx.lineWidth = 0.8;
    // Vertical lines
    for (let gx = 0; gx < W; gx += gridSize) {
      ctx.beginPath();
      for (let gy = 0; gy < H; gy += 4) {
        const dx = gx - mx;
        const dy = gy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / influenceRadius);
        const smoothInfluence = proximity * proximity * h; // quadratic falloff, smooth
        const wave = Math.sin(gy * 0.015 + t * 1.5 + gx * 0.008) * 18 * smoothInfluence;
        const px = gx + wave;
        // Fade line color based on proximity
        ctx.strokeStyle = `rgba(13,148,136,${0.06 + smoothInfluence * 0.12})`;
        gy === 0 ? ctx.moveTo(px, gy) : ctx.lineTo(px, gy);
      }
      ctx.stroke();
    }
    // Horizontal lines
    for (let gy = 0; gy < H; gy += gridSize) {
      ctx.beginPath();
      for (let gx = 0; gx < W; gx += 4) {
        const dx = gx - mx;
        const dy = gy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / influenceRadius);
        const smoothInfluence = proximity * proximity * h;
        const wave = Math.sin(gx * 0.015 + t * 1.8 + gy * 0.008) * 18 * smoothInfluence;
        const py = gy + wave;
        ctx.strokeStyle = `rgba(13,148,136,${0.06 + smoothInfluence * 0.12})`;
        gx === 0 ? ctx.moveTo(gx, py) : ctx.lineTo(gx, py);
      }
      ctx.stroke();
    }

    // Grid dots — smooth size transition
    for (let gx = gridSize; gx < W; gx += gridSize) {
      for (let gy = gridSize; gy < H; gy += gridSize) {
        const dx = gx - mx;
        const dy = gy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / influenceRadius);
        const smoothInfluence = proximity * proximity * h;
        // Smooth wave displacement
        const waveX = Math.sin(gy * 0.015 + t * 1.5 + gx * 0.008) * 18 * smoothInfluence;
        const waveY = Math.sin(gx * 0.015 + t * 1.8 + gy * 0.008) * 18 * smoothInfluence;
        // Smooth dot size: base 1.5, grows to 4 with smooth easing
        const dotSize = 1.5 + smoothInfluence * 2.5;
        const alpha = 0.06 + smoothInfluence * 0.2;

        ctx.fillStyle = `rgba(13,148,136,${alpha})`;
        ctx.beginPath();
        ctx.arc(gx + waveX, gy + waveY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Cursor effect: magnetic ring with rotating dashes
    if (h > 0.01) {
      const ringRadius = 45 + Math.sin(t * 2) * 5;
      const ringAlpha = h * 0.3;
      ctx.strokeStyle = `rgba(13,148,136,${ringAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.lineDashOffset = -t * 40;
      ctx.beginPath();
      ctx.arc(mx, my, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner ring
      const innerR = 20 + Math.sin(t * 3) * 3;
      ctx.strokeStyle = `rgba(20,184,166,${h * 0.2})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.lineDashOffset = t * 30;
      ctx.beginPath();
      ctx.arc(mx, my, innerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosshair lines
      const crossLen = 10;
      const crossGap = ringRadius + 8;
      ctx.strokeStyle = `rgba(13,148,136,${h * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx - crossGap - crossLen, my); ctx.lineTo(mx - crossGap, my);
      ctx.moveTo(mx + crossGap, my); ctx.lineTo(mx + crossGap + crossLen, my);
      ctx.moveTo(mx, my - crossGap - crossLen); ctx.lineTo(mx, my - crossGap);
      ctx.moveTo(mx, my + crossGap); ctx.lineTo(mx, my + crossGap + crossLen);
      ctx.stroke();

      // Small orbiting dots
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 * i) / 4 + t * 1.5;
        const orbitR = ringRadius + 4;
        const ox = mx + Math.cos(angle) * orbitR;
        const oy = my + Math.sin(angle) * orbitR;
        ctx.fillStyle = `rgba(20,184,166,${h * 0.5})`;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Trail — fading dots behind cursor
    for (const p of trailRef.current) {
      const fade = 1 - p.age;
      ctx.fillStyle = `rgba(13,148,136,${fade * 0.15})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * fade, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      cvs.width = cvs.offsetWidth * dpr;
      cvs.height = cvs.offsetHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    targetRef.current.x = (e.clientX - rect.left) / rect.width;
    targetRef.current.y = (e.clientY - rect.top) / rect.height;
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      onMouseMove={handleMove}
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.9 }}
      />
    </div>
  );
}

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

/* ─── Mascot: LEGO-brick raptor — scroll collection system ─────────────── */

// Piece SVG content definitions
const DINO_SVG: Record<string, React.ReactNode> = {
  "tail-tip": (<><rect x="4" y="44" width="22" height="14" rx="2.5" fill="#0d9488" /><circle cx="10" cy="43" r="3.5" fill="#0a7a72" /><circle cx="20" cy="43" r="3.5" fill="#0a7a72" /></>),
  "tail-mid": (<><rect x="24" y="52" width="28" height="16" rx="2.5" fill="#0d9488" /><circle cx="31" cy="51" r="3.5" fill="#0a7a72" /><circle cx="41" cy="51" r="3.5" fill="#0a7a72" /><circle cx="51" cy="51" r="3.5" fill="#0a7a72" /></>),
  "tail-base": <rect x="50" y="62" width="22" height="18" rx="2.5" fill="#0d9488" />,
  "body": (<><rect x="65" y="70" width="74" height="48" rx="3" fill="#0d9488" /><circle cx="74" cy="69" r="4.5" fill="#0a7a72" /><circle cx="88" cy="69" r="4.5" fill="#0a7a72" /><circle cx="102" cy="69" r="4.5" fill="#0a7a72" /><circle cx="116" cy="69" r="4.5" fill="#0a7a72" /><circle cx="130" cy="69" r="4.5" fill="#0a7a72" /></>),
  "belly": <rect x="70" y="97" width="64" height="21" rx="2" fill="#f59e0b" />,
  "neck": (<><rect x="132" y="56" width="24" height="30" rx="2.5" fill="#0d9488" /><circle cx="139" cy="55" r="4" fill="#0a7a72" /><circle cx="151" cy="55" r="4" fill="#0a7a72" /></>),
  "head": (<><rect x="136" y="36" width="58" height="24" rx="3" fill="#0d9488" /><circle cx="145" cy="35" r="4" fill="#0a7a72" /><circle cx="158" cy="35" r="4" fill="#0a7a72" /><circle cx="171" cy="35" r="4" fill="#0a7a72" /><circle cx="184" cy="35" r="4" fill="#0a7a72" /></>),
  "snout": (<><rect x="170" y="42" width="26" height="16" rx="2" fill="#f59e0b" /><circle cx="186" cy="46" r="2.2" fill="#d97706" /></>),
  "eye": (<><circle cx="160" cy="46" r="7.5" fill="#f59e0b" /><circle cx="161" cy="47" r="4.2" fill="#1c1917" /><circle cx="159" cy="45" r="1.5" fill="white" /></>),
  "upper-teeth": (<><rect x="170" y="57" width="4" height="7" rx="1.2" fill="white" /><rect x="177" y="58" width="3.5" height="6" rx="1.2" fill="white" /><rect x="184" y="57" width="3.5" height="7" rx="1.2" fill="white" /><rect x="191" y="58" width="3" height="5" rx="1.2" fill="white" /></>),
  "lower-jaw": (<><rect x="152" y="65" width="48" height="19" rx="3" fill="#0d9488" /><rect x="160" y="67" width="37" height="15" rx="2" fill="#f59e0b" /></>),
  "lower-teeth": (<><rect x="162" y="61" width="3.5" height="7" rx="1.2" fill="white" /><rect x="169" y="62" width="3.5" height="6" rx="1.2" fill="white" /><rect x="176" y="61" width="3" height="7" rx="1.2" fill="white" /><rect x="183" y="62" width="3" height="6" rx="1.2" fill="white" /></>),
  "front-arm": (<><rect x="132" y="84" width="18" height="13" rx="2.5" fill="#0d9488" /><path d="M145 97 L149 91 L153 97" fill="#065f46" /><path d="M149 98 L153 92 L157 98" fill="#065f46" /></>),
  "back-leg": (<><rect x="76" y="116" width="22" height="25" rx="2.5" fill="#0a7a72" /><rect x="74" y="139" width="18" height="18" rx="2.5" fill="#0a7a72" /><rect x="68" y="154" width="28" height="11" rx="2.5" fill="#0a7a72" /><path d="M68 165 L61 161 L66 154" fill="#065f46" /><path d="M78 166 L74 157 L84 159" fill="#065f46" /><path d="M92 165 L88 156 L95 155" fill="#065f46" /></>),
  "front-leg": (<><rect x="117" y="116" width="22" height="25" rx="2.5" fill="#0d9488" /><rect x="115" y="139" width="18" height="18" rx="2.5" fill="#0d9488" /><rect x="109" y="154" width="28" height="11" rx="2.5" fill="#0d9488" /><path d="M109 165 L102 161 L107 154" fill="#065f46" /><path d="M119 166 L115 157 L125 159" fill="#065f46" /><path d="M133 165 L129 156 L136 155" fill="#065f46" /></>),
};

// Assembly order: legs first, then body, tail, arms, neck, jaw, head, details last
const PIECE_IDS = [
  "back-leg", "front-leg", "body", "belly", "tail-base", "tail-mid", "tail-tip",
  "front-arm", "neck", "lower-jaw", "head", "snout", "lower-teeth", "upper-teeth", "eye",
];

// Pieces distributed across 4 remaining sections (hero, how-it-works, features, AI)
const SECTION_PIECES: { pieces: string[]; positions: string[] }[] = [
  { pieces: ["back-leg", "front-leg", "body", "belly"], positions: ["right-[7%] top-[62%]", "left-[5%] top-[72%]", "right-[12%] top-[55%]", "left-[10%] top-[80%]"] },
  { pieces: ["tail-base", "tail-mid", "tail-tip", "front-arm"], positions: ["left-[4%] top-[35%]", "right-[6%] top-28", "left-[7%] bottom-28", "right-[5%] bottom-16"] },
  { pieces: ["neck", "lower-jaw", "head", "snout"], positions: ["right-[5%] top-24", "left-[3%] top-[40%]", "right-[4%] bottom-20", "left-[6%] bottom-16"] },
  { pieces: ["lower-teeth", "upper-teeth", "eye"], positions: ["left-[5%] top-16", "right-[4%] top-[30%]", "left-[7%] bottom-24"] },
];

// Render a small LEGO piece thumbnail for the tray
function PieceMini({ id }: { id: string }) {
  return (
    <svg width="22" height="18" viewBox="0 0 220 180" fill="none">
      {DINO_SVG[id]}
    </svg>
  );
}

// Ripple burst effect on collect
function CollectRipple() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 31 }}>
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ border: `2px solid var(--accent)` }}
          initial={{ width: 20, height: 20, opacity: 0.7 }}
          animate={{ width: 160, height: 160, opacity: 0 }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
        />
      ))}
      {/* Sparkle particles */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 8;
        return (
          <motion.div
            key={`spark-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: i % 2 === 0 ? "var(--accent)" : "#f59e0b" }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * 70,
              y: Math.sin(angle) * 70,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

// A scattered piece — appears on scroll, click/tap to collect into box
function ScatteredPiece({
  id,
  position,
  onCollect,
  floatDelay = 0,
}: {
  id: string;
  position: string;
  onCollect: (id: string) => void;
  floatDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"waiting" | "visible" | "collecting" | "gone">("waiting");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && phase === "waiting") {
          setPhase("visible");
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [phase]);

  const handleClick = useCallback(() => {
    if (phase !== "visible") return;
    setPhase("collecting");
    setTimeout(() => {
      setPhase("gone");
      onCollect(id);
    }, 800);
  }, [phase, id, onCollect]);

  if (phase === "gone") return null;

  return (
    <div ref={ref} className={`absolute hidden md:block ${position}`} style={{ zIndex: 30 }}>
      {/* Ripple effect on collect */}
      {phase === "collecting" && <CollectRipple />}

      <motion.div
        className={phase === "visible" ? "cursor-pointer" : "pointer-events-none"}
        onClick={handleClick}
        initial={{ opacity: 0, scale: 0, rotate: -25 + floatDelay * 20 }}
        animate={
          phase === "collecting"
            ? { opacity: 0, scale: 0.15, x: "-40vw", y: "80vh", rotate: 720 }
            : phase === "visible"
            ? { opacity: 1, scale: 1, rotate: 0 }
            : { opacity: 0, scale: 0 }
        }
        transition={
          phase === "collecting"
            ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.55, type: "spring", stiffness: 120, damping: 14 }
        }
        whileHover={phase === "visible" ? { scale: 1.15 } : undefined}
        whileTap={phase === "visible" ? { scale: 0.9 } : undefined}
      >
        <motion.div
          animate={phase === "visible" ? { y: [0, -14, 0], rotate: [0, 8, -6, 0] } : {}}
          transition={{ duration: 3.5 + floatDelay * 0.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="100" height="82" viewBox="0 0 220 180" fill="none" style={{ overflow: "visible", filter: "drop-shadow(0 6px 20px rgba(13,148,136,0.4))" }}>
            {DINO_SVG[id]}
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Confetti system — bursts from top on completion
function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; size: number; drift: number }[]>([]);

  useEffect(() => {
    if (!active) return;
    const colors = ["#0d9488", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"];
    const p = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      size: 6 + Math.random() * 8,
      drift: (Math.random() - 0.5) * 200,
    }));
    setParticles(p);
    const t = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(t);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size * (0.6 + Math.random() * 0.8),
            background: p.color,
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: "110vh",
            x: p.drift,
            rotate: 360 + Math.random() * 720,
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  );
}

// Sticky LEGO box at bottom-left — pieces visually drop in
function LegoBox({ collected }: { collected: Set<string> }) {
  const count = collected.size;
  const total = PIECE_IDS.length;
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  // Track new additions for the "drop" bounce
  useEffect(() => {
    if (count > 0) {
      const latest = Array.from(collected).pop()!;
      setLastAdded(latest);
      const t = setTimeout(() => setLastAdded(null), 600);
      return () => clearTimeout(t);
    }
  }, [count, collected]);

  if (count === 0) return null;

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-50 hidden md:block"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      {/* Bounce the whole box when a piece drops in */}
      <motion.div
        animate={lastAdded ? { scale: [1, 1.08, 0.95, 1], y: [0, -4, 2, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        {/* The box container */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "2px solid var(--accent-border)",
            boxShadow: "0 8px 32px rgba(13,148,136,0.2), 0 2px 8px rgba(0,0,0,0.1)",
            width: 140,
          }}
        >
          {/* Box lid with LEGO studs */}
          <div className="px-3 py-2 flex items-center gap-2" style={{ background: "var(--accent)", borderBottom: "2px solid var(--accent-hover)" }}>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.15)" }} />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white ml-auto">
              LEGO
            </span>
          </div>

          {/* Box contents — collected pieces tumble inside */}
          <div className="relative p-2" style={{ minHeight: 64 }}>
            <div className="flex flex-wrap gap-0.5 justify-center">
              {Array.from(collected).map((id, i) => (
                <motion.div
                  key={id}
                  className="w-[26px] h-[22px] flex items-center justify-center"
                  initial={{ y: -30, rotate: -180, opacity: 0 }}
                  animate={{ y: 0, rotate: (i % 2 === 0 ? -1 : 1) * (5 + (i % 4) * 3), opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 12,
                    delay: 0.05,
                  }}
                >
                  <PieceMini id={id} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress footer */}
          <div className="px-3 py-2 flex items-center gap-2" style={{ borderTop: "1px solid var(--border-default)" }}>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-default)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                animate={{ width: `${(count / total) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--accent)" }}>
              {count}/{total}
            </span>
          </div>
        </div>

        {/* Label */}
        {count < total && (
          <motion.div
            className="absolute -top-8 left-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-bold"
            style={{ x: "-50%", background: "var(--accent)", color: "white" }}
            animate={{ y: [0, -3, 0], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Tap blocks to collect!
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Funny messages when pieces are missing
const FUNNY_MISSING = [
  "Hey! I'm missing pieces! Go tap them!",
  "You can't build me without ALL the blocks!",
  "I feel... incomplete. Find my parts!",
  "Would you leave a dino half-built?",
  "My legs are missing! This is not okay!",
  "I'm a LEGO raptor, not a LEGO ghost!",
  "Scroll up! My pieces are floating around!",
  "Tap tap tap! I need to be whole!",
];

// Final assembly in CTA — pieces fly from bottom-left box
function DinoAssemblyFinal({ collected, onComplete }: { collected: Set<string>; onComplete: () => void }) {
  const allCollected = collected.size === PIECE_IDS.length;
  const missing = PIECE_IDS.length - collected.size;
  const [showFunny, setShowFunny] = useState(false);
  const [hasTriggeredComplete, setHasTriggeredComplete] = useState(false);
  const funnyMsg = useMemo(() => FUNNY_MISSING[Math.floor(Math.random() * FUNNY_MISSING.length)], []);
  const assemblyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = assemblyRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !allCollected && collected.size > 0) {
          setShowFunny(true);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [allCollected, collected.size]);

  // Trigger confetti on completion
  useEffect(() => {
    if (allCollected && !hasTriggeredComplete) {
      setHasTriggeredComplete(true);
      setShowFunny(false);
      onComplete();
    }
  }, [allCollected, hasTriggeredComplete, onComplete]);

  return (
    <div ref={assemblyRef} className="flex flex-col items-center mb-8 relative">
      <motion.div
        animate={allCollected ? { y: [0, -10, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <svg width={220} height={180} viewBox="0 0 220 180" fill="none" style={{ overflow: "visible" }}>
          {PIECE_IDS.map((id, i) => (
            <motion.g
              key={id}
              initial={{ opacity: 0, scale: 0.15, x: -300, y: 400, rotate: 60 + i * 30 }}
              animate={
                collected.has(id)
                  ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
                  : { opacity: 0.06, scale: 0.85, x: 0, y: 0, rotate: 0 }
              }
              transition={{
                delay: collected.has(id) ? 0.3 + i * 0.1 : 0,
                duration: 1,
                type: "spring",
                stiffness: 70,
                damping: 11,
              }}
            >
              {DINO_SVG[id]}
            </motion.g>
          ))}
        </svg>
      </motion.div>

      {/* Funny message when incomplete */}
      {showFunny && !allCollected && (
        <motion.p
          className="mt-3 text-xs font-medium text-center"
          style={{ color: "rgba(255,255,255,0.5)", maxWidth: 240 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {funnyMsg}
          <span className="block text-[10px] mt-0.5 opacity-60">
            ({missing} piece{missing > 1 ? "s" : ""} missing — scroll up &amp; tap them!)
          </span>
        </motion.p>
      )}

      {/* Completion message */}
      {allCollected && (
        <motion.p
          className="mt-3 text-sm font-bold"
          style={{ color: "var(--accent)" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 1.5 }}
        >
          You built me! I love you!
        </motion.p>
      )}

      {/* Buy me a drink CTA — always visible, but extra eye-catching when complete */}
      <motion.a
        href="https://buymeacoffee.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold no-underline"
        style={{
          background: allCollected ? "#f59e0b" : "rgba(245,158,11,0.15)",
          color: allCollected ? "white" : "#f59e0b",
          border: allCollected ? "2px solid #f59e0b" : "2px solid rgba(245,158,11,0.3)",
          boxShadow: allCollected ? "0 0 30px rgba(245,158,11,0.4), 0 0 60px rgba(245,158,11,0.2)" : "none",
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={
          allCollected
            ? { opacity: 1, y: 0, scale: [1, 1.05, 1] }
            : { opacity: 1, y: 0 }
        }
        transition={
          allCollected
            ? { opacity: { delay: 2 }, y: { delay: 2 }, scale: { delay: 2.5, duration: 1.5, repeat: Infinity, ease: "easeInOut" } }
            : { delay: 0.5, duration: 0.4 }
        }
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v3M10 2v3M14 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {allCollected ? "Buy me a drink! You're amazing!" : "Buy me a drink"}
        {allCollected && (
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          >
            <SparkDeco size={14} color="white" />
          </motion.span>
        )}
      </motion.a>

      {!allCollected && (
        <motion.p
          className="mt-2 text-[10px]"
          style={{ color: "rgba(255,255,255,0.3)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Support the creator of this project
        </motion.p>
      )}
    </div>
  );
}

// Static dino for reuse (e.g. testimonials mascot)
function DinoMascot({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 0.82);
  return (
    <svg width={size} height={h} viewBox="0 0 220 180" fill="none">
      {PIECE_IDS.map((id) => <g key={id}>{DINO_SVG[id]}</g>)}
    </svg>
  );
}

// Context for LEGO collection state
function useLegoCollection() {
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const collect = useCallback((id: string) => {
    setCollected((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  return { collected, collect };
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


/* ─── Main export ────────────────────────────────────────────────────────── */
export function LandingPage() {
  const { collected, collect } = useLegoCollection();
  const [showConfetti, setShowConfetti] = useState(false);
  const triggerConfetti = useCallback(() => setShowConfetti(true), []);

  return (
    <main className="flex flex-col overflow-x-hidden">
      <FloatingThemeToggle />
      <GlobalCursor />
      <Confetti active={showConfetti} />
      <LegoBox collected={collected} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center px-6 pt-24 pb-0 text-center overflow-visible">
        {/* Slime mask background */}
        <HeroSlimeBg />

        {/* Scattered LEGO pieces — hero */}
        {SECTION_PIECES[0].pieces.map((id, i) => (
          <ScatteredPiece key={id} id={id} position={SECTION_PIECES[0].positions[i]} onCollect={collect} floatDelay={i} />
        ))}

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
        <motion.div className="relative z-10 mx-auto max-w-3xl"
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
        <motion.p className="relative z-10 mx-auto mt-6 max-w-md text-lg leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}>
          Upload a PNG or JPG. Get a clean, editable SVG in seconds.
          No Illustrator. No Figma. Just works.
        </motion.p>

        {/* CTAs */}
        <motion.div className="relative z-10 mt-8 flex flex-col items-center gap-3 sm:flex-row"
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

        <motion.p className="relative z-10 mt-4 text-xs" style={{ color: "var(--text-muted)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.4 }}>
          Loved by 2,400+ designers &amp; developers
        </motion.p>

        {/* Tilted product cards */}
        <div className="relative z-10 mt-16 w-full max-w-4xl h-[300px] hidden md:block">
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
        </div>
      </section>

      {/* ── Marquee 1 ─────────────────────────────────────────────────── */}
      <div className="mt-0"><MarqueeStrip /></div>

      {/* ── How it works (inverted) ────────────────────────────────────── */}
      <section id="how-it-works" className="relative px-6 py-28" style={{ background: "var(--bg-invert)" }}>
        {SECTION_PIECES[1].pieces.map((id, i) => (
          <ScatteredPiece key={id} id={id} position={SECTION_PIECES[1].positions[i]} onCollect={collect} floatDelay={i} />
        ))}
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
      <section className="relative px-6 py-28" style={{ background: "var(--bg-primary)" }}>
        {SECTION_PIECES[2].pieces.map((id, i) => (
          <ScatteredPiece key={id} id={id} position={SECTION_PIECES[2].positions[i]} onCollect={collect} floatDelay={i} />
        ))}
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
      <div className="relative">
        {SECTION_PIECES[3].pieces.map((id, i) => (
          <ScatteredPiece key={id} id={id} position={SECTION_PIECES[3].positions[i]} onCollect={collect} floatDelay={i} />
        ))}
        <AiComingSoon />
      </div>


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
          {/* LEGO dino assembles from collected pieces */}
          <DinoAssemblyFinal collected={collected} onComplete={triggerConfetti} />

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
