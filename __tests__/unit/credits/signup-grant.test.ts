import { describe, it, expect } from "vitest";
import {
  SIGNUP_GRANT_UNITS,
  CONVERSION_UNITS,
  VERSION_EXPORT_UNITS,
  PURCHASE_GRANT_UNITS,
} from "@/lib/credits/constants";

describe("signup grant sizing", () => {
  it("covers two conversions and ten edited exports", () => {
    // The grant exists so a new user can finish two real projects. If this
    // fails, the free tier no longer delivers what the pricing promises and
    // users hit a paywall mid-task.
    const twoConversions = 2 * CONVERSION_UNITS;
    const tenExports = 10 * VERSION_EXPORT_UNITS;
    expect(SIGNUP_GRANT_UNITS).toBe(twoConversions + tenExports);
  });

  it("is a small fraction of a paid pack", () => {
    // A free grant approaching the paid pack would remove the reason to buy.
    expect(SIGNUP_GRANT_UNITS).toBeLessThan(PURCHASE_GRANT_UNITS / 4);
  });

  it("allows at least two conversions", () => {
    expect(Math.floor(SIGNUP_GRANT_UNITS / CONVERSION_UNITS)).toBeGreaterThanOrEqual(2);
  });
});
