"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LOW_BALANCE_UNITS } from "@/lib/credits/constants";
import type { CreditBalanceResponse } from "@/lib/types";

const FONT_MONO = "auxMono, monospace";

/**
 * Always-visible credit balance.
 *
 * Lives in the top bar of every app page, not behind a menu. A balance people
 * cannot see is a balance they cannot reason about, and learning the number for
 * the first time at a paywall reads as a trap.
 *
 * Polls every 30s and on window focus so a purchase completed on Dodo's hosted
 * checkout — which credits the account via webhook, out of band from this tab —
 * shows up without a manual reload.
 */
export function CreditBadge() {
  const { data, isLoading, isError } = useQuery<CreditBalanceResponse>({
    queryKey: ["credits"],
    queryFn: async () => {
      const res = await fetch("/api/credits");
      if (!res.ok) throw new Error(`Failed to load credits (${res.status})`);
      return res.json();
    },
    // Credits can change outside this tab — a purchase completes on Dodo's
    // checkout page and lands via webhook, so the balance must catch up on its
    // own rather than waiting for a manual reload.
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Render nothing rather than flashing a zero — a momentary "0 credits"
  // reads as "you're broke" and is worse than a brief absence.
  if (isLoading || isError || !data) return null;

  const label = `${data.credits} credit${data.credits === "1" ? "" : "s"}`;

  // Red below 1.5 credits: at that point one more conversion plus a few exports
  // is all that is left, so the warning arrives while the user can still act on
  // it rather than at zero, mid-task.
  const isLow = data.balanceUnits < LOW_BALANCE_UNITS;

  const palette = isLow
    ? {
        background: "rgba(248,113,113,0.10)",
        border: "1px solid rgba(248,113,113,0.40)",
        color: "rgba(252,165,165,0.95)",
      }
    : {
        background: "rgba(120,255,180,0.08)",
        border: "1px solid rgba(120,255,180,0.30)",
        color: "rgba(150,255,200,0.92)",
      };

  return (
    <Link
      href="/pricing"
      style={{ textDecoration: "none" }}
      aria-label={`${data.credits} credits remaining. Buy more.`}
      title={
        isLow
          ? "Running low — click to top up"
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
