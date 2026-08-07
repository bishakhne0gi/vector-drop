"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SIGNUP_GRANT_UNITS, CONVERSION_UNITS } from "@/lib/credits/constants";
import type { CreditBalanceResponse } from "@/lib/types";

const FONT_MONO = "auxMono, monospace";

/**
 * Always-visible credit balance.
 *
 * Lives in the top bar of every app page, not behind a menu. A balance people
 * cannot see is a balance they cannot reason about, and learning the number for
 * the first time at a paywall reads as a trap.
 *
 * While the signup grant is untouched it shows what the grant BUYS rather than
 * a bare number — "3" means nothing to someone who has never priced a
 * conversion.
 */
export function CreditBadge() {
  const { data, isLoading, isError } = useQuery<CreditBalanceResponse>({
    queryKey: ["credits"],
    queryFn: async () => {
      const res = await fetch("/api/credits");
      if (!res.ok) throw new Error(`Failed to load credits (${res.status})`);
      return res.json();
    },
    staleTime: 10_000,
  });

  // Render nothing rather than flashing a zero — a momentary "0 credits"
  // reads as "you're broke" and is worse than a brief absence.
  if (isLoading || isError || !data) return null;

  const untouchedGrant = data.balanceUnits === SIGNUP_GRANT_UNITS;
  const cannotConvert = data.balanceUnits < CONVERSION_UNITS;

  const label = untouchedGrant
    ? "2 projects, on us"
    : `${data.credits} credit${data.credits === "1" ? "" : "s"}`;

  const palette = cannotConvert
    ? {
        background: "rgba(255,159,67,0.10)",
        border: "1px solid rgba(255,159,67,0.35)",
        color: "rgba(255,183,110,0.95)",
      }
    : {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.70)",
      };

  return (
    <Link
      href="/pricing"
      style={{ textDecoration: "none" }}
      aria-label={`${data.credits} credits remaining. Buy more.`}
      title={
        cannotConvert
          ? "Not enough credits to convert — click to top up"
          : `${data.credits} credits remaining`
      }
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 30,
          padding: "0 12px",
          fontSize: 10,
          fontFamily: FONT_MONO,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          fontWeight: 600,
          borderRadius: 0,
          whiteSpace: "nowrap",
          ...palette,
        }}
      >
        {label}
      </span>
    </Link>
  );
}
