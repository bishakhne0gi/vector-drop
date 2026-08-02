/**
 * Admin portal configuration.
 *
 * The allowlist is the ONLY thing that grants access to /hades. It is read from
 * ADMIN_EMAILS (comma-separated) and falls back to the owner's address so the
 * portal works on a fresh deploy with no extra config.
 */

const FALLBACK_ADMIN_EMAIL = "bneogi102002@gmail.com";

export const ADMIN_EMAILS: readonly string[] = (
  process.env.ADMIN_EMAILS ?? FALLBACK_ADMIN_EMAIL
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Timezone used to bucket rows into calendar days on every admin screen. */
export const ADMIN_TIMEZONE = process.env.ADMIN_TIMEZONE ?? "Asia/Kolkata";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
