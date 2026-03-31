"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CloudArrowUp, DownloadSimple } from "@phosphor-icons/react";
import { LogoMark } from "./Logo";
import { useEffect, useRef } from "react";

const steps = [
  {
    label: "Step 01",
    title: "Upload your image",
    description: "Drop in a PNG, JPG, or WebP and start instantly without extra setup.",
    icon: <CloudArrowUp size={22} weight="regular" />,
  },
  {
    label: "Step 02",
    title: "Convert it to vector",
    description: "The image is traced into crisp paths with cleaner edges and editable layers.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    label: "Step 03",
    title: "Export the SVG",
    description: "Fine-tune the result and download a lightweight SVG that is ready to use.",
    icon: <DownloadSimple size={22} weight="regular" />,
  },
];

const features = [
  {
    title: "Cleaner output",
    description: "Sharper paths, simpler shapes, and SVGs that are easier to open and edit.",
  },
  {
    title: "Built-in editing",
    description: "Make small visual adjustments before exporting instead of jumping into another app.",
  },
  {
    title: "Works in your workflow",
    description: "Open the exported SVG in Figma, Illustrator, Inkscape, or directly in the browser.",
  },
  {
    title: "Fast to try",
    description: "The experience stays lightweight so first-time users can convert without friction.",
  },
];

function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[2rem] border border-white/8 bg-white/[0.04] shadow-[0_24px_60px_rgba(0,0,0,0.18)] ${className}`}>
      {children}
    </div>
  );
}


function StepCard({
  label,
  title,
  description,
  icon,
}: {
  label: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Surface className="p-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          {label}
        </span>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-[var(--accent)]">
          {icon}
        </div>
      </div>
      <h3 className="mt-6 text-xl font-semibold tracking-tight text-white/92">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/50">
        {description}
      </p>
    </Surface>
  );
}

function LegoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const hoveredStuds = useRef<Set<number>>(new Set());
  const studSpacing = 32; // Distance between studs
  const hoverRadius = 70; // Radius for hover detection

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const studColors = {
      normal: "#232323",
      highlight: "#d4633e",
    };

    const drawStud = (x: number, y: number, isHovered: boolean) => {
      const baseColor = isHovered ? studColors.highlight : studColors.normal;

      // Deep shadow underneath
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.arc(x, y + 2.4, 7.6, 0, Math.PI * 2);
      ctx.fill();

      // Outer shadow ring
      ctx.fillStyle = "#121212";
      ctx.beginPath();
      ctx.arc(x, y, 7.2, 0, Math.PI * 2);
      ctx.fill();

      // Outer rim/border
      ctx.fillStyle = "#1d1d1d";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      // Mid-tone outer ring
      ctx.fillStyle = "#242424";
      ctx.beginPath();
      ctx.arc(x, y, 6.7, 0, Math.PI * 2);
      ctx.fill();

      // Main stud body
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(x, y, 6.4, 0, Math.PI * 2);
      ctx.fill();

      // Lighter upper surface
      ctx.fillStyle = isHovered ? "#e07856" : "#4b4b4b";
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Mid-light tone
      ctx.fillStyle = isHovered ? "#d46a48" : "#101010";
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Recessed center area
      ctx.fillStyle = isHovered ? "#c55a38" : "#2e2e2e";
      ctx.beginPath();
      ctx.arc(x, y, 4.8, 0, Math.PI * 2);
      ctx.fill();

      // Inner depression
      ctx.fillStyle = isHovered ? "#b54a28" : "#1f1f1f";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Inner rim
      ctx.fillStyle = "#181818";
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Center stud with subtle fill, inset highlight, and soft drop shadow
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2.5;
      ctx.fillStyle = "#262626";
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Approximate inset highlight along the upper inner edge
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(x, y - 0.1, 2.1, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    };

    const drawLego = () => {
      // Background
      ctx.fillStyle = "#161516";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      hoveredStuds.current.clear();

      // Find which 2x2 block the cursor is over
      const blockX = Math.floor(mousePos.current.x / studSpacing);
      const blockY = Math.floor(mousePos.current.y / studSpacing);
      const blockCenterX = blockX * studSpacing + 16;
      const blockCenterY = blockY * studSpacing + 16;

      // Check if cursor is close to the block center
      const distanceToBlock = Math.hypot(
        blockCenterX - mousePos.current.x,
        blockCenterY - mousePos.current.y
      );
      const isBlockHovered = distanceToBlock < hoverRadius;

      // First pass: Draw colored squares for hovered bricks
      if (isBlockHovered) {
        for (let bx = blockX; bx <= blockX + 1; bx++) {
          for (let by = blockY; by <= blockY + 1; by++) {
            const rectX = bx * studSpacing;
            const rectY = by * studSpacing;
            ctx.fillStyle = "#d4633e";
            ctx.fillRect(rectX, rectY, studSpacing, studSpacing);
          }
        }
      }

      // Second pass: Draw studs in grid (centered in each square)
      for (let x = 16; x < canvas.width; x += studSpacing) {
        for (let y = 16; y < canvas.height; y += studSpacing) {
          // Check if this stud is part of the hovered 2x2 block
          const gridX = Math.round((x - 16) / studSpacing);
          const gridY = Math.round((y - 16) / studSpacing);

          let isHovered = false;
          if (isBlockHovered) {
            // Check if this stud is in the 2x2 block
            isHovered =
              gridX >= blockX &&
              gridX <= blockX + 1 &&
              gridY >= blockY &&
              gridY <= blockY + 1;
          }

          if (isHovered) {
            hoveredStuds.current.add(x * 10000 + y);
          }

          drawStud(x, y, isHovered);
        }
      }

      // Draw subtle grid lines
      ctx.strokeStyle = "#030303";
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.5;
      for (let x = 0; x < canvas.width; x += studSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += studSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      drawLego();
      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

export function LandingPage() {
  return (
    <main className="bg-[#161516] text-white">
      <section className="relative overflow-hidden px-6 pb-20 pt-24 h-screen">
        <LegoBackground />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center relative z-20">
            {/* Dark overlay background for text readability */}
            {/* <div className="absolute left-1/2 top-1/2 -z-10 h-[80rem] w-[80rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#161516] blur-3xl" /> */}

            <span className="inline-flex rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/58">
              Simple image to SVG
            </span>
            <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-[-0.05em] md:text-7xl">
              Turn any image into a clean, editable SVG.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/56 md:text-lg">
              Upload a raster file, review the vector result, and export without the clutter of a heavy design workflow.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:shadow-lg hover:shadow-white/20">
                Convert for free
                <ArrowRight size={13} weight="bold" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/30"
              >
                See how it works
              </a>
            </div>

            {/* MacBook Demo Placeholder */}
            <div className="relative z-20 mx-auto mt-20 max-w-4xl">
              <div className="rounded-2xl bg-gradient-to-b from-white/10 to-white/5 p-1 shadow-2xl">
                {/* MacBook bezel */}
                <div className="rounded-xl bg-black p-8">
                  {/* Screen content area */}
                  <div className="aspect-video rounded-lg bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-white/40 text-sm font-medium">Application Demo</div>
                      <div className="mt-4 h-32 w-32 rounded-lg bg-white/5 border border-white/10" />
                    </div>
                  </div>
                </div>
                {/* MacBook notch */}
                <div className="mx-auto w-1/3 rounded-b-3xl bg-black py-2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/8 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              How it works
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              Three simple steps from upload to export.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/52">
              The layout is intentionally straightforward so the product feels clearer and calmer on first glance.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <StepCard
                key={step.label}
                label={step.label}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Surface className="p-8 md:p-10">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Product benefits
            </span>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              Subtle presentation, practical tools.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/52">
              Instead of decorative motion, the page now leans on spacing, contrast, and a few quiet surfaces to make the product feel more focused.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-5"
                >
                  <h3 className="text-base font-semibold text-white/90">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/48">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-8 md:p-10">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Export targets
            </span>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Figma", "Illustrator", "Inkscape", "Web", "React", "Marketing"].map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-white/8 px-4 py-2 text-sm text-white/76"
                >
                  {tool}
                </span>
              ))}
            </div>
            <div className="mt-10 rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-6">
              <p className="text-sm leading-6 text-white/50">
                Exported files stay easy to move between design, development, and production workflows without adding extra cleanup.
              </p>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                  <span>SVG quality</span>
                  <span>High</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div className="h-2 w-[88%] rounded-full bg-[var(--accent)]" />
                </div>
              </div>
            </div>
          </Surface>
        </div>
      </section>

      <section className="px-6 pb-20 pt-4">
        <div className="mx-auto max-w-5xl rounded-[2.25rem] border border-white/8 bg-gradient-to-b from-white/[0.05] to-white/[0.03] px-8 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:px-12 md:py-14">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
            Start converting in seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/54">
            The landing page now stays focused on the product itself, with no floating pieces, no playful overlays, and no animation-heavy distractions.
          </p>
          <div className="mt-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:shadow-lg hover:shadow-white/20">
              Open dashboard
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-[#09090b] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size={22} />
            <span className="text-sm font-semibold tracking-tight text-white/90">
              VectorDrop
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-white/50">
              Sign in
            </Link>
            <Link href="/dashboard" className="text-sm text-white/50">
              Dashboard
            </Link>
          </div>
          <p className="text-xs text-white/40">
            © 2026 VectorDrop. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
