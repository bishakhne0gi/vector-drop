import { createHash } from 'crypto'
import { XMLParser } from 'fast-xml-parser'
import { callWithTool, MODELS } from './providerAdapter'
import { AIStyleTransferSchema, StyleTransferToolInputSchema } from './schemas'
import { STYLE_TRANSFER_SYSTEM_PROMPT } from './prompts'
import { cacheGet, cacheSet } from '@/lib/cache/redis'
import { AppError } from '@/lib/types'
import type { IconStyleDNA, AIProvider } from '@/lib/types'

const SVG_MAX_CHARS = 32000
const STYLE_TRANSFER_TTL = 3 * 24 * 60 * 60 // 3 days

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
  console.warn(`[styleTransfer] Truncating SVG from ${svgString.length} to ${SVG_MAX_CHARS} chars`)
  let truncated = svgString.replace(/<!--[\s\S]*?-->/g, '')
  if (truncated.length <= SVG_MAX_CHARS) return truncated
  const closeIdx = truncated.lastIndexOf('</svg>')
  if (closeIdx > SVG_MAX_CHARS - 10) {
    truncated = truncated.slice(0, SVG_MAX_CHARS - 6) + '</svg>'
  }
  return truncated
}

// Replace hardcoded color values in stroke/fill attributes with currentColor.
// Handles hex (#fff, #ffffff), rgb(...), rgba(...), named colors (basic set), and "none".
function enforceCurrentColor(svg: string): string {
  let result = svg
  result = result.replace(/\b(stroke)="(?!none|currentColor)[^"]+"/gi, 'stroke="currentColor"')
  result = result.replace(/\b(fill)="(?!none|currentColor)[^"]+"/gi, 'fill="currentColor"')
  // Also handle rgb(...) and rgba(...)
  result = result.replace(/\b(stroke)='(?!none|currentColor)[^']+'/gi, "stroke='currentColor'")
  result = result.replace(/\b(fill)='(?!none|currentColor)[^']+'/gi, "fill='currentColor'")
  return result
}

interface StyleTransferResult {
  svg: string
  description: string
  pathCount: number
}

export async function styleTransfer(
  svgContent: string,
  dna: IconStyleDNA,
  provider: AIProvider = 'claude',
): Promise<StyleTransferResult> {
  if (!isValidSVG(svgContent)) {
    throw AppError.validation('Provided SVG is not valid')
  }

  const cacheKey = `ai:style-transfer:${hashString(svgContent + dna.id)}`

  const cached = await cacheGet<StyleTransferResult>(cacheKey)
  if (cached && typeof cached === 'object' && typeof cached.svg === 'string' && isValidSVG(cached.svg)) {
    return cached
  }

  const truncatedSvg = truncateSVG(svgContent)

  // Interpolate gridSize into the system prompt so the hard rule is concrete
  const systemPrompt = STYLE_TRANSFER_SYSTEM_PROMPT.replace(
    /\{gridSize\}/g,
    String(dna.gridSize),
  ).replace(/\{safeAreaPadding\}/g, String(dna.safeAreaPadding))

  const userMessage = [
    'Redraw this icon to match the target library\'s design language.',
    '',
    'Source SVG:',
    truncatedSvg,
    '',
    'Target library DNA:',
    JSON.stringify(dna, null, 2),
  ].join('\n')

  let rawInput: unknown
  try {
    rawInput = await callWithTool({
      provider,
      model: MODELS.styleTransfer,
      systemPrompt,
      userContent: [{ type: 'text', text: userMessage }],
      tool: {
        name: 'redraw_icon',
        description: 'Return the redrawn SVG icon matching the target library design DNA',
        inputSchema: StyleTransferToolInputSchema,
      },
    })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 429) {
      console.error('[styleTransfer] Rate limited by AI provider')
      throw err
    }
    console.error('[styleTransfer] API error, returning original SVG:', err)
    return { svg: svgContent, description: '', pathCount: 0 }
  }

  const parsed = AIStyleTransferSchema.safeParse(rawInput)
  if (!parsed.success) {
    console.warn('[styleTransfer] Zod parse failure:', parsed.error.flatten())
    return { svg: svgContent, description: '', pathCount: 0 }
  }

  let outputSvg = parsed.data.svg

  if (!isValidSVG(outputSvg)) {
    console.error('[styleTransfer] Output is not valid SVG, returning original')
    return { svg: svgContent, description: parsed.data.description, pathCount: 0 }
  }

  // Post-process: enforce currentColor if DNA requires it
  if (dna.colorMode === 'currentColor') {
    outputSvg = enforceCurrentColor(outputSvg)
  }

  const result: StyleTransferResult = {
    svg: outputSvg,
    description: parsed.data.description,
    pathCount: parsed.data.pathCount ?? 0,
  }

  await cacheSet(cacheKey, result, STYLE_TRANSFER_TTL)

  return result
}
