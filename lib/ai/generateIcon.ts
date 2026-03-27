import { createHash } from 'crypto'
import { XMLParser } from 'fast-xml-parser'
import { callWithTool, MODELS } from './providerAdapter'
import {
  AIGenerateIconSchema,
  GenerateIconToolInputSchema,
  type AIGenerateIcon,
} from './schemas'
import { GENERATE_ICON_SYSTEM_PROMPT } from './prompts'
import type { IconStyle, AIProvider } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateIconParams {
  prompt: string
  style: IconStyle
  primaryColor: string
  /** When provided, source image base64 is sent for vision; must be image/jpeg */
  imageBase64?: string
  /** Source image path stored in Supabase — used only in cache key */
  imageHash?: string
  provider?: AIProvider
}

export interface GenerateIconResult {
  svgContent: string
  description: string
  pathCount: number
}

// ─── Validation ───────────────────────────────────────────────────────────────

function normalizeSVG(svgString: string): string {
  let svg = svgString.trim()

  // Strip markdown fences (second pass — may appear inside the svg field)
  svg = svg.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()

  // Wrap bare path content in an SVG root
  if (!svg.toLowerCase().includes('<svg')) {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${svg}</svg>`
  }

  // Ensure viewBox is present (AI sometimes omits it)
  if (!svg.includes('viewBox')) {
    svg = svg.replace(/<svg([^>]*)>/, '<svg$1 viewBox="0 0 24 24">')
  }

  return svg
}

function isValidIconSVG(svgString: string): { valid: boolean; reason?: string } {
  if (!svgString.toLowerCase().includes('<svg'))
    return { valid: false, reason: 'Missing <svg> tags' }

  const pathCount = (svgString.match(/<path/gi) ?? []).length
  if (pathCount === 0) return { valid: false, reason: 'No <path> elements' }

  try {
    const parser = new XMLParser({ ignoreAttributes: false })
    const result = parser.parse(svgString) as Record<string, unknown>
    if (!result || !('svg' in result)) return { valid: false, reason: 'No root <svg> element' }
  } catch {
    return { valid: false, reason: 'XML parse failure' }
  }

  return { valid: true }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

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

function buildCacheKey(params: GenerateIconParams): string {
  const inputStr = params.imageHash
    ? `${params.imageHash}:${params.style}:${params.primaryColor}`
    : `${params.prompt}:${params.style}:${params.primaryColor}`
  return `ai:icon:${hashString(inputStr)}`
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function styleGuide(style: IconStyle, primaryColor: string): string {
  if (style === 'outline')
    return `outline style: every <path> must have fill="none", stroke="${primaryColor}", stroke-width="2", stroke-linecap="round", stroke-linejoin="round"`
  if (style === 'flat')
    return `flat style: every <path> must have fill="${primaryColor}", stroke="none", stroke-width="0". Solid filled paths only, no strokes. Convert all shapes to <path> elements.`
  // duotone
  return `duotone style: primary <path> elements use fill="${primaryColor}" opacity="1", background/shadow <path> elements use fill="${primaryColor}" opacity="0.3". Two tones of the same color, all as <path> elements.`
}

function buildTextPrompt(params: GenerateIconParams): string {
  const guide = styleGuide(params.style, params.primaryColor)
  return `Create a clean, minimal SVG icon for: "${params.prompt}"

Style: ${guide}
Primary color: ${params.primaryColor}

The icon must be instantly recognizable at 24x24 pixels. Use simple geometric shapes converted to paths. Avoid fine detail that would be invisible at small sizes.`
}

function buildVisionPrompt(params: GenerateIconParams): string {
  const guide = styleGuide(params.style, params.primaryColor)
  return `Look at this image and identify its main subject.

Create a clean, minimal SVG icon that represents the CONCEPT or SILHOUETTE of that subject — not a reproduction of the photo. Think like a designer creating an icon for an app.

Style: ${guide}
Primary color: ${params.primaryColor}

Guidelines:
- Abstract the subject to its essential recognizable shape
- Use 2–6 paths maximum
- Ignore background, lighting, shadows, and texture
- The icon should be legible at 24x24 pixels`
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateIcon(params: GenerateIconParams): Promise<GenerateIconResult> {
  const isVision = Boolean(params.imageBase64)
  const provider: AIProvider = params.provider ?? 'claude'

  const cacheKey = buildCacheKey(params)

  // 1. Cache check
  const redis = await getRedisClient()
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      const asResult = cached as GenerateIconResult
      if (
        asResult &&
        typeof asResult.svgContent === 'string' &&
        typeof asResult.description === 'string' &&
        typeof asResult.pathCount === 'number'
      ) {
        const check = isValidIconSVG(asResult.svgContent)
        if (check.valid) return asResult
      }
    } catch (err) {
      console.warn('[generateIcon] Redis cache read failed:', err)
    }
  }

  // 2. Build the user content
  const userPrompt = isVision ? buildVisionPrompt(params) : buildTextPrompt(params)

  const userContent = isVision
    ? [
        { type: 'image' as const, mimeType: 'image/jpeg' as const, data: params.imageBase64! },
        { type: 'text' as const, text: userPrompt },
      ]
    : [{ type: 'text' as const, text: userPrompt }]

  // 3. Call AI provider with tool_use
  const rawResult = await callWithTool({
    provider,
    model: MODELS.generate,
    systemPrompt: GENERATE_ICON_SYSTEM_PROMPT,
    userContent,
    tool: {
      name: 'generate_icon',
      description: 'Return a clean SVG icon with only <path> elements',
      inputSchema: GenerateIconToolInputSchema,
    },
  })

  // 4. Zod validate tool input
  const parsed = AIGenerateIconSchema.safeParse(rawResult)
  if (!parsed.success) {
    console.warn('[generateIcon] Zod parse failure:', parsed.error.flatten())
    throw new Error('AI returned malformed icon data')
  }

  let { svg, description, pathCount } = parsed.data as AIGenerateIcon
  // Derive pathCount from SVG if AI omitted it
  if (!pathCount) {
    pathCount = (svg.match(/<path/g) ?? []).length
  }

  // 5. Normalize — strip fences, wrap missing root, fix viewBox
  svg = normalizeSVG(svg)

  // 6. Structural SVG validation
  const check = isValidIconSVG(svg)
  if (!check.valid) {
    console.warn(`[generateIcon] SVG validation failed: ${check.reason}`)
    throw new Error(`Generated SVG is invalid: ${check.reason}`)
  }

  const result: GenerateIconResult = { svgContent: svg, description, pathCount }

  // 7. Cache with 24h TTL
  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: 24 * 60 * 60 })
    } catch (err) {
      console.warn('[generateIcon] Redis cache write failed:', err)
    }
  }

  // 8. Log usage
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      route: 'lib/ai/generateIcon',
      userId: null,
      model: provider === 'gemini' ? 'gemini-2.5-pro' : MODELS.generate,
      provider,
      feature: 'generate-icon',
      style: params.style,
      cacheKey,
    }),
  )

  return result
}
