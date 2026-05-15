// scripts/export-dev-users.ts
// Run locally only. Snapshots all users from the Clerk DEVELOPMENT instance
// into the legacy_user_map table of the PROD Supabase database.
//
// Required env (do not check into .env.production):
//   CLERK_DEV_SECRET_KEY            - secret key from the dev Clerk instance
//   NEXT_PUBLIC_SUPABASE_URL        - prod Supabase URL
//   SUPABASE_SERVICE_ROLE_KEY       - prod Supabase service role key
//
// Usage:
//   pnpm tsx scripts/export-dev-users.ts            # dry run, prints count
//   pnpm tsx scripts/export-dev-users.ts --apply    # actually upsert rows

import { createClient } from '@supabase/supabase-js'

type ClerkEmail = { id: string; email_address: string }
type ClerkUser = {
  id: string
  primary_email_address_id: string | null
  email_addresses: ClerkEmail[]
  first_name: string | null
  last_name: string | null
}

async function fetchAllDevUsers(secret: string): Promise<ClerkUser[]> {
  const all: ClerkUser[] = []
  const limit = 100
  let offset = 0
  while (true) {
    const res = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    )
    if (!res.ok) throw new Error(`Clerk ${res.status}: ${await res.text()}`)
    const page = (await res.json()) as ClerkUser[]
    all.push(...page)
    if (page.length < limit) break
    offset += limit
  }
  return all
}

function primaryEmail(u: ClerkUser): string | null {
  const found = u.email_addresses.find((e) => e.id === u.primary_email_address_id)
  return found?.email_address.toLowerCase() ?? null
}

function displayName(u: ClerkUser): string | null {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || null
}

async function main() {
  const apply = process.argv.includes('--apply')
  const devSecret = process.env.CLERK_DEV_SECRET_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!devSecret || !supabaseUrl || !serviceRole) {
    throw new Error('Missing CLERK_DEV_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  }

  const users = await fetchAllDevUsers(devSecret)
  const rows = users
    .map((u) => ({
      email: primaryEmail(u),
      dev_clerk_id: u.id,
      display_name: displayName(u),
    }))
    .filter((r): r is { email: string; dev_clerk_id: string; display_name: string | null } => r.email !== null)

  console.log(`Fetched ${users.length} users, ${rows.length} have a primary email.`)
  if (!apply) {
    console.log('Dry run. Re-run with --apply to upsert.')
    return
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })
  const { error } = await supabase
    .from('legacy_user_map')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: false })
  if (error) throw error
  console.log(`Upserted ${rows.length} rows into legacy_user_map.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
