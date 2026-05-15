'use client'

import { useMemo } from 'react'
import type { Path, Schedule } from '@/lib/stopmotion/types'
import { renderFrame } from '@/lib/stopmotion/render-frame'

type Props = {
  paths: Path[]
  schedule: Schedule[]
  tSec: number
  totalDurationSec: number
  viewBox: string
}

export function StopMotionCanvas({
  paths,
  schedule,
  tSec,
  totalDurationSec,
  viewBox,
}: Props) {
  const svg = useMemo(
    () => renderFrame(paths, schedule, tSec, totalDurationSec, viewBox),
    [paths, schedule, tSec, totalDurationSec, viewBox],
  )
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div
        className="aspect-square w-full max-w-[720px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
