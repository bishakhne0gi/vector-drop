import { createHash } from 'crypto'
import { callWithTool, MODELS } from './providerAdapter'
import {
  AISuggestionSchema,
  AISuggestionToolInputSchema,
  FALLBACK_SUGGESTION,
  type AISuggestion,
} from './schemas'
import { ANALYSIS_SYSTEM_PROMPT } from './prompts'
import type { AIProvider } from '@/lib/types'

async function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

function hashImage(imageBase64: string): string {
  return createHash('sha256').update(imageBase64).digest('hex')
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  provider: AIProvider = 'claude',
): Promise<AISuggestion> {
  const imageHash = hashImage(imageBase64)
  const cacheKey = `ai:analysis:${imageHash}`

  // 1. Cache check
  const redis = await getRedisClient()
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const parsed = AISuggestionSchema.safeParse(cached)
        if (parsed.success) return parsed.data
      }
    } catch (err) {
      console.warn('[analyzeImage] Redis cache read failed:', err)
    }
  }

  // 2. Call AI provider
  try {
    const rawResult = await callWithTool({
      provider,
      model: MODELS.analysis,
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      userContent: [
        { type: 'image', mimeType, data: imageBase64 },
        { type: 'text', text: 'Analyze this image and suggest themes for SVG vectorization.' },
      ],
      tool: {
        name: 'suggest_themes',
        description:
          'Return dominant colors, style description, 4 theme suggestions, and complexity for the image',
        inputSchema: AISuggestionToolInputSchema,
      },
    })

    // 3. Zod validate
    const parsed = AISuggestionSchema.safeParse(rawResult)
    if (!parsed.success) {
      console.warn('[analyzeImage] Zod parse failure:', parsed.error.flatten())
      return FALLBACK_SUGGESTION
    }

    const result = parsed.data

    // 4. Cache with 7d TTL
    if (redis) {
      try {
        await redis.set(cacheKey, result, { ex: 7 * 24 * 60 * 60 })
      } catch (err) {
        console.warn('[analyzeImage] Redis cache write failed:', err)
      }
    }

    // 5. Log usage (fire-and-forget) — provider-agnostic
    logUsage({
      imageHash,
      model: provider === 'gemini' ? 'gemini-2.5-pro' : MODELS.analysis,
      feature: 'analyze',
      provider,
    }).catch((err) => console.warn('[analyzeImage] Usage log failed:', err))

    return result
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 429) {
      console.error('[analyzeImage] Rate limited by AI provider')
      throw err
    }
    console.error('[analyzeImage] API error, returning fallback:', err)
    return FALLBACK_SUGGESTION
  }
}

async function logUsage(params: {
  imageHash: string
  model: string
  feature: string
  provider: AIProvider
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)
  await supabase.from('ai_usage').insert({
    image_hash: params.imageHash,
    input_tokens: 0, // token counts not available in provider-agnostic adapter
    output_tokens: 0,
    model: params.model,
    feature: params.feature,
    provider: params.provider,
    created_at: new Date().toISOString(),
  })
}
