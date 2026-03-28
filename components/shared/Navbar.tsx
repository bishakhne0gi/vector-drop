"use client";

import { useTransition } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { FloatingThemeToggle } from "./FloatingThemeToggle";
import { Logo } from "./Logo";

interface NavbarProps {
  userName?: string | null;
}

export function Navbar({ userName }: NavbarProps) {
  const [isSigningOut, startSignOut] = useTransition();

  function handleSignOut() {
    startSignOut(async () => {
      await fetch("/api/auth/signout", { method: "POST" });
      // Full page navigation ensures the proxy sees the cleared session cookie
      window.location.href = "/login";
    });
  }

  return (
    <>
      {/* Theme toggle only floating on md+ screens — on mobile it lives in the navbar row */}
      <div className="hidden md:block">
        <FloatingThemeToggle />
      </div>

      <motion.header
        className="w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Logo />
            </Link>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="btn-ghost rounded-xl px-3 py-1.5 text-xs disabled:opacity-40"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97, y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </motion.button>

              {/* Theme toggle inline on mobile only */}
              <div className="md:hidden">
                <FloatingThemeToggle inline />
              </div>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}
