import { createHash } from 'crypto'
import { XMLParser } from 'fast-xml-parser'
import { callWithTool, MODELS } from './providerAdapter'
import { AIRestyleSchema, RestyleSVGToolInputSchema, type Theme } from './schemas'
import { RESTYLE_SYSTEM_PROMPT } from './prompts'
import type { AIProvider } from '@/lib/types'

const SVG_MAX_CHARS = 32000 // ~8000 tokens at ~4 chars/token

async function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import('@upstash/redis')
  return new Redis({ url, token })
}

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

export async function restyleSVG(
  svgString: string,
  theme: Theme,
  provider: AIProvider = 'claude',
): Promise<string> {
  const svgHash = hashString(svgString)
  const cacheKey = `ai:restyle:${svgHash}:${theme.id}`

  // 1. Cache check
  const redis = await getRedisClient()
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey)
      if (cached && typeof cached === 'string' && isValidSVG(cached)) {
        return cached
      }
    } catch (err) {
      console.warn('[restyleSVG] Redis cache read failed:', err)
    }
  }

  // 2. Truncate SVG if needed
  const truncatedSVG = truncateSVG(svgString)

  // 3. Call AI provider
  try {
    const rawResult = await callWithTool({
      provider,
      model: MODELS.restyle,
      systemPrompt: RESTYLE_SYSTEM_PROMPT,
      userContent: [
        {
          type: 'text',
          text: `Apply this theme to the SVG:\n\nTheme: ${JSON.stringify(theme, null, 2)}\n\nSVG:\n${truncatedSVG}`,
        },
      ],
      tool: {
        name: 'apply_theme',
        description: 'Return the SVG with colors updated to match the provided theme',
        inputSchema: RestyleSVGToolInputSchema,
      },
    })

    const parsed = AIRestyleSchema.safeParse(rawResult)
    if (!parsed.success) {
      console.warn('[restyleSVG] Zod parse failure:', parsed.error.flatten())
      return svgString
    }

    const modifiedSvg = parsed.data.svg

    // 4. Validate output is parseable SVG
    if (!isValidSVG(modifiedSvg)) {
      console.error('[restyleSVG] Output is not valid SVG, returning original')
      return svgString
    }

    // 5. Cache with 3d TTL
    if (redis) {
      try {
        await redis.set(cacheKey, modifiedSvg, { ex: 3 * 24 * 60 * 60 })
      } catch (err) {
        console.warn('[restyleSVG] Redis cache write failed:', err)
      }
    }

    return modifiedSvg
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 429) {
      console.error('[restyleSVG] Rate limited by AI provider')
      throw err
    }
    console.error('[restyleSVG] API error, returning original SVG:', err)
    return svgString
  }
}
