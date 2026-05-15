import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { StopMotionView } from '@/components/editor/stopmotion/StopMotionView'

type ProjectResponse = { id: string; name: string; svg_url: string | null }

async function getProject(id: string): Promise<ProjectResponse | null> {
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

export default async function StopMotionPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProject(projectId)
  if (!project || !project.svg_url) notFound()

  const svgRes = await fetch(project.svg_url, { cache: 'no-store' })
  if (!svgRes.ok) notFound()
  const svgString = await svgRes.text()

  return (
    <StopMotionView
      projectName={project.name ?? 'untitled'}
      svgString={svgString}
    />
  )
}
