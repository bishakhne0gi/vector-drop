import { useState, useEffect } from 'react'
import type { AIProvider } from '@/lib/types'

export function useAIProvider(): [AIProvider, (p: AIProvider) => void] {
  const [provider, setProviderState] = useState<AIProvider>('claude')

  useEffect(() => {
    const stored = localStorage.getItem('ai-provider')
    if (stored === 'claude' || stored === 'gemini') {
      setProviderState(stored)
    }
  }, [])

  function setProvider(p: AIProvider) {
    setProviderState(p)
    localStorage.setItem('ai-provider', p)
  }

  return [provider, setProvider]
}
