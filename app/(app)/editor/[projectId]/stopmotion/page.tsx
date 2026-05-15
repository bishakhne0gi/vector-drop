import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { VideoStopMotionView, type Frame } from '@/components/video-stopmotion/VideoStopMotionView'

async function fetchJson<T>(path: string): Promise<T | null> {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const res = await fetch(`${proto}://${host}${path}`, {
    headers: { cookie: h.get('cookie') ?? '' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

export default async function VideoStopMotionPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const [project, frames] = await Promise.all([
    fetchJson<{ name: string; kind: string }>(`/api/projects/${projectId}`),
    fetchJson<Frame[]>(`/api/projects/${projectId}/frames`),
  ])
  if (!project || project.kind !== 'video' || !Array.isArray(frames) || frames.length === 0) {
    notFound()
  }
  return <VideoStopMotionView projectName={project.name ?? 'untitled'} frames={frames} />
}
