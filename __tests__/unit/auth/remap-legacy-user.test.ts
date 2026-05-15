import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock createServiceClient before importing the SUT
const queries: any[] = []

function makeBuilder(table: string) {
  const builder: any = {
    table,
    _eqs: {} as Record<string, unknown>,
    _is: {} as Record<string, unknown>,
    _update: undefined as unknown,
    _delete: false,
    _maybeSingleResult: undefined as any,
    select() { return builder },
    eq(col: string, val: unknown) { builder._eqs[col] = val; return builder },
    is(col: string, val: unknown) { builder._is[col] = val; return builder },
    update(payload: unknown) { builder._update = payload; queries.push({ ...builder, op: 'update' }); return builder },
    async maybeSingle() {
      queries.push({ ...builder, op: 'select' })
      return builder._maybeSingleResult ?? { data: null, error: null }
    },
    // For update/delete chains that don't await maybeSingle, return a thenable
    then(onFulfilled: (v: { error: null }) => unknown) {
      return Promise.resolve({ error: null }).then(onFulfilled)
    },
  }
  return builder
}

let mockDb: { from: (t: string) => any; _builders: Record<string, any> }

vi.mock('@/lib/api/supabase', () => ({
  createServiceClient: () => mockDb,
}))

import { remapLegacyUser } from '@/lib/auth/remap-legacy-user'

const DEV = 'user_devABC'
const PROD = 'user_prodXYZ'
const EMAIL = 'returning@example.com'

beforeEach(() => {
  queries.length = 0
  const builders: Record<string, any> = {
    legacy_user_map: makeBuilder('legacy_user_map'),
    projects: makeBuilder('projects'),
    icons: makeBuilder('icons'),
    feedback: makeBuilder('feedback'),
    profiles: makeBuilder('profiles'),
  }
  mockDb = {
    _builders: builders,
    from: (t: string) => builders[t],
  }
})

describe('remapLegacyUser', () => {
  it('rewrites all tables and stamps remapped_at when map row is unclaimed', async () => {
    mockDb._builders.legacy_user_map._maybeSingleResult = {
      data: { dev_clerk_id: DEV, remapped_at: null },
      error: null,
    }

    const result = await remapLegacyUser({ email: EMAIL, prodClerkId: PROD })

    expect(result).toEqual({ status: 'remapped', devClerkId: DEV })

    const updates = queries.filter((q) => q.op === 'update')
    const tables = updates.map((q) => q.table)
    expect(tables).toContain('projects')
    expect(tables).toContain('icons')
    expect(tables).toContain('feedback')
    expect(tables).toContain('profiles')
    expect(tables).toContain('legacy_user_map')

    const projectsUpdate = updates.find((q) => q.table === 'projects')
    expect(projectsUpdate._update).toEqual({ user_id: PROD })
    expect(projectsUpdate._eqs.user_id).toBe(DEV)

    const profilesUpdate = updates.find((q) => q.table === 'profiles')
    expect(profilesUpdate._update).toEqual({ id: PROD })
    expect(profilesUpdate._eqs.id).toBe(DEV)

    const stamp = updates.find((q) => q.table === 'legacy_user_map')
    expect(stamp._update).toMatchObject({ prod_clerk_id: PROD })
    expect(typeof stamp._update.remapped_at).toBe('string')
    expect(stamp._is.remapped_at).toBeNull()
  })

  it('returns no_map_row when no legacy row exists for the email', async () => {
    mockDb._builders.legacy_user_map._maybeSingleResult = { data: null, error: null }

    const result = await remapLegacyUser({ email: EMAIL, prodClerkId: PROD })
    expect(result).toEqual({ status: 'no_map_row' })
    expect(queries.filter((q) => q.op === 'update')).toHaveLength(0)
  })

  it('returns already_remapped when remapped_at is non-null', async () => {
    mockDb._builders.legacy_user_map._maybeSingleResult = {
      data: { dev_clerk_id: DEV, remapped_at: '2026-05-15T00:00:00Z' },
      error: null,
    }

    const result = await remapLegacyUser({ email: EMAIL, prodClerkId: PROD })
    expect(result).toEqual({ status: 'already_remapped' })
    expect(queries.filter((q) => q.op === 'update')).toHaveLength(0)
  })

  it('lowercases the email before lookup', async () => {
    mockDb._builders.legacy_user_map._maybeSingleResult = { data: null, error: null }

    await remapLegacyUser({ email: 'MiXeD@Example.COM', prodClerkId: PROD })
    const lookup = queries.find((q) => q.table === 'legacy_user_map' && q.op === 'select')
    expect(lookup._eqs.email).toBe('mixed@example.com')
  })
})
