"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Logo } from "./Logo";

const FONT_MONO = "auxMono, monospace";
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        background: "rgba(13,13,13,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        fontFamily: FONT_BODY,
      }}
    >
      <div
        style={{
          maxWidth: 1024,
          margin: "0 auto",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo
            className="text-white"
            textClassName="!text-white"
          />
        </Link>

        {isLoaded && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  height: 30,
                  padding: "0 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 10,
                  fontFamily: FONT_MONO,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  cursor: "pointer",
                  borderRadius: 0,
                  fontWeight: 600,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                }}
              >
                Sign out
              </button>
            ) : (
              <Link href="/login" style={{ textDecoration: "none" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 30,
                    padding: "0 14px",
                    background: "#ffffff",
                    color: "#161516",
                    fontSize: 10,
                    fontFamily: FONT_MONO,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    fontWeight: 700,
                    cursor: "pointer",
                    borderRadius: 0,
                  }}
                >
                  Sign in
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
