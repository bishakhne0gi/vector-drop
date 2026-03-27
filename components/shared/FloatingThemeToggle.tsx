"use client";

import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./ThemeProvider";

export function FloatingThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed right-5 top-5 z-50">
      <motion.button
        type="button"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
        style={{
          background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.72)",
          border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: isDark
            ? "0 2px 12px rgba(0,0,0,0.3)"
            : "0 2px 12px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88, rotate: 15 }}
        transition={{ type: "spring", stiffness: 600, damping: 22 }}
      >
        {/* Ripple on toggle */}
        <AnimatePresence>
          <motion.span
            key={theme}
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: "var(--accent)" }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </AnimatePresence>

        {/* Icon swap */}
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.svg
              key="moon"
              width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </motion.svg>
          ) : (
            <motion.svg
              key="sun"
              width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              initial={{ opacity: 0, rotate: 45, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -45, scale: 0.6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
