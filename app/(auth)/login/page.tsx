"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { FloatingThemeToggle } from "@/components/shared/FloatingThemeToggle";

const STEPS = [
  { label: "Upload", desc: "image.png" },
  { label: "Normalize", desc: "resize + blur" },
  { label: "Trace", desc: "vector paths" },
  { label: "Assemble", desc: "output.svg" },
];

function MockConversionDemo() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // reset
      setStep(0); setProgress(0); setDone(false);
      await delay(600);

      for (let s = 0; s < STEPS.length; s++) {
        if (cancelled) return;
        setStep(s);
        // animate progress within this step
        const start = (s / STEPS.length) * 100;
        const end = ((s + 1) / STEPS.length) * 100;
        for (let p = start; p <= end; p += 2) {
          if (cancelled) return;
          setProgress(Math.round(p));
          await delay(60);
        }
      }
      if (!cancelled) { setDone(true); setProgress(100); }
      await delay(1800);
      if (!cancelled) run();
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Titlebar */}
      <div className="flex items-center gap-1.5 border-b border-[var(--border-default)] px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
        <span className="ml-2 text-xs text-[var(--text-muted)]">image.png → vector.svg</span>
        {done && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            Done
          </span>
        )}
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-1.5 px-4 py-3">
        {STEPS.map((s, i) => {
          const isActive = i === step && !done;
          const isDone = done || i < step;
          return (
            <div
              key={s.label}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-500"
              style={{
                background: isDone
                  ? "rgba(16,185,129,0.12)"
                  : isActive
                    ? "var(--accent-bg)"
                    : "var(--bg-subtle)",
                color: isDone ? "#10b981" : isActive ? "var(--accent)" : "var(--text-muted)",
                border: `1px solid ${isDone ? "rgba(16,185,129,0.2)" : isActive ? "var(--accent-border)" : "transparent"}`,
                transform: isActive ? "scale(1.08)" : "scale(1)",
                boxShadow: isActive ? "0 0 10px var(--accent-glow)" : "none",
              }}
            >
              {isDone ? (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : isActive ? (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--accent)", animation: "pulse-dot 1s ease-in-out infinite" }}
                />
              ) : null}
              {s.label}
            </div>
          );
        })}
      </div>

      {/* Central graphic: pixel grid → SVG path */}
      <div className="grid grid-cols-3 items-center gap-3 px-5 pb-3">
        {/* Source image — pixels */}
        <div
          className="flex aspect-square items-center justify-center rounded-xl"
          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            {[0,1,2,3,4].map(r => [0,1,2,3,4].map(c => {
              const idx = r * 5 + c;
              const active = !done ? idx <= (step * 6 + 5) : true;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={2 + c * 7.5}
                  y={2 + r * 7.5}
                  width="6"
                  height="6"
                  rx="1"
                  fill="var(--accent)"
                  style={{
                    opacity: active ? ((r + c) % 3 === 0 ? 0.8 : (r + c) % 2 === 0 ? 0.4 : 0.15) : 0.08,
                    transition: "opacity 0.4s ease",
                  }}
                />
              );
            }))}
          </svg>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              background: done ? "#10b981" : "var(--accent)",
              transition: "background 0.4s ease",
              boxShadow: done ? "0 0 12px rgba(16,185,129,0.3)" : "0 0 12px var(--accent-glow)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
        </div>

        {/* Output SVG path animation */}
        <div
          className="flex aspect-square items-center justify-center rounded-xl"
          style={{
            background: "var(--bg-subtle)",
            border: `1px solid ${done ? "rgba(16,185,129,0.3)" : "var(--accent-border)"}`,
            transition: "border-color 0.4s ease",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M5 35 C10 25 16 12 20 18 C24 24 30 8 35 4"
              stroke={done ? "#10b981" : "var(--accent)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              style={{
                strokeDasharray: 70,
                strokeDashoffset: done ? 0 : 70 - (progress / 100) * 70,
                transition: "stroke-dashoffset 0.4s ease, stroke 0.4s ease",
              }}
            />
            <circle cx="5" cy="35" r="2.5" fill={done ? "#10b981" : "var(--accent)"} style={{ transition: "fill 0.4s ease" }} />
            <circle cx="35" cy="4" r="2.5" fill={done ? "#10b981" : "var(--accent)"} style={{ opacity: progress > 80 ? 1 : 0, transition: "opacity 0.4s ease, fill 0.4s ease" }} />
          </svg>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-5">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">
            {done ? "Vector ready" : STEPS[step]?.desc ?? "Processing"}
          </span>
          <span style={{ color: done ? "#10b981" : "var(--accent)" }}>
            {progress}%{done ? " ✓" : ""}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--border-default)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: done ? "#10b981" : "linear-gradient(90deg, var(--accent), var(--accent-light))",
              boxShadow: done ? "0 0 6px rgba(16,185,129,0.4)" : "0 0 6px var(--accent-glow)",
              transition: "width 0.3s ease, background 0.4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function LoginPage() {
  return (
    <div
      className="relative flex min-h-svh overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <FloatingThemeToggle />

      {/* Left — branding panel (desktop only) */}
      <div
        className="relative hidden flex-col items-center justify-center lg:flex lg:w-[46%]"
        style={{ borderRight: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}
      >
        {/* Subtle blob */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            width: "60%",
            aspectRatio: "1",
            borderRadius: "50%",
            top: "-10%",
            left: "-10%",
            background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
            animation: "blob-drift 14s ease-in-out infinite",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            width: "50%",
            aspectRatio: "1",
            borderRadius: "50%",
            bottom: "-10%",
            right: "-5%",
            background: "radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%)",
            animation: "blob-drift 20s ease-in-out infinite reverse",
            animationDelay: "-6s",
          }}
        />

        <div className="relative z-10 flex max-w-sm flex-col items-center gap-8 px-12 text-center">
          <Link href="/">
            <Logo size={32} textClassName="text-base" />
          </Link>

          <MockConversionDemo />

          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Turn any raster image into a clean, editable SVG in seconds.
          </p>
        </div>
      </div>

      {/* Right — Clerk auth form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 lg:px-16">
        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <SignIn
          routing="hash"
          signUpUrl="/login"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full max-w-[380px]",
              card: "bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-card)] rounded-2xl",
              headerTitle: "text-[var(--text-primary)]",
              headerSubtitle: "text-[var(--text-secondary)]",
              formButtonPrimary: "btn-accent rounded-xl text-sm font-medium",
              formFieldInput: "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-primary)] rounded-xl",
              formFieldLabel: "text-[var(--text-secondary)] text-sm",
              footerActionLink: "text-[var(--accent)]",
              socialButtonsBlockButton: "border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card)]",
              dividerLine: "bg-[var(--border-default)]",
              dividerText: "text-[var(--text-muted)]",
            },
          }}
        />
      </div>
    </div>
  );
}
