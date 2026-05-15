import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { VideoStopMotionProcessor } from '@/components/video-stopmotion/VideoStopMotionProcessor'

type ProjectMeta = { kind: string; source_url?: string | null }

async function getProject(id: string): Promise<ProjectMeta | null> {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const res = await fetch(`${proto}://${host}/api/projects/${id}`, {
    headers: { cookie: h.get('cookie') ?? '' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function VideoProcessingPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProject(projectId)
  if (!project || project.kind !== 'video' || !project.source_url) notFound()
  return <VideoStopMotionProcessor projectId={projectId} videoUrl={project.source_url} />
}
