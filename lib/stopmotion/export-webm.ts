import type { Path, Schedule } from './types'
import { renderFrame } from './render-frame'

export type WebmOptions = {
  totalDurationSec: number
  width: number
  height: number
  viewBox: string
}

// Records `totalDurationSec` of the stop-motion animation as a WebM blob.
export async function exportWebm(
  paths: Path[],
  sched: Schedule[],
  opts: WebmOptions,
  onProgress?: (frac: number) => void,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = opts.width
  canvas.height = opts.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, opts.width, opts.height)

  const stream = canvas.captureStream(60)
  const chunks: Blob[] = []
  const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
  })

  rec.start()
  const startMs = performance.now()
  const totalMs = opts.totalDurationSec * 1000

  await new Promise<void>((resolve) => {
    function step() {
      const elapsed = performance.now() - startMs
      const frac = Math.min(elapsed / totalMs, 1)
      const t = frac * opts.totalDurationSec
      drawSvgToCanvas(
        ctx,
        renderFrame(paths, sched, t, opts.totalDurationSec, opts.viewBox),
        opts.width,
        opts.height,
      )
      onProgress?.(frac)
      if (frac >= 1) {
        resolve()
        return
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })

  rec.stop()
  return done
}

function drawSvgToCanvas(
  ctx: CanvasRenderingContext2D,
  svg: string,
  w: number,
  h: number,
): void {
  const img = new Image()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  img.src = url
  img.onload = () => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(url)
  }
}
