/**
 * Verifies that every address on the /hades allowlist can actually get in:
 * the account must exist in the *target* Clerk instance and its primary email
 * must be verified. Run before or after deploying the admin portal.
 *
 *   pnpm dlx tsx --env-file=.env.production scripts/check-admin-access.ts
 *
 * Reads CLERK_SECRET_KEY and ADMIN_EMAILS from the environment.
 */
import { createClerkClient } from "@clerk/backend";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "bneogi102002@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function main(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not set");

  const instance = secretKey.startsWith("sk_live_") ? "PRODUCTION" : "development";
  console.log(`Clerk instance: ${instance}`);
  console.log(`Allowlist:      ${ADMIN_EMAILS.join(", ")}\n`);

  const clerk = createClerkClient({ secretKey });
  let ok = true;

  for (const email of ADMIN_EMAILS) {
    const { data } = await clerk.users.getUserList({ emailAddress: [email] });
    const user = data[0];

    if (!user) {
      ok = false;
      console.log(`✗ ${email}`);
      console.log(`    No account in this Clerk instance. Sign up at /login with`);
      console.log(`    this address, then re-run.\n`);
      continue;
    }

    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    const verified = primary?.verification?.status === "verified";
    const isPrimary = primary?.emailAddress.toLowerCase() === email;

    if (!isPrimary) {
      ok = false;
      console.log(`✗ ${email}`);
      console.log(`    Present on the account but NOT its primary address`);
      console.log(`    (primary is ${primary?.emailAddress}). requireAdmin only`);
      console.log(`    trusts the primary — make it primary in Clerk.\n`);
      continue;
    }

    if (!verified) {
      ok = false;
      console.log(`✗ ${email}`);
      console.log(`    Primary address is NOT verified (${primary?.verification?.status ?? "none"}).`);
      console.log(`    requireAdmin rejects unverified emails.\n`);
      continue;
    }

    console.log(`✓ ${email}`);
    console.log(`    userId ${user.id}`);
    console.log(`    2FA ${user.twoFactorEnabled ? "enabled" : "DISABLED — turn it on"}`);
    console.log(`    banned=${user.banned} locked=${user.locked}\n`);
  }

  console.log(
    ok
      ? "All allowlisted admins can reach /hades on this instance."
      : "At least one admin cannot get in — see above.",
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
