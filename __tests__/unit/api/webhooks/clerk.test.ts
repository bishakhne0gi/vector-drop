import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/remap-legacy-user', () => ({
  remapLegacyUser: vi.fn(),
}))

const verify = vi.fn()
vi.mock('svix', () => ({
  Webhook: vi.fn(function (this: any) {
    this.verify = verify
  }),
}))

import { POST } from '@/app/api/webhooks/clerk/route'
import { remapLegacyUser } from '@/lib/auth/remap-legacy-user'

function makeReq(body: object, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/webhooks/clerk', {
    method: 'POST',
    headers: {
      'svix-id': 'msg_1',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/webhooks/clerk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    verify.mockReset()
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = 'whsec_test'
  })

  it('returns 401 on invalid signature', async () => {
    verify.mockImplementation(() => { throw new Error('bad sig') })
    const res = await POST(makeReq({ type: 'user.created', data: {} }))
    expect(res.status).toBe(401)
    expect(remapLegacyUser).not.toHaveBeenCalled()
  })

  it('returns 500 when secret is not configured', async () => {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET
    const res = await POST(makeReq({}))
    expect(res.status).toBe(500)
    expect(remapLegacyUser).not.toHaveBeenCalled()
  })

  it('calls remapLegacyUser on user.created with the primary email lowercased', async () => {
    const payload = {
      type: 'user.created',
      data: {
        id: 'user_prodNEW',
        primary_email_address_id: 'em_1',
        email_addresses: [{ id: 'em_1', email_address: 'Returning@Example.com' }],
      },
    }
    verify.mockReturnValue(payload)
    ;(remapLegacyUser as any).mockResolvedValue({ status: 'remapped', devClerkId: 'user_devOLD' })

    const res = await POST(makeReq(payload))
    expect(res.status).toBe(200)
    expect(remapLegacyUser).toHaveBeenCalledWith({
      email: 'returning@example.com',
      prodClerkId: 'user_prodNEW',
    })
  })

  it('ignores non-user.created events with 200', async () => {
    verify.mockReturnValue({ type: 'user.updated', data: { id: 'x' } })
    const res = await POST(makeReq({}))
    expect(res.status).toBe(200)
    expect(remapLegacyUser).not.toHaveBeenCalled()
  })

  it('returns 200 when no map row exists (idempotency / unknown user)', async () => {
    const payload = {
      type: 'user.created',
      data: {
        id: 'user_prodNEW',
        primary_email_address_id: 'em_1',
        email_addresses: [{ id: 'em_1', email_address: 'new@example.com' }],
      },
    }
    verify.mockReturnValue(payload)
    ;(remapLegacyUser as any).mockResolvedValue({ status: 'no_map_row' })

    const res = await POST(makeReq(payload))
    expect(res.status).toBe(200)
  })

  it('returns 200 with ignored when there is no primary email', async () => {
    const payload = {
      type: 'user.created',
      data: { id: 'user_prodNEW', primary_email_address_id: null, email_addresses: [] },
    }
    verify.mockReturnValue(payload)
    const res = await POST(makeReq(payload))
    expect(res.status).toBe(200)
    expect(remapLegacyUser).not.toHaveBeenCalled()
  })
})
