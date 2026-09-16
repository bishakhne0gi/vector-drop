import { describe, it, expect } from "vitest";
import {
  SIGNUP_GRANT_UNITS,
  CONVERSION_UNITS,
  PURCHASE_GRANT_UNITS,
} from "@/lib/credits/constants";

describe("signup grant sizing", () => {
  it("covers exactly one conversion", () => {
    // The grant exists so a new user can finish one real project: the
    // conversion, plus the export of its result, which the conversion charge
    // already entitles them to. If this fails, the free tier no longer
    // delivers what the pricing promises.
    expect(SIGNUP_GRANT_UNITS).toBe(CONVERSION_UNITS);
  });

  it("is a small fraction of a paid pack", () => {
    // A free grant approaching the paid pack would remove the reason to buy.
    expect(SIGNUP_GRANT_UNITS).toBeLessThan(PURCHASE_GRANT_UNITS / 4);
  });

  it("allows at least one conversion", () => {
    expect(Math.floor(SIGNUP_GRANT_UNITS / CONVERSION_UNITS)).toBeGreaterThanOrEqual(1);
  });
});
