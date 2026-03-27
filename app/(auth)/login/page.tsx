"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { createBrowserClient } from "@supabase/ssr";
import { Input } from "@/components/ui/Input";
import { Logo, LogoMark } from "@/components/shared/Logo";
import { FloatingThemeToggle } from "@/components/shared/FloatingThemeToggle";

type Mode = "signin" | "signup";

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setModeAndReset(m: Mode) {
    setMode(m);
    setError(null);
    setSuccess(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) setError(authError.message);
        else router.push("/dashboard");
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) setError(authError.message);
        else setSuccess("Check your email to confirm your account.");
      }
    });
  }

  return (
    <div className="relative flex min-h-svh overflow-hidden">
      <div className="page-bg" aria-hidden="true" />
      <FloatingThemeToggle />

      {/* Left — branding panel (desktop) */}
      <motion.div
        className="relative hidden flex-col items-center justify-center lg:flex lg:w-[46%]"
        style={{ borderRight: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex max-w-sm flex-col items-center gap-10 px-12 text-center">
          <Link href="/">
            <Logo size={32} textClassName="text-base" />
          </Link>

          {/* Mini product demo card */}
          <motion.div
            className="w-full overflow-hidden rounded-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.55, ease: "easeOut" }}
          >
            {/* Window bar */}
            <div className="flex items-center gap-1.5 border-b border-[var(--border-default)] px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
              <span className="ml-2 text-xs text-[var(--text-muted)]">image.png → vector.svg</span>
            </div>

            <div className="grid grid-cols-3 items-center gap-4 p-6">
              {/* Pixel mock */}
              <div className="flex aspect-square flex-col items-center justify-center rounded-xl border border-[var(--border-default)]" style={{ background: "var(--bg-subtle)" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  {[0, 1, 2, 3].map((r) =>
                    [0, 1, 2, 3].map((c) => (
                      <rect
                        key={`${r}-${c}`}
                        x={3 + c * 5}
                        y={3 + r * 5}
                        width="4"
                        height="4"
                        rx="0.6"
                        fill="var(--accent)"
                        opacity={(r + c) % 2 === 0 ? 0.45 : 0.1}
                      />
                    ))
                  )}
                </svg>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "var(--accent)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </motion.div>
              </div>

              {/* SVG output */}
              <div className="flex aspect-square flex-col items-center justify-center rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "var(--accent-border)" }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M5 30 C8 22 14 14 18 18 C22 22 28 10 31 5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <circle cx="5" cy="30" r="2" fill="var(--accent)" />
                  <circle cx="18" cy="18" r="1.5" fill="var(--accent)" opacity="0.5" />
                  <circle cx="31" cy="5" r="2" fill="var(--accent)" />
                </svg>
              </div>
            </div>

            {/* Progress */}
            <div className="border-t border-[var(--border-default)] px-6 py-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Tracing paths</span>
                <span style={{ color: "var(--accent)" }}>Done ✓</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--border-default)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--accent)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Turn any raster image into a clean, editable SVG in seconds.
          </p>
        </div>
      </motion.div>

      {/* Right — auth form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 lg:px-16">
        {/* Mobile logo */}
        <motion.div
          className="mb-10 lg:hidden"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link href="/">
            <Logo />
          </Link>
        </motion.div>

        <motion.div
          className="w-full max-w-[360px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          {/* Mode tabs — sliding pill */}
          <div
            className="mb-7 flex overflow-hidden rounded-xl p-1"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
              position: "relative",
            }}
          >
            {/* Sliding pill background */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg"
              style={{ background: "var(--accent)", width: "calc(50% - 4px)" }}
              animate={{ left: mode === "signin" ? "4px" : "calc(50%)" }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModeAndReset(m)}
                className="relative flex-1 rounded-lg py-2 text-sm font-medium z-10 transition-colors duration-200"
                style={{ color: mode === m ? "white" : "var(--text-secondary)" }}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Form card */}
          <motion.div
            className="overflow-hidden rounded-2xl p-7"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
            layout
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="py-4 text-center"
                >
                  <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "rgba(16,185,129,0.12)" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Check your email</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{success}</p>
                  <button
                    type="button"
                    onClick={() => { setSuccess(null); setMode("signin"); }}
                    className="mt-5 text-sm font-medium transition-opacity hover:opacity-70"
                    style={{ color: "var(--accent)" }}
                  >
                    Back to sign in
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-4"
                >
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    label={mode === "signup" ? "Password (min. 6 chars)" : "Password"}
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={error ?? undefined}
                  />
                  <motion.button
                    type="submit"
                    disabled={isPending}
                    className="btn-accent mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    {isPending && (
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white"
                        style={{ animation: "spin 0.7s linear infinite" }}
                      />
                    )}
                    {isPending
                      ? mode === "signin" ? "Signing in…" : "Creating account…"
                      : mode === "signin" ? "Sign in" : "Create account"}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {!success && (
            <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setModeAndReset(mode === "signin" ? "signup" : "signin")}
                className="font-medium transition-opacity hover:opacity-75"
                style={{ color: "var(--accent)" }}
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
