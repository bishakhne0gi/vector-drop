import { quantizeColors } from './quantize'
import { traceColorMask } from './maskTrace'
import { assembleSvg } from './assembleSvg'

// Quantize → trace each color mask → assemble into one SVG.
// Used by both the image-convert route and the per-frame video-stopmotion route.
export async function runConversionPipeline(
  rawBuffer: Buffer,
  colorCount: number,
): Promise<string> {
  const { clusters, width, height } = await quantizeColors(rawBuffer, colorCount)
  const totalPixels = width * height
  const layers: Array<{ pathD: string; color: [number, number, number] }> = []

  for (let i = 0; i < clusters.length; i += 4) {
    const batch = clusters.slice(i, i + 4)
    const results = await Promise.all(
      batch.map((cluster) =>
        traceColorMask(width, height, cluster.indices, totalPixels),
      ),
    )
    for (let j = 0; j < batch.length; j++) {
      const pathD = results[j]
      if (pathD) layers.push({ pathD, color: batch[j].color })
    }
  }

  return assembleSvg(layers, width, height)
}
