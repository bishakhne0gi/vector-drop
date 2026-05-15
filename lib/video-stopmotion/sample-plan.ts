export type SamplePlanArgs = {
  durationSec: number
  samplingFps: number
  maxFrames: number
}

export function samplePlan({ durationSec, samplingFps, maxFrames }: SamplePlanArgs): number[] {
  if (durationSec <= 0 || samplingFps <= 0 || maxFrames <= 0) return []
  const step = 1 / samplingFps
  const stamps: number[] = []
  for (let t = 0; t <= durationSec + 1e-9 && stamps.length < maxFrames; t += step) {
    stamps.push(Math.min(t, durationSec))
  }
  return stamps
}
