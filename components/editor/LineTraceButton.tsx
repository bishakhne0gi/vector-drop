'use client'

import Link from 'next/link'
import { Clapperboard } from 'lucide-react'

export function LineTraceButton({ projectId }: { projectId: string }) {
  return (
    <Link
      href={`/editor/${projectId}/linetrace`}
      className="inline-flex items-center gap-1.5 rounded border border-[var(--border-glass)] bg-[var(--bg-glass)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-glass-strong)]"
      aria-label="Open line-trace view"
      style={{ height: 32, fontFamily: 'auxMono, monospace' }}
    >
      <Clapperboard className="h-4 w-4" />
      <span className="hidden sm:inline">Line Trace</span>
    </Link>
  )
}
