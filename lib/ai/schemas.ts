import { z } from 'zod'

// ---------------------------------------------------------------------------
// Internal schemas (used by Claude API layer)
// ---------------------------------------------------------------------------

export const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  name: z.string(),
  prominence: z.number().min(0).max(1),
})

export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  palette: z.array(ColorSchema).min(2).max(8),
  mood: z.enum(['minimal', 'vibrant', 'earthy', 'monochrome', 'neon']),
})

export type Color = z.infer<typeof ColorSchema>
export type Theme = z.infer<typeof ThemeSchema>

// ---------------------------------------------------------------------------
// Public-facing API schemas (stable contract, test-verified)
// ---------------------------------------------------------------------------

export const AISuggestionSchema = z.object({
  themes: z.array(z.string()).min(1),
  dominantColors: z.array(z.string()).min(1),
  suggestedPalettes: z
    .array(
      z.object({
        name: z.string(),
        colors: z.array(z.string()),
      }),
    )
    .min(1),
  styleNotes: z.string().optional(),
})

export type AISuggestion = z.infer<typeof AISuggestionSchema>

export const AIRestyleSchema = z.object({
  svg: z.string().min(1),
  appliedTheme: z.string(),
})

export type AIRestyle = z.infer<typeof AIRestyleSchema>

// ---------------------------------------------------------------------------
// Fallback — must satisfy AISuggestionSchema (validated by tests)
// ---------------------------------------------------------------------------

export const FALLBACK_SUGGESTION: AISuggestion = {
  themes: ['minimal', 'vibrant', 'earthy', 'neon'],
  dominantColors: ['#2D3748', '#718096', '#E2E8F0', '#FFFFFF'],
  suggestedPalettes: [
    { name: 'Grayscale', colors: ['#1A202C', '#718096', '#E2E8F0'] },
    { name: 'Ocean', colors: ['#2B6CB0', '#38B2AC', '#BEE3F8'] },
    { name: 'Earth', colors: ['#744210', '#C05621', '#F6E05E'] },
    { name: 'Neon', colors: ['#0D0D0D', '#00FF94', '#BD00FF'] },
  ],
  styleNotes: 'Unable to analyze image. Using default theme suggestions.',
}

// ---------------------------------------------------------------------------
// JSON Schemas for Claude tool_use input_schema
// ---------------------------------------------------------------------------

export const AISuggestionToolInputSchema = {
  type: 'object' as const,
  properties: {
    themes: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      description: 'Style theme names applicable to this image (e.g. "minimal", "vibrant")',
    },
    dominantColors: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      description: 'Dominant hex color values in the image (e.g. "#FF5733")',
    },
    suggestedPalettes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          colors: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'colors'],
      },
      minItems: 1,
      description: 'Named color palettes derived from the image',
    },
    styleNotes: {
      type: 'string',
      description: 'Optional notes about the visual style of the image',
    },
  },
  required: ['themes', 'dominantColors', 'suggestedPalettes'],
}

export const RestyleSVGToolInputSchema = {
  type: 'object' as const,
  properties: {
    svg: { type: 'string', minLength: 1, description: 'The complete modified SVG string' },
    appliedTheme: { type: 'string', description: 'The name of the theme that was applied' },
  },
  required: ['svg', 'appliedTheme'],
}

export const GenerateIconToolInputSchema = {
  type: 'object' as const,
  properties: {
    svg: {
      type: 'string',
      minLength: 1,
      description: 'Complete SVG string with only <path> elements, viewBox="0 0 24 24"',
    },
    description: {
      type: 'string',
      description: 'Brief description of what the icon depicts',
    },
    pathCount: {
      type: 'number',
      description: 'Number of <path> elements in the SVG',
    },
  },
  required: ['svg', 'description', 'pathCount'],
}

export const AIGenerateIconSchema = z.object({
  svg: z.string().min(1),
  description: z.string().optional().default(''),
  pathCount: z.number().int().min(0).max(64).optional(),
})

export type AIGenerateIcon = z.infer<typeof AIGenerateIconSchema>
