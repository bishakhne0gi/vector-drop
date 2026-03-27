import { getAnthropicClient, MODELS } from './client'
import { getGeminiClient, GEMINI_MODELS } from './geminiClient'
import type { AIProvider } from '@/lib/types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeminiTools = any

// ─── Content block types ──────────────────────────────────────────────────────

export interface ImageBlock {
  type: 'image'
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  data: string // base64
}

export interface TextBlock {
  type: 'text'
  text: string
}

export type ContentBlock = TextBlock | ImageBlock

// ─── Tool definition ──────────────────────────────────────────────────────────

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown> // JSON Schema object
}

// ─── Call options ─────────────────────────────────────────────────────────────

export interface CallOptions {
  provider: AIProvider
  model: string // used for claude; gemini always uses GEMINI_MODELS values
  systemPrompt: string
  userContent: ContentBlock[]
  tool: ToolDefinition
}

// ─── JSON Schema → Gemini schema converter ────────────────────────────────────

function convertJsonSchemaToGemini(schema: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  if (schema.type) {
    result.type = String(schema.type).toUpperCase()
  }
  if (schema.description) result.description = schema.description

  // Gemini only supports string enums — numeric enums must be described in text
  if (schema.enum) {
    const enumValues = schema.enum as unknown[]
    if (enumValues.every((v) => typeof v === 'string')) {
      result.enum = enumValues
    } else {
      // Fold numeric enum into description so Gemini knows the valid values
      const existing = (result.description as string) ?? ''
      result.description = `${existing} Must be one of: ${enumValues.join(', ')}.`.trim()
    }
  }

  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties as Record<string, unknown>).map(([k, v]) => [
        k,
        convertJsonSchemaToGemini(v as Record<string, unknown>),
      ]),
    )
  }
  if (schema.required) result.required = schema.required
  if (schema.items) result.items = convertJsonSchemaToGemini(schema.items as Record<string, unknown>)
  if (schema.minItems) result.minItems = schema.minItems
  if (schema.maxItems) result.maxItems = schema.maxItems
  if (schema.minLength) result.minLength = schema.minLength

  return result
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function callWithTool(options: CallOptions): Promise<unknown> {
  const { provider, model, systemPrompt, userContent, tool } = options

  if (provider === 'claude') {
    const client = getAnthropicClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anthropicContent: any[] = userContent.map((block) => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text }
      }
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: block.mimeType,
          data: block.data,
        },
      }
    })

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ name: tool.name, description: tool.description, input_schema: tool.inputSchema as any }],
      tool_choice: { type: 'tool', name: tool.name },
      messages: [{ role: 'user', content: anthropicContent }],
    })

    const toolBlock = response.content.find((b) => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error(`Claude did not call the ${tool.name} tool`)
    }
    return toolBlock.input
  }

  // ── Gemini ────────────────────────────────────────────────────────────────
  const genAI = getGeminiClient()
  const geminiTools: GeminiTools = [
    {
      functionDeclarations: [
        {
          name: tool.name,
          description: tool.description,
          parameters: convertJsonSchemaToGemini(tool.inputSchema),
        },
      ],
    },
  ]
  const geminiToolConfig: GeminiTools = {
    functionCallingConfig: {
      mode: 'ANY',
      allowedFunctionNames: [tool.name],
    },
  }
  const geminiModel = genAI.getGenerativeModel({
    model: GEMINI_MODELS.analysis,
    tools: geminiTools,
    toolConfig: geminiToolConfig,
    systemInstruction: systemPrompt,
  })

  const parts = userContent.map((block) => {
    if (block.type === 'text') return { text: block.text }
    return { inlineData: { mimeType: block.mimeType, data: block.data } }
  })

  const result = await geminiModel.generateContent({ contents: [{ role: 'user', parts }] })
  const candidate = result.response.candidates?.[0]
  const functionCallPart = candidate?.content?.parts?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => p.functionCall,
  )
  if (!functionCallPart?.functionCall) {
    throw new Error(`Gemini did not return a function call for tool ${tool.name}`)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (functionCallPart.functionCall as any).args
}

// Re-export MODELS so callers can use it without an additional import
export { MODELS }
