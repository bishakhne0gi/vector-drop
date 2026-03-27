import { createHash } from 'crypto'
import { XMLParser } from 'fast-xml-parser'
import { callWithTool, MODELS } from './providerAdapter'
import { AIGenerateFromDNASchema, GenerateFromDNAToolInputSchema } from './schemas'
import { GENERATE_FROM_DNA_SYSTEM_PROMPT } from './prompts'
import { cacheGet, cacheSet } from '@/lib/cache/redis'
import type { IconStyleDNA, AIProvider } from '@/lib/types'

const GENERATE_FROM_DNA_TTL = 3 * 24 * 60 * 60 // 3 days

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

// Replace hardcoded color values in stroke/fill attributes with currentColor.
// Handles hex (#fff, #ffffff), rgb(...), rgba(...), named colors (basic set), and "none".
function enforceCurrentColor(svg: string): string {
  let result = svg
  result = result.replace(/\b(stroke)="(?!none|currentColor)[^"]+"/gi, 'stroke="currentColor"')
  result = result.replace(/\b(fill)="(?!none|currentColor)[^"]+"/gi, 'fill="currentColor"')
  result = result.replace(/\b(stroke)='(?!none|currentColor)[^']+'/gi, "stroke='currentColor'")
  result = result.replace(/\b(fill)='(?!none|currentColor)[^']+'/gi, "fill='currentColor'")
  return result
}

interface GenerateFromDNAResult {
  svg: string
  description: string
  pathCount: number
}

export async function generateFromDNA(
  imageBase64: string,
  imageMimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  prompt: string,
  dna: IconStyleDNA,
  provider: AIProvider = 'claude',
): Promise<GenerateFromDNAResult> {
  const cacheKey = `ai:gen-from-dna:${hashString(imageBase64 + dna.id + prompt)}`

  const cached = await cacheGet<GenerateFromDNAResult>(cacheKey)
  if (
    cached &&
    typeof cached === 'object' &&
    typeof cached.svg === 'string' &&
    isValidSVG(cached.svg)
  ) {
    return cached
  }

  // Interpolate gridSize and safeAreaPadding into the system prompt
  const systemPrompt = GENERATE_FROM_DNA_SYSTEM_PROMPT.replace(
    /\{gridSize\}/g,
    String(dna.gridSize),
  ).replace(/\{safeAreaPadding\}/g, String(dna.safeAreaPadding))

  const userTextBlock = [
    `Reference image shows: ${prompt}`,
    '',
    'Target library DNA:',
    JSON.stringify(dna, null, 2),
    '',
    `Generate an icon depicting '${prompt}' in this exact library style.`,
  ].join('\n')

  let rawInput: unknown
  try {
    rawInput = await callWithTool({
      provider,
      model: MODELS.styleTransfer,
      systemPrompt,
      userContent: [
        { type: 'image', mimeType: imageMimeType, data: imageBase64 },
        { type: 'text', text: userTextBlock },
      ],
      tool: {
        name: 'generate_icon_from_reference',
        description:
          'Return a clean SVG icon generated from the reference image in the target library style',
        inputSchema: GenerateFromDNAToolInputSchema,
      },
    })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 429) {
      console.error('[generateFromDNA] Rate limited by AI provider')
      throw err
    }
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        route: 'lib/ai/generateFromDNA',
        userId: null,
        error: {
          code: 'PIPELINE_ERROR',
          message: 'AI provider did not return a function call',
          context: { provider },
        },
      }),
    )
    throw err
  }

  const parsed = AIGenerateFromDNASchema.safeParse(rawInput)
  if (!parsed.success) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        route: 'lib/ai/generateFromDNA',
        userId: null,
        error: {
          code: 'PIPELINE_ERROR',
          message: 'Zod parse failure on generate_icon_from_reference output (generateFromDNA)',
          context: { issues: parsed.error.flatten() },
        },
      }),
    )
    throw new Error('AI provider returned malformed icon data')
  }

  let outputSvg = parsed.data.svg
  const description = parsed.data.description
  let pathCount = parsed.data.pathCount ?? 0

  if (!isValidSVG(outputSvg)) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        route: 'lib/ai/generateFromDNA',
        userId: null,
        error: { code: 'PIPELINE_ERROR', message: 'Output SVG failed validation' },
      }),
    )
    throw new Error('Generated SVG is not valid')
  }

  // Derive pathCount from SVG if Claude omitted it
  if (!pathCount) {
    pathCount = (outputSvg.match(/<path/gi) ?? []).length
  }

  // Post-process: enforce currentColor if DNA requires it
  if (dna.colorMode === 'currentColor') {
    outputSvg = enforceCurrentColor(outputSvg)
  }

  const result: GenerateFromDNAResult = { svg: outputSvg, description, pathCount }

  await cacheSet(cacheKey, result, GENERATE_FROM_DNA_TTL)

  return result
}
