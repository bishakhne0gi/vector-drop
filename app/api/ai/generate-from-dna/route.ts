import { z } from 'zod'
import { requireAuth, createServiceClient } from '@/lib/api/supabase'
import { handleError } from '@/lib/api/handleError'
import { aiGenerateRatelimit, enforceRateLimit, cacheGet } from '@/lib/cache/redis'
import { generateFromDNA } from '@/lib/ai/generateFromDNA'
import { AppError } from '@/lib/types'
import type { GenerateFromDNAResponse, IconStyleDNA } from '@/lib/types'

const ROUTE = 'POST /api/ai/generate-from-dna'

const bodySchema = z.object({
  imageBase64: z.string().min(1),
  imageMimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  prompt: z.string().min(1).max(200),
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

    const { imageBase64, imageMimeType, prompt, dnaId, provider } = parsed.data

    // Guard against excessively large base64 payloads (~1.5 MB decoded limit)
    if (imageBase64.length > 2_000_000) {
      throw AppError.validation('Image too large — maximum 1.5 MB')
    }

    const dna = await cacheGet<IconStyleDNA>(`ai:dna:${dnaId}`)
    if (!dna) {
      throw new AppError(
        'NOT_FOUND',
        'Style DNA not found — re-analyse the URL first',
        404,
      )
    }

    const result = await generateFromDNA(imageBase64, imageMimeType, prompt, dna, provider)

    // Auto-save to icon library (fire-and-forget — don't fail the request if save fails)
    const svc = createServiceClient()
    svc
      .from('icons')
      .insert({
        user_id: userId,
        prompt,
        description: result.description,
        style: dna.fillStyle,
        primary_color: '#171717',
        svg_content: result.svg,
        path_count: result.pathCount,
        is_public: true,
        tags: [
          'generated-from-dna',
          dna.libraryName.toLowerCase().replace(/\s+/g, '-'),
        ],
      })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn('[generate-from-dna] Failed to save to library:', error.message)
      })
      .catch((err: unknown) => {
        console.warn('[generate-from-dna] Failed to save to library:', err)
      })

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        dnaId,
        prompt,
        libraryName: dna.libraryName,
        pathCount: result.pathCount,
        provider,
      }),
    )

    const body: GenerateFromDNAResponse = {
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
