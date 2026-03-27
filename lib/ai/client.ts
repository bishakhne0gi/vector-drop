import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export const MODELS = {
  analysis: 'claude-opus-4-6',
  restyle: 'claude-haiku-4-5-20251001',
  generate: 'claude-opus-4-6',
  dnaExtract: 'claude-haiku-4-5-20251001',
  styleTransfer: 'claude-sonnet-4-6',
} as const
