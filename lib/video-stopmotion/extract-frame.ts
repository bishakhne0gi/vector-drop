export async function extractFrame(
  video: HTMLVideoElement,
  tSec: number,
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  video.currentTime = tSec
  await new Promise<void>((resolve) =>
    video.addEventListener('seeked', () => resolve(), { once: true }),
  )
  // Buffer one rAF — some browsers fire `seeked` before the decoded frame is ready.
  await new Promise((r) => requestAnimationFrame(() => r(null)))
  const ctx = canvas.getContext('2d')!
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
      'image/png',
    ),
  )
}
