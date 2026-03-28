"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useClerk, useUser } from "@clerk/nextjs";
import { FloatingThemeToggle } from "./FloatingThemeToggle";
import { Logo } from "./Logo";

interface NavbarProps {
  userName?: string | null;
}

export function Navbar({ userName }: NavbarProps) {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  function handleSignOut() {
    void signOut({ redirectUrl: "/login" });
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
              {isLoaded && (
                user ? (
                  <motion.button
                    type="button"
                    onClick={handleSignOut}
                    className="btn-ghost rounded-xl px-3 py-1.5 text-xs"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97, y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    Sign out
                  </motion.button>
                ) : (
                  <Link href="/login">
                    <motion.span
                      className="btn-accent rounded-xl px-3 py-1.5 text-xs cursor-pointer"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97, y: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      Sign in
                    </motion.span>
                  </Link>
                )
              )}

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
