export type VideoMeta = { durationSec: number; width: number; height: number }

export function probeVideo(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    v.src = url
    v.onloadedmetadata = () => {
      const meta = { durationSec: v.duration, width: v.videoWidth, height: v.videoHeight }
      URL.revokeObjectURL(url)
      resolve(meta)
    }
    v.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video metadata'))
    }
  })
}
