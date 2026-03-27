"use client";

import { motion } from "motion/react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative flex h-7 w-[52px] items-center rounded-full border focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 ${
        isDark
          ? "border-white/8 bg-white/6"
          : "border-black/8 bg-black/4"
      } ${className}`}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
    >
      <motion.span
        className="absolute left-0.5 flex h-6 w-6 items-center justify-center rounded-full"
        animate={{
          x: isDark ? 25 : 0,
          background: isDark
            ? "var(--accent)"
            : "var(--accent)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          boxShadow: "0 1px 6px var(--accent-glow)",
        }}
      >
        <motion.div
          animate={{ rotate: isDark ? 0 : 90, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {isDark ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </motion.div>
      </motion.span>
    </motion.button>
  );
}
