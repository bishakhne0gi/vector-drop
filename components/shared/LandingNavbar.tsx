"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ThemeToggle } from "./ThemeToggle";
import { LogoMark } from "./Logo";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 48);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-5xl px-6 py-5">
        <motion.div
          className="flex items-center justify-between"
          animate={
            scrolled
              ? {
                  backgroundColor: "var(--bg-glass-strong)",
                  borderColor: "var(--border-default)",
                  boxShadow: "var(--shadow-nav)",
                  backdropFilter: "blur(24px) saturate(180%)",
                  borderRadius: "1rem",
                  paddingLeft: "1.25rem",
                  paddingRight: "1.25rem",
                  paddingTop: "0.625rem",
                  paddingBottom: "0.625rem",
                }
              : {
                  backgroundColor: "transparent",
                  borderColor: "transparent",
                  boxShadow: "none",
                  backdropFilter: "blur(0px)",
                  borderRadius: "0rem",
                  paddingLeft: "0rem",
                  paddingRight: "0rem",
                  paddingTop: "0rem",
                  paddingBottom: "0rem",
                }
          }
          style={{ border: "1px solid transparent" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Logo — very subtle */}
          <Link href="/" className="flex items-center gap-2 group">
            <LogoMark size={24} />
            <motion.span
              className="text-sm font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
              animate={{ opacity: scrolled ? 1 : 0.75 }}
              transition={{ duration: 0.2 }}
            >
              VectorDrop
            </motion.span>
          </Link>

          {/* Right — minimal */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <motion.div
              animate={{ opacity: scrolled ? 1 : 0.7 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                Get started
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
