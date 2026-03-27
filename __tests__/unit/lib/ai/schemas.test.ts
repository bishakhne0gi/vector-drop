import { describe, it, expect } from 'vitest'
import {
  AISuggestionSchema,
  AIRestyleSchema,
  ColorSchema,
  ThemeSchema,
  FALLBACK_SUGGESTION,
} from '@/lib/ai/schemas'

// ---------------------------------------------------------------------------
// ColorSchema
// ---------------------------------------------------------------------------

describe('ColorSchema', () => {
  const valid = { hex: '#FF5733', name: 'Red', prominence: 0.4 }

  it('accepts a valid color', () => {
    expect(ColorSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects hex without leading #', () => {
    expect(ColorSchema.safeParse({ ...valid, hex: 'FF5733' }).success).toBe(false)
  })

  it('rejects shorthand hex (#FFF)', () => {
    expect(ColorSchema.safeParse({ ...valid, hex: '#FFF' }).success).toBe(false)
  })

  it('rejects 8-char hex (alpha channel)', () => {
    expect(ColorSchema.safeParse({ ...valid, hex: '#FF5733AA' }).success).toBe(false)
  })

  it('rejects prominence below 0', () => {
    expect(ColorSchema.safeParse({ ...valid, prominence: -0.1 }).success).toBe(false)
  })

  it('rejects prominence above 1', () => {
    expect(ColorSchema.safeParse({ ...valid, prominence: 1.1 }).success).toBe(false)
  })

  it('accepts prominence at boundary values 0 and 1', () => {
    expect(ColorSchema.safeParse({ ...valid, prominence: 0 }).success).toBe(true)
    expect(ColorSchema.safeParse({ ...valid, prominence: 1 }).success).toBe(true)
  })

  it('rejects missing name', () => {
    const { name: _n, ...rest } = valid
    expect(ColorSchema.safeParse(rest).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ThemeSchema
// ---------------------------------------------------------------------------

describe('ThemeSchema', () => {
  const color = { hex: '#FF5733', name: 'Red', prominence: 0.5 }
  const valid = {
    id: 'theme-1',
    name: 'Warm',
    description: 'A warm palette',
    palette: [color, { ...color, hex: '#33FF57', name: 'Green' }],
    mood: 'vibrant' as const,
  }

  it('accepts a valid theme', () => {
    expect(ThemeSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects palette with fewer than 2 colors', () => {
    expect(ThemeSchema.safeParse({ ...valid, palette: [color] }).success).toBe(false)
  })

  it('rejects palette with more than 8 colors', () => {
    const colors = Array.from({ length: 9 }, (_, i) => ({
      hex: `#${String(i + 10).padStart(2, '0')}FF57`,
      name: `Color${i}`,
      prominence: 0.1,
    }))
    expect(ThemeSchema.safeParse({ ...valid, palette: colors }).success).toBe(false)
  })

  it('rejects invalid mood value', () => {
    expect(ThemeSchema.safeParse({ ...valid, mood: 'pastel' }).success).toBe(false)
  })

  it('accepts all valid mood values', () => {
    const moods = ['minimal', 'vibrant', 'earthy', 'monochrome', 'neon'] as const
    for (const mood of moods) {
      expect(ThemeSchema.safeParse({ ...valid, mood }).success).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// AISuggestionSchema (public-facing, simple string arrays)
// ---------------------------------------------------------------------------

describe('AISuggestionSchema', () => {
  const valid = {
    themes: ['minimal', 'vibrant'],
    dominantColors: ['#FF5733', '#33FF57'],
    suggestedPalettes: [
      { name: 'Warm', colors: ['#FF5733', '#FF8C42'] },
      { name: 'Cool', colors: ['#33FF57', '#3357FF'] },
    ],
    styleNotes: 'Clean geometric shapes.',
  }

  it('accepts a fully valid suggestion', () => {
    expect(AISuggestionSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects response missing themes field', () => {
    const { themes: _t, ...rest } = valid
    expect(AISuggestionSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects response missing dominantColors field', () => {
    const { dominantColors: _dc, ...rest } = valid
    expect(AISuggestionSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects response missing suggestedPalettes field', () => {
    const { suggestedPalettes: _sp, ...rest } = valid
    expect(AISuggestionSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects empty themes array', () => {
    expect(AISuggestionSchema.safeParse({ ...valid, themes: [] }).success).toBe(false)
  })

  it('rejects themes as a non-array', () => {
    expect(AISuggestionSchema.safeParse({ ...valid, themes: 'minimal' }).success).toBe(false)
  })

  it('rejects themes array with non-string elements', () => {
    expect(AISuggestionSchema.safeParse({ ...valid, themes: [1, 2] }).success).toBe(false)
  })

  it('rejects empty dominantColors array', () => {
    expect(AISuggestionSchema.safeParse({ ...valid, dominantColors: [] }).success).toBe(false)
  })

  it('rejects empty suggestedPalettes array', () => {
    expect(AISuggestionSchema.safeParse({ ...valid, suggestedPalettes: [] }).success).toBe(false)
  })

  it('rejects palette entry missing name', () => {
    expect(
      AISuggestionSchema.safeParse({
        ...valid,
        suggestedPalettes: [{ colors: ['#FF5733'] }],
      }).success
    ).toBe(false)
  })

  it('rejects palette entry missing colors', () => {
    expect(
      AISuggestionSchema.safeParse({
        ...valid,
        suggestedPalettes: [{ name: 'Warm' }],
      }).success
    ).toBe(false)
  })

  it('accepts missing optional styleNotes field', () => {
    const { styleNotes: _sn, ...rest } = valid
    expect(AISuggestionSchema.safeParse(rest).success).toBe(true)
  })

  it('rejects null input', () => {
    expect(AISuggestionSchema.safeParse(null).success).toBe(false)
  })

  it('rejects empty object', () => {
    expect(AISuggestionSchema.safeParse({}).success).toBe(false)
  })

  it('rejects string input (not an object)', () => {
    expect(AISuggestionSchema.safeParse('{"themes":["x"]}').success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// FALLBACK_SUGGESTION — must always satisfy AISuggestionSchema
// ---------------------------------------------------------------------------

describe('FALLBACK_SUGGESTION', () => {
  it('is a valid AISuggestion', () => {
    expect(AISuggestionSchema.safeParse(FALLBACK_SUGGESTION).success).toBe(true)
  })

  it('has at least one theme', () => {
    expect(FALLBACK_SUGGESTION.themes.length).toBeGreaterThan(0)
  })

  it('has at least one dominant color', () => {
    expect(FALLBACK_SUGGESTION.dominantColors.length).toBeGreaterThan(0)
  })

  it('has at least one suggested palette', () => {
    expect(FALLBACK_SUGGESTION.suggestedPalettes.length).toBeGreaterThan(0)
  })

  it('each palette entry has a name and at least one color', () => {
    for (const palette of FALLBACK_SUGGESTION.suggestedPalettes) {
      expect(typeof palette.name).toBe('string')
      expect(palette.colors.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// AIRestyleSchema
// ---------------------------------------------------------------------------

describe('AIRestyleSchema', () => {
  it('accepts valid restyle output', () => {
    expect(
      AIRestyleSchema.safeParse({
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
        appliedTheme: 'warm',
      }).success
    ).toBe(true)
  })

  it('rejects missing svg field', () => {
    expect(AIRestyleSchema.safeParse({ appliedTheme: 'warm' }).success).toBe(false)
  })

  it('rejects empty svg string', () => {
    expect(AIRestyleSchema.safeParse({ svg: '', appliedTheme: 'warm' }).success).toBe(false)
  })

  it('rejects non-string svg', () => {
    expect(AIRestyleSchema.safeParse({ svg: 123, appliedTheme: 'warm' }).success).toBe(false)
  })

  it('rejects missing appliedTheme field', () => {
    expect(
      AIRestyleSchema.safeParse({ svg: '<svg/>' }).success
    ).toBe(false)
  })
})
