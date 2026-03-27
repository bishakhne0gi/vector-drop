import { z } from 'zod'
import { requireAuth, createServiceClient } from '@/lib/api/supabase'
import { handleError } from '@/lib/api/handleError'
import { aiGenerateRatelimit, enforceRateLimit, cacheGet } from '@/lib/cache/redis'
import { styleTransfer } from '@/lib/ai/styleTransfer'
import { AppError } from '@/lib/types'
import type { StyleTransferResponse, IconStyleDNA } from '@/lib/types'

const ROUTE = 'POST /api/ai/style-transfer'

const bodySchema = z.object({
  svgContent: z.string().min(1),
  dnaId: z.string().min(1),
  provider: z.enum(['claude', 'gemini']).default('claude'),
})

export async function POST(req: Request): Promise<Response> {
  const start = Date.now()
  let userId: string | null = null

  try {
    const { user } = await requireAuth()
    userId = user.id

    const { remaining } = await enforceRateLimit(aiGenerateRatelimit, user.id)

    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      throw AppError.validation('Request body must be valid JSON')
    }

    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      throw AppError.validation('Invalid request body', { issues: parsed.error.issues })
    }

    const { svgContent, dnaId, provider } = parsed.data

    const dna = await cacheGet<IconStyleDNA>(`ai:dna:${dnaId}`)
    if (!dna) {
      throw new AppError(
        'NOT_FOUND',
        'Style DNA not found — re-analyse the URL first',
        404,
      )
    }

    const result = await styleTransfer(svgContent, dna, provider)

    // Auto-save to icon library (fire-and-forget)
    const svc = createServiceClient()
    svc
      .from('icons')
      .insert({
        user_id: userId,
        prompt: `Style transfer — ${dna.libraryName}`,
        description: result.description,
        style: 'outline',
        primary_color: '#000000',
        svg_content: result.svg,
        path_count: result.pathCount,
        is_public: false,
        tags: ['style-transfer'],
      })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn('[style-transfer] Failed to save to library:', error.message)
      })
      .catch((err: unknown) => {
        console.warn('[style-transfer] Failed to save to library:', err)
      })

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        dnaId,
        libraryName: dna.libraryName,
        pathCount: result.pathCount,
        provider,
      }),
    )

    const body: StyleTransferResponse = {
      svgContent: result.svg,
      description: result.description,
      pathCount: result.pathCount,
      appliedDna: dna,
    }

    return Response.json(body, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start)
  }
}
