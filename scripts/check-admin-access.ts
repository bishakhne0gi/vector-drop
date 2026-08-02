/**
 * Verifies that every address on the /hades allowlist can actually get in:
 * the account must exist in the *target* Clerk instance, and that address must
 * be the account's primary AND verified — exactly what requireAdmin() demands.
 *
 * Run against whichever instance you care about by pointing --env-file at it:
 *
 *   node --env-file=.env.production scripts/check-admin-access.ts
 *   node --env-file=.env.vercel-prod scripts/check-admin-access.ts
 *
 * Talks to the Clerk Backend API over plain fetch on purpose: the SDK's ESM
 * build assumes a bundler and will not resolve under bare node.
 *
 * Reads CLERK_SECRET_KEY and ADMIN_EMAILS from the environment.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "bneogi102002@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

interface ClerkEmailAddress {
  id: string;
  email_address: string;
  verification: { status: string } | null;
}

interface ClerkUser {
  id: string;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
  two_factor_enabled: boolean;
  banned: boolean;
  locked: boolean;
}

async function findByEmail(
  secretKey: string,
  email: string,
): Promise<ClerkUser | null> {
  const url = new URL("https://api.clerk.com/v1/users");
  url.searchParams.append("email_address", email);
  url.searchParams.set("limit", "10");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) {
    throw new Error(`Clerk API ${res.status}: ${await res.text()}`);
  }

  const users = (await res.json()) as ClerkUser[];
  return users[0] ?? null;
}

async function main(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not set");

  const instance = secretKey.startsWith("sk_live_")
    ? "PRODUCTION (sk_live)"
    : "development (sk_test)";
  console.log(`Clerk instance: ${instance}`);
  console.log(`Allowlist:      ${ADMIN_EMAILS.join(", ")}\n`);

  let ok = true;

  for (const email of ADMIN_EMAILS) {
    const user = await findByEmail(secretKey, email);

    if (!user) {
      ok = false;
      console.log(`✗ ${email}`);
      console.log(`    No account in this Clerk instance. Sign in once at`);
      console.log(`    /login with this address, then re-run.\n`);
      continue;
    }

    const primary = user.email_addresses.find(
      (e) => e.id === user.primary_email_address_id,
    );

    if (primary?.email_address.toLowerCase() !== email) {
      ok = false;
      console.log(`✗ ${email}`);
      console.log(`    On the account, but not its PRIMARY address`);
      console.log(`    (primary is ${primary?.email_address ?? "none"}).`);
      console.log(`    requireAdmin only trusts the primary — change it in Clerk.\n`);
      continue;
    }

    if (primary.verification?.status !== "verified") {
      ok = false;
      console.log(`✗ ${email}`);
      console.log(
        `    Primary address is NOT verified (${primary.verification?.status ?? "none"}).`,
      );
      console.log(`    requireAdmin rejects unverified emails.\n`);
      continue;
    }

    console.log(`✓ ${email}`);
    console.log(`    userId ${user.id}`);
    console.log(
      `    2FA ${user.two_factor_enabled ? "enabled" : "DISABLED — turn it on in Clerk"}`,
    );
    console.log(`    banned=${user.banned} locked=${user.locked}\n`);
  }

  console.log(
    ok
      ? "All allowlisted admins can reach /hades on this instance."
      : "At least one admin cannot get in — see above.",
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
