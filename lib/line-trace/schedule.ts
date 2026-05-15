import type { Params, Path, Schedule, SortMode } from './types'

export function sortPaths(paths: Path[], mode: SortMode): Path[] {
  if (mode === 'document') return paths
  return [...paths].sort(
    (a, b) => b.bbox.width * b.bbox.height - a.bbox.width * a.bbox.height,
  )
}

export function buildSchedule(paths: Path[], params: Params): Schedule[] {
  if (paths.length === 0) return []
  const visible = sortPaths(paths, params.sortMode).slice(0, params.maxPaths)
  const n = visible.length
  const total = params.totalDurationSec

  if (params.staggerMode === 'sequential') {
    const window = total / n
    return visible.map((_, i) => ({
      pathStartSec: i * window,
      pathEndSec: (i + 1) * window,
    }))
  }

  // overlapped: stride = 0.4 * window; window * (1 + 0.4 * (n - 1)) = total
  const window = total / (1 + 0.4 * (n - 1))
  const stride = 0.4 * window
  return visible.map((_, i) => ({
    pathStartSec: i * stride,
    pathEndSec: i * stride + window,
  }))
}
