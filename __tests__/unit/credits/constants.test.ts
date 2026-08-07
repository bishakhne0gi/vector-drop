import { describe, it, expect } from "vitest";
import {
  UNITS_PER_CREDIT,
  CONVERSION_UNITS,
  VERSION_EXPORT_UNITS,
  SIGNUP_GRANT_UNITS,
  PURCHASE_GRANT_UNITS,
  PACK_PRICE_CENTS,
  formatCredits,
  creditsToUnits,
} from "@/lib/credits/constants";

describe("credit constants", () => {
  it("uses tenths of a credit as the base unit", () => {
    expect(UNITS_PER_CREDIT).toBe(10);
    expect(CONVERSION_UNITS).toBe(10); // 1 credit
    expect(VERSION_EXPORT_UNITS).toBe(1); // 0.1 credits
  });

  it("grants 3 credits at signup — two projects with edits", () => {
    expect(SIGNUP_GRANT_UNITS).toBe(30);
  });

  it("grants 20 credits per $3.00 purchase", () => {
    expect(PURCHASE_GRANT_UNITS).toBe(200);
    expect(PACK_PRICE_CENTS).toBe(300);
  });
});

describe("formatCredits", () => {
  it("renders whole credits without a decimal", () => {
    expect(formatCredits(30)).toBe("3");
    expect(formatCredits(0)).toBe("0");
    expect(formatCredits(200)).toBe("20");
  });

  it("renders fractional credits with one decimal", () => {
    expect(formatCredits(19)).toBe("1.9");
    expect(formatCredits(1)).toBe("0.1");
  });

  it("keeps the minus sign on sub-credit debits", () => {
    // Math.trunc(-1 / 10) is -0 and String(-0) is "0", so a naive
    // implementation renders a 0.1-credit charge as "0.1" — indistinguishable
    // from a refund in the admin ledger.
    expect(formatCredits(-1)).toBe("-0.1");
    expect(formatCredits(-9)).toBe("-0.9");
  });

  it("keeps the minus sign on whole-credit debits", () => {
    expect(formatCredits(-10)).toBe("-1");
    expect(formatCredits(-50)).toBe("-5");
    expect(formatCredits(-19)).toBe("-1.9");
  });

  it("never produces floating point noise", () => {
    // 0.1 + 0.2 !== 0.3 in IEEE 754. Integer units sidestep this entirely —
    // a rounding error in a balance is a billing bug.
    expect(formatCredits(3)).toBe("0.3");
    expect(formatCredits(7)).toBe("0.7");
  });
});

describe("creditsToUnits", () => {
  it("converts credits to integer units", () => {
    expect(creditsToUnits(1)).toBe(10);
    expect(creditsToUnits(0.1)).toBe(1);
    expect(creditsToUnits(20)).toBe(200);
  });

  it("always returns an integer", () => {
    expect(Number.isInteger(creditsToUnits(0.3))).toBe(true);
    expect(Number.isInteger(creditsToUnits(1.9))).toBe(true);
  });
});

describe("LOW_BALANCE_UNITS", () => {
  it("warns at 1.5 credits", async () => {
    const { LOW_BALANCE_UNITS } = await import("@/lib/credits/constants");
    expect(LOW_BALANCE_UNITS).toBe(15);
  });

  it("leaves room for one more conversion plus a few exports", async () => {
    // The warning must arrive while the user can still finish something, not
    // at zero in the middle of a task.
    const { LOW_BALANCE_UNITS, CONVERSION_UNITS, VERSION_EXPORT_UNITS } = await import(
      "@/lib/credits/constants"
    );
    expect(LOW_BALANCE_UNITS).toBeGreaterThan(CONVERSION_UNITS);
    expect(LOW_BALANCE_UNITS - CONVERSION_UNITS).toBeGreaterThanOrEqual(
      5 * VERSION_EXPORT_UNITS,
    );
  });
});
