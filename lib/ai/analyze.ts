import { createHash } from 'crypto'
import { getAnthropicClient, MODELS } from './client'
import {
  AISuggestionSchema,
  AISuggestionToolInputSchema,
  FALLBACK_SUGGESTION,
  type AISuggestion,
} from './schemas'
import { ANALYSIS_SYSTEM_PROMPT } from './prompts'
import { redis, TTL } from '@/lib/cache/redis'

function hashImage(imageBase64: string): string {
  return createHash('sha256').update(imageBase64).digest('hex')
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  userId?: string,
): Promise<AISuggestion> {
  const imageHash = hashImage(imageBase64)
  const cacheKey = `ai:analysis:${imageHash}`

  // 1. Cache check (uses shared singleton from lib/cache/redis)
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      const parsed = AISuggestionSchema.safeParse(cached)
      if (parsed.success) return parsed.data
    }
  } catch (err) {
    console.warn('[analyzeImage] Redis cache read failed:', err)
  }

  // 2. Call Claude
  const client = getAnthropicClient()
  let inputTokens = 0
  let outputTokens = 0

  try {
    const response = await client.messages.create({
      model: MODELS.analysis,
      max_tokens: 2048,
      system: ANALYSIS_SYSTEM_PROMPT,
      tools: [
        {
          name: 'suggest_themes',
          description:
            'Return dominant colors, style description, 4 theme suggestions, and complexity for the image',
          input_schema: AISuggestionToolInputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: 'suggest_themes' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            { type: 'text', text: 'Analyze this image and suggest themes for SVG vectorization.' },
          ],
        },
      ],
    })

    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens

    // 3. Extract tool_use block
    const toolBlock = response.content.find((b) => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.warn('[analyzeImage] No tool_use block in response')
      return FALLBACK_SUGGESTION
    }

    // 4. Zod validate
    const parsed = AISuggestionSchema.safeParse(toolBlock.input)
    if (!parsed.success) {
      console.warn('[analyzeImage] Zod parse failure:', parsed.error.flatten())
      return FALLBACK_SUGGESTION
    }

    const result = parsed.data

    // 5. Cache with 7d TTL (uses TTL constant from lib/cache/redis)
    try {
      await redis.set(cacheKey, result, { ex: TTL.AI_ANALYSIS })
    } catch (err) {
      console.warn('[analyzeImage] Redis cache write failed:', err)
    }

    // 6. Log usage (fire-and-forget)
    logUsage({
      imageHash,
      inputTokens,
      outputTokens,
      model: MODELS.analysis,
      feature: 'analyze',
      userId,
    }).catch((err) => console.warn('[analyzeImage] Usage log failed:', err))

    return result
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 429) {
      console.error('[analyzeImage] Rate limited by Anthropic API')
      // Re-throw as a typed AppError so handleError maps it correctly (HTTP 429)
      // and the raw SDK error shape is never exposed to the client.
      const { AppError: AE } = await import('@/lib/types')
      throw AE.rateLimited(60)
    }
    console.error('[analyzeImage] API error, returning fallback:', err)
    return FALLBACK_SUGGESTION
  }
}

async function logUsage(params: {
  imageHash: string
  inputTokens: number
  outputTokens: number
  model: string
  feature: string
  userId?: string
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  const { createClient } = await import('@supabase/supabase-js')
  // Service-role client: ai_usage has no RLS insert policy for regular users.
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  await supabase.from('ai_usage').insert({
    image_hash: params.imageHash,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    model: params.model,
    feature: params.feature,
    user_id: params.userId ?? null,
    created_at: new Date().toISOString(),
  })
}
