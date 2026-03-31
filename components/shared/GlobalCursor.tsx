"use client";

import { useRef, useEffect, useCallback } from "react";

/**
 * Global custom cursor overlay — renders the magnetic ring / crosshair / orbiting-dots
 * effect from the hero section across the entire application.
 * Uses a full-viewport canvas so it layers on top of everything.
 */
export function GlobalCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const visibleRef = useRef(false);
  const hoverRef = useRef(0);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const W = cvs.width;
    const H = cvs.height;
    const t = performance.now() * 0.001;

    // Smooth visibility lerp
    const hTarget = visibleRef.current ? 1 : 0;
    hoverRef.current += (hTarget - hoverRef.current) * 0.06;
    const h = hoverRef.current;

    // Smooth mouse lerp
    mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.12;
    mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.12;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    ctx.clearRect(0, 0, W, H);

    if (h < 0.005) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // Outer dashed ring
    const ringRadius = 28 + Math.sin(t * 2) * 3;
    const ringAlpha = h * 0.35;
    ctx.strokeStyle = `rgba(13,148,136,${ringAlpha})`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -t * 35;
    ctx.beginPath();
    ctx.arc(mx, my, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner ring
    const innerR = 12 + Math.sin(t * 3) * 2;
    ctx.strokeStyle = `rgba(20,184,166,${h * 0.25})`;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 6]);
    ctx.lineDashOffset = t * 25;
    ctx.beginPath();
    ctx.arc(mx, my, innerR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshair lines
    const crossLen = 7;
    const crossGap = ringRadius + 5;
    ctx.strokeStyle = `rgba(13,148,136,${h * 0.2})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(mx - crossGap - crossLen, my); ctx.lineTo(mx - crossGap, my);
    ctx.moveTo(mx + crossGap, my); ctx.lineTo(mx + crossGap + crossLen, my);
    ctx.moveTo(mx, my - crossGap - crossLen); ctx.lineTo(mx, my - crossGap);
    ctx.moveTo(mx, my + crossGap); ctx.lineTo(mx, my + crossGap + crossLen);
    ctx.stroke();

    // Orbiting dots
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4 + t * 1.5;
      const orbitR = ringRadius + 3;
      const ox = mx + Math.cos(angle) * orbitR;
      const oy = my + Math.sin(angle) * orbitR;
      ctx.fillStyle = `rgba(20,184,166,${h * 0.5})`;
      ctx.beginPath();
      ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centre dot
    ctx.fillStyle = `rgba(13,148,136,${h * 0.4})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
    ctx.fill();

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      cvs.width = window.innerWidth * dpr;
      cvs.height = window.innerHeight * dpr;
      cvs.style.width = `${window.innerWidth}px`;
      cvs.style.height = `${window.innerHeight}px`;
      const ctx = cvs.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const isInteractive = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.closest("button, a, [role='button'], input, textarea, select")) return true;
      if (el.style.cursor === "pointer" || getComputedStyle(el).cursor === "pointer") return true;
      return false;
    };

    const handleMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
      visibleRef.current = !isInteractive(e.target);
    };
    const handleEnter = () => { visibleRef.current = true; };
    const handleLeave = () => { visibleRef.current = false; };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseenter", handleEnter);
    document.addEventListener("mouseleave", handleLeave);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseenter", handleEnter);
      document.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
