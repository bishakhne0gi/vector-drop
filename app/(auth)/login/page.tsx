import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { FloatingThemeToggle } from "@/components/shared/FloatingThemeToggle";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh overflow-hidden">
      <div className="page-bg" aria-hidden="true" />
      <FloatingThemeToggle />

      {/* Left — branding panel (desktop only) */}
      <div
        className="relative hidden flex-col items-center justify-center lg:flex lg:w-[46%]"
        style={{ borderRight: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}
      >
        <div className="flex max-w-sm flex-col items-center gap-10 px-12 text-center">
          <Link href="/">
            <Logo size={32} textClassName="text-base" />
          </Link>

          {/* Mini product demo card */}
          <div
            className="w-full overflow-hidden rounded-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center gap-1.5 border-b border-[var(--border-default)] px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
              <span className="ml-2 text-xs text-[var(--text-muted)]">image.png → vector.svg</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4 p-6">
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
              <div className="flex items-center justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--accent)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </div>
              <div className="flex aspect-square flex-col items-center justify-center rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "var(--accent-border)" }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M5 30 C8 22 14 14 18 18 C22 22 28 10 31 5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <circle cx="5" cy="30" r="2" fill="var(--accent)" />
                  <circle cx="18" cy="18" r="1.5" fill="var(--accent)" opacity="0.5" />
                  <circle cx="31" cy="5" r="2" fill="var(--accent)" />
                </svg>
              </div>
            </div>
            <div className="border-t border-[var(--border-default)] px-6 py-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Tracing paths</span>
                <span style={{ color: "var(--accent)" }}>Done ✓</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--border-default)" }}>
                <div className="h-full w-full rounded-full" style={{ background: "var(--accent)" }} />
              </div>
            </div>
          </div>

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
