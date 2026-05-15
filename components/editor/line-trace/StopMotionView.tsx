'use client'

import { useEffect, useMemo, useState } from 'react'
import { parseSvg } from '@/lib/line-trace/parse-svg'
import { buildSchedule } from '@/lib/line-trace/schedule'
import { exportAnimatedSvg } from '@/lib/line-trace/export-animated-svg'
import { exportWebm } from '@/lib/line-trace/export-webm'
import { renderFrame } from '@/lib/line-trace/render-frame'
import {
  DEFAULT_PARAMS,
  type AspectRatio,
  type Params,
  type Path,
} from '@/lib/line-trace/types'
import { StopMotionCanvas } from './StopMotionCanvas'
import { StopMotionControls } from './StopMotionControls'
import { StopMotionScrubber } from './StopMotionScrubber'

type Props = {
  projectName: string
  svgString: string
}

const ASPECT_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
}

export function StopMotionView({ projectName, svgString }: Props) {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS)
  const [aspect, setAspect] = useState<AspectRatio>('1:1')
  const [tSec, setTSec] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [webmProgress, setWebmProgress] = useState<number | null>(null)
  const [paths, setPaths] = useState<Path[]>([])
  const [viewBox, setViewBox] = useState('0 0 100 100')

  useEffect(() => {
    const parsed = parseSvg(svgString, document)
    setPaths(parsed)
    const match = svgString.match(/viewBox="([^"]+)"/)
    if (match) setViewBox(match[1])
  }, [svgString])

  const schedule = useMemo(() => buildSchedule(paths, params), [paths, params])

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function handleExportSvg() {
    const out = exportAnimatedSvg(paths, schedule, viewBox)
    download(
      new Blob([out], { type: 'image/svg+xml' }),
      `${projectName}-stopmotion.svg`,
    )
  }

  async function handleExportWebm() {
    setWebmProgress(0)
    try {
      const dims = ASPECT_DIMS[aspect]
      const renderAt = (tSec: number) =>
        renderFrame(paths, schedule, tSec, params.totalDurationSec, viewBox)
      const blob = await exportWebm(
        renderAt,
        {
          totalDurationSec: params.totalDurationSec,
          width: dims.w,
          height: dims.h,
        },
        (p) => setWebmProgress(p),
      )
      download(blob, `${projectName}-stopmotion.webm`)
    } finally {
      setWebmProgress(null)
    }
  }

  const controlProps = {
    params,
    aspect,
    onChange: setParams,
    onAspectChange: setAspect,
    onExportSvg: handleExportSvg,
    onExportWebm: handleExportWebm,
    webmProgress,
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 py-2 text-sm">
        Stop Motion — {projectName}
      </header>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <StopMotionCanvas
            paths={paths}
            schedule={schedule}
            tSec={tSec}
            totalDurationSec={params.totalDurationSec}
            viewBox={viewBox}
          />
        </div>
        <div className="hidden md:block w-80 shrink-0">
          <StopMotionControls {...controlProps} />
        </div>
      </div>
      <details className="md:hidden border-t border-neutral-800 bg-neutral-900">
        <summary className="cursor-pointer p-3 text-sm">
          Settings & Export
        </summary>
        <div className="max-h-[60vh] overflow-y-auto">
          <StopMotionControls {...controlProps} />
        </div>
      </details>
      <StopMotionScrubber
        tSec={tSec}
        totalDurationSec={params.totalDurationSec}
        isPlaying={isPlaying}
        onScrub={setTSec}
        onTogglePlay={() => setIsPlaying((p) => !p)}
      />
    </div>
  )
}
