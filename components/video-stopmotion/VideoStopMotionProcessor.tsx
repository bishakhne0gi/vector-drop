'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { samplePlan } from '@/lib/video-stopmotion/sample-plan'
import { extractFrame } from '@/lib/video-stopmotion/extract-frame'
import { convertFrames } from '@/lib/video-stopmotion/convert-frames'

type Props = { projectId: string; videoUrl: string }

type ExistingFrame = { frame_idx: number }

export function VideoStopMotionProcessor({ projectId, videoUrl }: Props) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [progress, setProgress] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)
  const [doneFrames, setDoneFrames] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    abortRef.current = new AbortController()

    async function run() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      if (video.readyState < 2) {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => { cleanup(); resolve() }
          const onErr = () => {
            cleanup()
            const code = video.error?.code
            const msg =
              code === 4
                ? 'Video format not supported by your browser. Try an H.264 .mp4 (iPhone: Settings → Camera → Formats → "Most Compatible").'
                : 'Failed to load the uploaded video. Try reloading the page — the signed URL may have expired.'
            reject(new Error(msg))
          }
          const cleanup = () => {
            video.removeEventListener('canplay', onReady)
            video.removeEventListener('error', onErr)
          }
          video.addEventListener('canplay', onReady, { once: true })
          video.addEventListener('error', onErr, { once: true })
        })
      }
      if (cancelled) return

      const stamps = samplePlan({
        durationSec: video.duration,
        samplingFps: 8,
        maxFrames: 40,
      })
      setTotalFrames(stamps.length)

      // Resume: skip frames already converted.
      const existingRes = await fetch(`/api/projects/${projectId}/frames`)
      const existing: ExistingFrame[] = existingRes.ok ? await existingRes.json() : []
      const haveIdx = new Set<number>(existing.map((f) => f.frame_idx))
      if (cancelled) return

      // Extract every missing frame, in order. Maintain a mapping idx → blob.
      const blobsByIdx: Record<number, Blob> = {}
      for (let i = 0; i < stamps.length; i++) {
        if (cancelled || abortRef.current?.signal.aborted) return
        if (haveIdx.has(i)) continue
        const blob = await extractFrame(video, stamps[i], canvas)
        blobsByIdx[i] = blob
      }

      // Convert only the missing indices, sequentially.
      const missingIdx = stamps.map((_, i) => i).filter((i) => !haveIdx.has(i))
      const missingBlobs = missingIdx.map((i) => blobsByIdx[i])
      const totalToDo = missingBlobs.length
      const already = haveIdx.size

      await convertFrames({
        projectId,
        blobs: missingBlobs,
        signal: abortRef.current!.signal,
        onProgress: (frac) => {
          if (cancelled) return
          setProgress((already + frac * totalToDo) / stamps.length)
          setDoneFrames(already + Math.round(frac * totalToDo))
        },
      })

      if (!cancelled) {
        router.push(`/editor/${projectId}/stopmotion`)
      }
    }

    run().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e))
    })
    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, videoUrl])

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 py-2 text-sm">
        Processing video — {doneFrames} of {totalFrames} frames
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          autoPlay
          loop
          className="max-h-full max-w-full"
          crossOrigin="anonymous"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <div className="border-t border-neutral-800 bg-neutral-900 p-3">
        <div className="h-2 w-full overflow-hidden rounded bg-neutral-800">
          <div
            className="h-full bg-white transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={() => abortRef.current?.abort()}
          className="mt-3 rounded bg-neutral-800 px-3 py-1 text-sm hover:bg-neutral-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
