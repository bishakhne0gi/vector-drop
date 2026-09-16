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
 * Balance at which the UI switches to a warning state. 1 credit — exactly one
 * conversion left. Above the old 1.5 the signup grant itself would land in the
 * warning state, painting every new account red on arrival; at 1 credit the
 * warning still reaches the user while they can finish one more conversion.
 */
export const LOW_BALANCE_UNITS = 10;

/**
 * Signup grant. 1 credit = exactly one conversion (10 units). Exporting the
 * converted original is free (the conversion charge includes that entitlement),
 * so a new user can still take one real project from image to downloaded SVG —
 * the smallest grant that completes something end to end.
 */
export const SIGNUP_GRANT_UNITS = 10;

/** One purchase. 20 credits. */
export const PURCHASE_GRANT_UNITS = 200;

/**
 * Pack price in USD cents, EXCLUSIVE of tax — Dodo adds tax on top, so the
 * customer's checkout total is higher than this. All pricing copy must say
 * "+ tax" for that reason.
 */
export const PACK_PRICE_CENTS = 400;

/**
 * The pack, ready for display: "20" and "$4".
 *
 * Every surface that quotes the offer — pricing page, checkout modal, the
 * out-of-credits panel, the buy button — used to hardcode its own copy of the
 * number and the price. A price change then meant finding all of them, and
 * missing one means the site advertises a price the checkout does not charge.
 */
export const PACK_CREDITS = PURCHASE_GRANT_UNITS / UNITS_PER_CREDIT;

export const PACK_PRICE_USD = `$${(PACK_PRICE_CENTS / 100).toFixed(
  PACK_PRICE_CENTS % 100 === 0 ? 0 : 2,
)}`;

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
