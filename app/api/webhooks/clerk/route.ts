import { Webhook } from 'svix'
import { NextResponse } from 'next/server'
import { remapLegacyUser } from '@/lib/auth/remap-legacy-user'
import { grantUnits } from '@/lib/credits/service'
import { ledgerKeys } from '@/lib/credits/keys'
import { SIGNUP_GRANT_UNITS } from '@/lib/credits/constants'

type ClerkEmail = { id: string; email_address: string }
type UserCreatedPayload = {
  type: 'user.created'
  data: {
    id: string
    primary_email_address_id: string | null
    email_addresses: ClerkEmail[]
  }
}
type WebhookEvent = UserCreatedPayload | { type: string; data: unknown }

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 500 })
  }

  const svixId = req.headers.get('svix-id') ?? ''
  const svixTimestamp = req.headers.get('svix-timestamp') ?? ''
  const svixSignature = req.headers.get('svix-signature') ?? ''
  const body = await req.text()

  let evt: WebhookEvent
  try {
    evt = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  if (evt.type !== 'user.created') {
    return NextResponse.json({ ignored: true }, { status: 200 })
  }

  const data = (evt as UserCreatedPayload).data
  const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id)
  if (!primary) {
    return NextResponse.json({ ignored: 'no primary email' }, { status: 200 })
  }

  const result = await remapLegacyUser({
    email: primary.email_address.toLowerCase(),
    prodClerkId: data.id,
  })

  // Signup grant: 3 credits — two conversions plus ten edited-version exports.
  // Idempotent on signup:{userId}, so a replayed event grants once.
  //
  // Failures are logged, never thrown: a non-2xx would make Clerk retry the
  // whole event, and the backfill script is the safety net for a missed grant.
  let granted = false
  try {
    const grant = await grantUnits({
      userId: data.id,
      units: SIGNUP_GRANT_UNITS,
      reason: 'signup_grant',
      idempotencyKey: ledgerKeys.signup(data.id),
      metadata: { email: primary.email_address.toLowerCase() },
    })
    granted = grant.granted
  } catch (err) {
    console.error('[signup-grant]', err)
  }

  return NextResponse.json({ result, granted }, { status: 200 })
}
