export type FrameResult = { frameIdx: number; svgUrl: string }

export type ConvertFramesArgs = {
  projectId: string
  blobs: Blob[]
  fetchFn?: typeof fetch
  signal?: AbortSignal
  onProgress?: (frac: number) => void
}

export async function convertFrames(args: ConvertFramesArgs): Promise<FrameResult[]> {
  const fetchFn = args.fetchFn ?? fetch
  const results: FrameResult[] = []
  for (let i = 0; i < args.blobs.length; i++) {
    if (args.signal?.aborted) break
    const ok = await tryConvert(args.projectId, i, args.blobs[i], fetchFn, args.signal)
    if (ok) results.push({ frameIdx: i, svgUrl: ok })
    args.onProgress?.((i + 1) / args.blobs.length)
  }
  return results
}

async function tryConvert(
  projectId: string,
  idx: number,
  blob: Blob,
  fetchFn: typeof fetch,
  signal?: AbortSignal,
): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) return null
    try {
      const fd = new FormData()
      fd.append('frame', blob, `${idx}.png`)
      const res = await fetchFn(`/api/projects/${projectId}/frames/${idx}/convert`, {
        method: 'POST',
        body: fd,
        signal,
      })
      if (res.ok) {
        const data = (await res.json()) as { svg_url: string }
        return data.svg_url
      }
    } catch {
      // fall through to retry
    }
  }
  return null
}
