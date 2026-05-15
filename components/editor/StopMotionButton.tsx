'use client'

import Link from 'next/link'
import { Clapperboard } from 'lucide-react'

export function StopMotionButton({ projectId }: { projectId: string }) {
  return (
    <Link
      href={`/editor/${projectId}/stopmotion`}
      className="inline-flex items-center gap-1.5 rounded border border-[var(--border-glass)] bg-[var(--bg-glass)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-glass-strong)]"
      aria-label="Open stop-motion view"
      style={{ height: 32, fontFamily: 'auxMono, monospace' }}
    >
      <Clapperboard className="h-4 w-4" />
      <span className="hidden sm:inline">Stop Motion</span>
    </Link>
  )
}
