/**
 * Credit arithmetic.
 *
 * Balances are integers in UNITS, where 1 credit = 10 units. Money-adjacent
 * values never use floating point: 0.1 + 0.2 !== 0.3 in IEEE 754, and a
 * rounding error in a balance is a billing bug.
 *
 * Every price in the product is defined here and nowhere else. No route,
 * component, or test may hardcode a cost.
 */

/** Base unit: one tenth of a credit. */
export const UNITS_PER_CREDIT = 10;

/** Converting one image to vector. 1 credit. */
export const CONVERSION_UNITS = 10;

/** Exporting one edited version, once, in any format. 0.1 credits. */
export const VERSION_EXPORT_UNITS = 1;

/**
 * Balance at which the UI switches to a warning state. 1.5 credits — one more
 * conversion plus a few exports — so the warning lands while the user can still
 * act on it, rather than at zero in the middle of a task.
 */
export const LOW_BALANCE_UNITS = 15;

/**
 * Signup grant. 3 credits = two conversions (20 units) plus ten edited-version
 * exports (10 units). Sized so a new user can finish two real projects — a free
 * tier that cannot complete anything is worse than none.
 */
export const SIGNUP_GRANT_UNITS = 30;

/** One purchase. 20 credits. */
export const PURCHASE_GRANT_UNITS = 200;

/**
 * Pack price in USD cents, EXCLUSIVE of tax — Dodo adds tax on top, so the
 * customer's checkout total is higher than this. All pricing copy must say
 * "+ tax" for that reason.
 */
export const PACK_PRICE_CENTS = 300;

/**
 * Renders units for humans: 30 -> "3", 19 -> "1.9", 1 -> "0.1", -1 -> "-0.1".
 *
 * The sign is applied to the whole string rather than taken from the integer
 * part: Math.trunc(-1 / 10) is -0, and String(-0) is "0", so a naive version
 * silently drops the minus on any debit smaller than one credit — turning a
 * 0.1-credit charge into what looks like a 0.1-credit refund.
 */
export function formatCredits(units: number): string {
  const sign = units < 0 ? "-" : "";
  const abs = Math.abs(units);
  const whole = Math.trunc(abs / UNITS_PER_CREDIT);
  const remainder = abs % UNITS_PER_CREDIT;
  return remainder === 0 ? `${sign}${whole}` : `${sign}${whole}.${remainder}`;
}

/** Converts a credit amount to integer units. */
export function creditsToUnits(credits: number): number {
  return Math.round(credits * UNITS_PER_CREDIT);
}
