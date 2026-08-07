import { createServiceClient } from "@/lib/api/supabase";
import { SIGNUP_GRANT_UNITS } from "@/lib/credits/constants";
import { ledgerKeys } from "@/lib/credits/keys";
import type { LedgerReason, UnlockKind } from "@/lib/types";

/**
 * Typed access to the credit system.
 *
 * All balance mutation happens inside the Postgres functions grant_units and
 * spend_units (migration 0011). Nothing here — and nothing anywhere else —
 * updates user_credits directly: the atomicity, idempotency, and row locking
 * that keep balances correct live in the database, not in application code.
 */

/** Thrown when a spend is attempted below the required balance. */
export class InsufficientCreditsError extends Error {
  constructor() {
    super("insufficient_credits");
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Grants the signup allowance if this account has never received one.
 *
 * Clerk's user.created webhook is the primary path, but it is not a guarantee:
 * the endpoint may not be configured, the secret may be missing, or the
 * delivery may simply fail — and the result is a brand-new user staring at 0
 * credits, unable to convert anything. The backfill script cannot rescue them
 * either, because it only finds users who already own projects or icons.
 *
 * So the grant is also applied lazily, on first contact. Idempotent on
 * `signup:{userId}`, so this and the webhook cannot both grant.
 *
 * Returns the balance in units.
 */
export async function ensureSignupGrant(userId: string): Promise<number> {
  const svc = createServiceClient();

  const { data: existing } = await svc
    .from("user_credits")
    .select("balance_units")
    .eq("user_id", userId)
    .maybeSingle();

  // A row means this account has already been through the grant path.
  if (existing) return (existing.balance_units as number) ?? 0;

  const result = await grantUnits({
    userId,
    units: SIGNUP_GRANT_UNITS,
    reason: "signup_grant",
    idempotencyKey: ledgerKeys.signup(userId),
    metadata: { source: "lazy_grant" },
  });

  return result.balanceUnits;
}

/** Current balance in units (tenths of a credit). Missing row means zero. */
export async function getBalance(userId: string): Promise<number> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("user_credits")
    .select("balance_units")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.balance_units as number | undefined) ?? 0;
}

/** True when the user has already paid for this thing — serve it free. */
export async function isUnlocked(
  userId: string,
  kind: UnlockKind,
  refId: string,
): Promise<boolean> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("ref_id", refId)
    .maybeSingle();
  return !!data;
}

/**
 * Adds units. Idempotent on `idempotencyKey`.
 *
 * `granted: false` means the key was already used and the balance is unchanged —
 * the expected outcome for a redelivered webhook, not an error.
 */
export async function grantUnits(args: {
  userId: string;
  units: number;
  reason: LedgerReason;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}): Promise<{ granted: boolean; balanceUnits: number }> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("grant_units", {
    p_user_id: args.userId,
    p_delta_units: args.units,
    p_reason: args.reason,
    p_idempotency_key: args.idempotencyKey,
    p_metadata: args.metadata ?? null,
  });

  if (error) throw new Error(`grant_units failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  return { granted: !!row?.granted, balanceUnits: row?.balance_units ?? 0 };
}

/**
 * Charges for one unlockable thing.
 *
 * `charged: false` means it was already unlocked (or cost zero) — a free
 * re-download, a format change, or a retried request.
 *
 * Pass `units: 0` to record a permanent entitlement without touching the
 * balance, as the original converted version does.
 *
 * @throws InsufficientCreditsError when the balance is short.
 */
export async function spendUnits(args: {
  userId: string;
  kind: UnlockKind;
  refId: string;
  units: number;
  reason: LedgerReason;
}): Promise<{ charged: boolean; balanceUnits: number }> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("spend_units", {
    p_user_id: args.userId,
    p_kind: args.kind,
    p_ref_id: args.refId,
    p_units: args.units,
    p_reason: args.reason,
  });

  if (error) {
    if (error.message.includes("insufficient_credits")) {
      throw new InsufficientCreditsError();
    }
    throw new Error(`spend_units failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { charged: !!row?.charged, balanceUnits: row?.balance_units ?? 0 };
}
