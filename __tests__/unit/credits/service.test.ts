import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/lib/api/supabase", () => ({
  createServiceClient: () => ({ rpc, from }),
}));

import {
  grantUnits,
  spendUnits,
  getBalance,
  InsufficientCreditsError,
} from "@/lib/credits/service";

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
});

/** Builds the chained query-builder mock the Supabase client exposes. */
function mockMaybeSingle(result: unknown) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: result, error: null }),
  };
  from.mockReturnValue(chain);
}

describe("grantUnits", () => {
  it("reports granted=false when the idempotency key was already used", async () => {
    // The expected outcome of a redelivered webhook — not an error.
    rpc.mockResolvedValue({ data: [{ granted: false, balance_units: 30 }], error: null });

    const res = await grantUnits({
      userId: "user_a",
      units: 200,
      reason: "purchase",
      idempotencyKey: "dodo:p1",
    });

    expect(res).toEqual({ granted: false, balanceUnits: 30 });
  });

  it("passes the idempotency key through to the database", async () => {
    rpc.mockResolvedValue({ data: [{ granted: true, balance_units: 230 }], error: null });

    await grantUnits({
      userId: "user_a",
      units: 200,
      reason: "purchase",
      idempotencyKey: "dodo:p1",
    });

    expect(rpc).toHaveBeenCalledWith(
      "grant_units",
      expect.objectContaining({
        p_user_id: "user_a",
        p_delta_units: 200,
        p_idempotency_key: "dodo:p1",
        p_reason: "purchase",
      }),
    );
  });

  it("throws on an unexpected database error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "connection reset" } });
    await expect(
      grantUnits({ userId: "u", units: 10, reason: "purchase", idempotencyKey: "k" }),
    ).rejects.toThrow(/grant_units failed/);
  });
});

describe("spendUnits", () => {
  it("maps the database insufficient_credits error to a typed error", async () => {
    // Routes catch this specific type to return 402 rather than 500.
    rpc.mockResolvedValue({ data: null, error: { message: "insufficient_credits" } });

    await expect(
      spendUnits({
        userId: "user_a",
        kind: "conversion",
        refId: "p1",
        units: 10,
        reason: "conversion",
      }),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);
  });

  it("returns charged=false for an already-unlocked ref", async () => {
    rpc.mockResolvedValue({ data: [{ charged: false, balance_units: 20 }], error: null });

    const res = await spendUnits({
      userId: "user_a",
      kind: "version_export",
      refId: "v1",
      units: 1,
      reason: "version_export",
    });

    expect(res).toEqual({ charged: false, balanceUnits: 20 });
  });

  it("returns charged=true and the new balance on a real spend", async () => {
    rpc.mockResolvedValue({ data: [{ charged: true, balance_units: 19 }], error: null });

    const res = await spendUnits({
      userId: "user_a",
      kind: "version_export",
      refId: "v2",
      units: 1,
      reason: "version_export",
    });

    expect(res).toEqual({ charged: true, balanceUnits: 19 });
  });

  it("forwards zero-unit spends so free entitlements are recorded", async () => {
    rpc.mockResolvedValue({ data: [{ charged: false, balance_units: 20 }], error: null });

    await spendUnits({
      userId: "user_a",
      kind: "version_export",
      refId: "v1",
      units: 0,
      reason: "version_export",
    });

    expect(rpc).toHaveBeenCalledWith("spend_units", expect.objectContaining({ p_units: 0 }));
  });
});

describe("getBalance", () => {
  it("returns zero when the user has no credit row yet", async () => {
    mockMaybeSingle(null);
    expect(await getBalance("new_user")).toBe(0);
  });

  it("returns the stored balance in units", async () => {
    mockMaybeSingle({ balance_units: 19 });
    expect(await getBalance("user_a")).toBe(19);
  });
});

describe("ensureSignupGrant", () => {
  it("grants the signup allowance when the user has no credit row", async () => {
    // The rescue path for users whose Clerk user.created webhook never fired.
    mockMaybeSingle(null);
    rpc.mockResolvedValue({ data: [{ granted: true, balance_units: 30 }], error: null });

    const { ensureSignupGrant } = await import("@/lib/credits/service");
    const balance = await ensureSignupGrant("user_new");

    expect(balance).toBe(30);
    expect(rpc).toHaveBeenCalledWith(
      "grant_units",
      expect.objectContaining({
        p_user_id: "user_new",
        p_delta_units: 30,
        p_idempotency_key: "signup:user_new",
        p_reason: "signup_grant",
      }),
    );
  });

  it("does NOT grant again when a credit row already exists", async () => {
    // Someone who spent down to zero must not be topped back up on every
    // balance check — that would make credits infinite.
    mockMaybeSingle({ balance_units: 0 });
    const { ensureSignupGrant } = await import("@/lib/credits/service");

    const balance = await ensureSignupGrant("user_spent_out");

    expect(balance).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns the existing balance untouched", async () => {
    mockMaybeSingle({ balance_units: 199 });
    const { ensureSignupGrant } = await import("@/lib/credits/service");

    expect(await ensureSignupGrant("user_a")).toBe(199);
    expect(rpc).not.toHaveBeenCalled();
  });
});
