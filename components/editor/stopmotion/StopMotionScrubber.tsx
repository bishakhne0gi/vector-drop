'use client'

import { useEffect, useRef } from 'react'

type Props = {
  tSec: number
  totalDurationSec: number
  isPlaying: boolean
  onScrub: (tSec: number) => void
  onTogglePlay: () => void
}

export function StopMotionScrubber({
  tSec,
  totalDurationSec,
  isPlaying,
  onScrub,
  onTogglePlay,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<{ wallMs: number; baseT: number } | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startRef.current = null
      return
    }
    startRef.current = {
      wallMs: performance.now(),
      baseT: tSec >= totalDurationSec ? 0 : tSec,
    }
    const step = (now: number) => {
      const { wallMs, baseT } = startRef.current!
      const next = Math.min(baseT + (now - wallMs) / 1000, totalDurationSec)
      onScrub(next)
      if (next < totalDurationSec) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        onTogglePlay()
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault()
        onTogglePlay()
      } else if (e.code === 'ArrowLeft') {
        onScrub(Math.max(0, tSec - 0.1))
      } else if (e.code === 'ArrowRight') {
        onScrub(Math.min(totalDurationSec, tSec + 0.1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tSec, totalDurationSec, onScrub, onTogglePlay])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const delta = e.deltaY / 500
      onScrub(
        Math.max(0, Math.min(totalDurationSec, tSec + delta * totalDurationSec)),
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [tSec, totalDurationSec, onScrub])

  return (
    <div
      ref={wrapperRef}
      className="flex items-center gap-3 border-t border-neutral-800 bg-neutral-900 p-3"
    >
      <button
        type="button"
        onClick={onTogglePlay}
        className="rounded bg-neutral-800 px-3 py-1 text-sm text-white hover:bg-neutral-700"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        min={0}
        max={totalDurationSec}
        step={totalDurationSec / 1000}
        value={tSec}
        onChange={(e) => onScrub(parseFloat(e.target.value))}
        className="flex-1"
      />
      <span className="w-16 text-right font-mono text-sm text-neutral-400">
        {tSec.toFixed(2)}s
      </span>
    </div>
  )
}
