import { createServiceClient } from '@/lib/api/supabase'

export type RemapResult =
  | { status: 'remapped'; devClerkId: string }
  | { status: 'already_remapped' }
  | { status: 'no_map_row' }

type Args = { email: string; prodClerkId: string }

// Rewrites every Supabase row keyed on the legacy dev Clerk user_id to the new
// prod Clerk user_id. Idempotent via the `remapped_at IS NULL` guard: a
// partial failure leaves the row unclaimed so the next call completes it.
export async function remapLegacyUser({ email, prodClerkId }: Args): Promise<RemapResult> {
  const db = createServiceClient()
  const normalised = email.toLowerCase()

  const { data: row, error: lookupErr } = await db
    .from('legacy_user_map')
    .select('dev_clerk_id, remapped_at')
    .eq('email', normalised)
    .maybeSingle()
  if (lookupErr) throw lookupErr
  if (!row) return { status: 'no_map_row' }
  if (row.remapped_at) return { status: 'already_remapped' }

  const dev = row.dev_clerk_id as string

  const { error: e1 } = await db.from('projects').update({ user_id: prodClerkId }).eq('user_id', dev)
  if (e1) throw e1
  const { error: e2 } = await db.from('icons').update({ user_id: prodClerkId }).eq('user_id', dev)
  if (e2) throw e2
  const { error: e3 } = await db.from('feedback').update({ user_id: prodClerkId }).eq('user_id', dev)
  if (e3) throw e3
  const { error: e4 } = await db.from('profiles').update({ id: prodClerkId }).eq('id', dev)
  if (e4) throw e4

  const { error: stampErr } = await db
    .from('legacy_user_map')
    .update({ prod_clerk_id: prodClerkId, remapped_at: new Date().toISOString() })
    .eq('email', normalised)
    .is('remapped_at', null)
  if (stampErr) throw stampErr

  return { status: 'remapped', devClerkId: dev }
}
