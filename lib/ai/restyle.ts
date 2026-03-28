import { createHash } from 'crypto'
import { XMLParser } from 'fast-xml-parser'
import { getAnthropicClient, MODELS } from './client'
import { AIRestyleSchema, RestyleSVGToolInputSchema, type Theme } from './schemas'
import { RESTYLE_SYSTEM_PROMPT } from './prompts'
import { redis, TTL } from '@/lib/cache/redis'

const SVG_MAX_CHARS = 32000 // ~8000 tokens at ~4 chars/token

function hashString(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 16)
}

function isValidSVG(svgString: string): boolean {
  try {
    const parser = new XMLParser({ ignoreAttributes: false })
    const result = parser.parse(svgString) as Record<string, unknown>
    return typeof result === 'object' && result !== null && ('svg' in result || 'SVG' in result)
  } catch {
    return false
  }
}

function truncateSVG(svgString: string): string {
  if (svgString.length <= SVG_MAX_CHARS) return svgString
  console.warn(`[restyleSVG] Truncating SVG from ${svgString.length} to ${SVG_MAX_CHARS} chars`)
  let truncated = svgString.replace(/<!--[\s\S]*?-->/g, '')
  if (truncated.length <= SVG_MAX_CHARS) return truncated
  const closeIdx = truncated.lastIndexOf('</svg>')
  if (closeIdx > SVG_MAX_CHARS - 10) {
    truncated = truncated.slice(0, SVG_MAX_CHARS - 6) + '</svg>'
  }
  return truncated
}

export async function restyleSVG(svgString: string, theme: Theme): Promise<string> {
  const svgHash = hashString(svgString)
  const cacheKey = `ai:restyle:${svgHash}:${theme.id}`

  // 1. Cache check (uses shared singleton from lib/cache/redis)
  try {
    const cached = await redis.get<string>(cacheKey)
    if (cached && typeof cached === 'string' && isValidSVG(cached)) {
      return cached
    }
  } catch (err) {
    console.warn('[restyleSVG] Redis cache read failed:', err)
  }

  // 2. Truncate SVG if needed
  const truncatedSVG = truncateSVG(svgString)

  // 3. Call Claude Haiku
  const client = getAnthropicClient()

  try {
    const response = await client.messages.create({
      model: MODELS.restyle,
      max_tokens: 4096,
      system: RESTYLE_SYSTEM_PROMPT,
      tools: [
        {
          name: 'apply_theme',
          description: 'Return the SVG with colors updated to match the provided theme',
          input_schema: RestyleSVGToolInputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: 'apply_theme' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Apply this theme to the SVG:\n\nTheme: ${JSON.stringify(theme, null, 2)}\n\nSVG:\n${truncatedSVG}`,
            },
          ],
        },
      ],
    })

    // 4. Extract tool_use block
    const toolBlock = response.content.find((b) => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.warn('[restyleSVG] No tool_use block in response')
      return svgString
    }

    const parsed = AIRestyleSchema.safeParse(toolBlock.input)
    if (!parsed.success) {
      console.warn('[restyleSVG] Zod parse failure:', parsed.error.flatten())
      return svgString
    }

    const modifiedSvg = parsed.data.svg

    // 5. Validate output is parseable SVG
    if (!isValidSVG(modifiedSvg)) {
      console.error('[restyleSVG] Output is not valid SVG, returning original')
      return svgString
    }

    // 6. Cache with 3d TTL (uses TTL constant from lib/cache/redis)
    try {
      await redis.set(cacheKey, modifiedSvg, { ex: TTL.AI_RESTYLE })
    } catch (err) {
      console.warn('[restyleSVG] Redis cache write failed:', err)
    }

    return modifiedSvg
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 429) {
      console.error('[restyleSVG] Rate limited by Anthropic API')
      const { AppError: AE } = await import('@/lib/types')
      throw AE.rateLimited(60)
    }
    console.error('[restyleSVG] API error, returning original SVG:', err)
    return svgString
  }
}
