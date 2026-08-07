import { describe, it, expect } from "vitest";
import { ledgerKeys } from "@/lib/credits/keys";

describe("ledgerKeys", () => {
  it("builds structural, repeatable keys", () => {
    expect(ledgerKeys.signup("user_abc")).toBe("signup:user_abc");
    expect(ledgerKeys.purchase("pay_1")).toBe("dodo:pay_1");
    expect(ledgerKeys.conversion("proj-1")).toBe("convert:proj-1");
    expect(ledgerKeys.versionExport("user_abc", "ver-1")).toBe("export:user_abc:ver-1");
    expect(ledgerKeys.refund("pay_1")).toBe("refund:pay_1");
  });

  it("is deterministic — the same inputs always give the same key", () => {
    // This is the entire idempotency guarantee. If these ever differ between
    // calls, a retried webhook grants credits twice.
    expect(ledgerKeys.purchase("pay_1")).toBe(ledgerKeys.purchase("pay_1"));
    expect(ledgerKeys.signup("user_abc")).toBe(ledgerKeys.signup("user_abc"));
  });

  it("keeps different events in separate key namespaces", () => {
    // A purchase and a refund for the same payment must not collide, or the
    // refund would be swallowed as a duplicate of the purchase.
    expect(ledgerKeys.purchase("pay_1")).not.toBe(ledgerKeys.refund("pay_1"));
  });

  it("scopes export keys per user", () => {
    expect(ledgerKeys.versionExport("user_a", "v1")).not.toBe(
      ledgerKeys.versionExport("user_b", "v1"),
    );
  });
});
