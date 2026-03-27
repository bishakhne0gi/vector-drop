import { GoogleGenerativeAI } from '@google/generative-ai'

export const GEMINI_MODELS = {
  analysis: 'gemini-2.5-pro',
  restyle: 'gemini-2.5-pro',
  generate: 'gemini-2.5-pro',
  styleTransfer: 'gemini-2.5-pro',
  dnaExtract: 'gemini-2.5-pro',
}

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set')
  return new GoogleGenerativeAI(apiKey)
}
