'use client'

import { useEffect, useMemo, useState } from 'react'
import { exportVideoAnimatedSvg } from '@/lib/video-stopmotion/export-animated-svg'
import { exportWebm } from '@/lib/line-trace/export-webm'

export type Frame = { frame_idx: number; svg_url: string; duration_ms: number }
type AspectRatio = '1:1' | '9:16' | '16:9'

const ASPECT_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
}

type Props = { projectName: string; frames: Frame[] }

export function VideoStopMotionView({ projectName, frames }: Props) {
  const [svgStrings, setSvgStrings] = useState<string[] | null>(null)
  const [perFrameMs, setPerFrameMs] = useState(125)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [aspect, setAspect] = useState<AspectRatio>('1:1')
  const [webmProgress, setWebmProgress] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(frames.map((f) => fetch(f.svg_url).then((r) => r.text())))
      .then((arr) => {
        if (!cancelled) setSvgStrings(arr)
      })
      .catch(() => {
        if (!cancelled) setSvgStrings([])
      })
    return () => {
      cancelled = true
    }
  }, [frames])

  useEffect(() => {
    if (!isPlaying || !svgStrings || svgStrings.length === 0) return
    const id = setTimeout(() => {
      setCurrentIdx((i) => {
        const next = i + 1
        if (next >= frames.length) {
          setIsPlaying(false)
          return 0
        }
        return next
      })
    }, perFrameMs)
    return () => clearTimeout(id)
  }, [isPlaying, currentIdx, perFrameMs, frames.length, svgStrings])

  const viewBox = useMemo(() => {
    if (!svgStrings || !svgStrings[0]) return '0 0 100 100'
    const m = svgStrings[0].match(/viewBox="([^"]+)"/)
    return m?.[1] ?? '0 0 100 100'
  }, [svgStrings])

  const totalDurationSec = (frames.length * perFrameMs) / 1000

  function renderAt(tSec: number): string {
    if (!svgStrings || svgStrings.length === 0) return `<svg viewBox="${viewBox}"></svg>`
    const idx = Math.min(Math.floor(tSec / (perFrameMs / 1000)), svgStrings.length - 1)
    return svgStrings[idx]
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function handleExportSvg() {
    if (!svgStrings) return
    const out = exportVideoAnimatedSvg(
      svgStrings,
      Array(svgStrings.length).fill(perFrameMs),
      viewBox,
    )
    download(new Blob([out], { type: 'image/svg+xml' }), `${projectName}-stopmotion.svg`)
  }

  async function handleExportWebm() {
    if (!svgStrings) return
    setWebmProgress(0)
    try {
      const dims = ASPECT_DIMS[aspect]
      const blob = await exportWebm(
        renderAt,
        { totalDurationSec, width: dims.w, height: dims.h },
        (p) => setWebmProgress(p),
      )
      download(blob, `${projectName}-stopmotion.webm`)
    } finally {
      setWebmProgress(null)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 py-2 text-sm">
        Stop Motion — {projectName} ({frames.length} frames)
      </header>
      <div className="flex flex-1 min-h-0">
        <div className="flex flex-1 items-center justify-center">
          <div
            className="aspect-square w-full max-w-[720px]"
            dangerouslySetInnerHTML={{
              __html: svgStrings?.[currentIdx] ?? '<svg/>',
            }}
          />
        </div>
        <aside className="hidden md:flex w-80 shrink-0 flex-col gap-4 border-l border-neutral-800 bg-neutral-900 p-4 text-sm">
          <h2 className="text-base font-semibold">Stop Motion</h2>
          <label className="flex flex-col gap-1">
            <span>Frame duration: {perFrameMs} ms</span>
            <input
              type="range"
              min={60}
              max={500}
              step={5}
              value={perFrameMs}
              onChange={(e) => setPerFrameMs(parseInt(e.target.value, 10))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Export aspect (video)</span>
            <select
              value={aspect}
              onChange={(e) => setAspect(e.target.value as AspectRatio)}
              className="rounded bg-neutral-800 p-1"
            >
              <option value="1:1">1:1</option>
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
            </select>
          </label>
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={handleExportSvg}
              className="rounded bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-100"
            >
              Export Animated SVG
            </button>
            <button
              type="button"
              onClick={handleExportWebm}
              disabled={webmProgress !== null}
              className="rounded bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {webmProgress === null
                ? 'Export Video (.webm)'
                : `Recording… ${Math.round(webmProgress * 100)}%`}
            </button>
          </div>
        </aside>
      </div>
      <div className="flex items-center gap-3 border-t border-neutral-800 bg-neutral-900 p-3">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="rounded bg-neutral-800 px-3 py-1 text-sm text-white hover:bg-neutral-700"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          step={1}
          value={currentIdx}
          onChange={(e) => setCurrentIdx(parseInt(e.target.value, 10))}
          className="flex-1"
        />
        <span className="w-20 text-right font-mono text-sm text-neutral-400">
          {currentIdx + 1} / {frames.length}
        </span>
      </div>
    </div>
  )
}
