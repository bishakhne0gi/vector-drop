"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Project, ProjectStatus } from "@/lib/types";

type BadgeVariantType = "default" | "success" | "warning" | "error" | "info" | "accent";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: BadgeVariantType; pulse: boolean }
> = {
  pending: { label: "Pending", variant: "default", pulse: false },
  converting: { label: "Converting", variant: "warning", pulse: true },
  ready: { label: "Ready", variant: "success", pulse: false },
  error: { label: "Error", variant: "error", pulse: false },
};

interface ProjectCardProps {
  project: Project;
}

function CardContent({ project }: ProjectCardProps) {
  const badge = STATUS_CONFIG[project.status];
  const isReady = project.status === "ready";

  return (
    <article
      className={cn(
        "animate-stagger-in glass-card group flex flex-col gap-0 overflow-hidden transition-all duration-200",
        isReady && "hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--accent-glow)]",
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-[var(--bg-glass)]">
        {project.svg_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.svg_url}
            alt={project.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2 p-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {project.name}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {new Date(project.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <Badge variant={badge.variant} pulse={badge.pulse}>
          {badge.label}
        </Badge>
      </div>

      {project.error_message && (
        <p className="px-5 pb-4 text-xs text-[var(--destructive)] line-clamp-2">
          {project.error_message}
        </p>
      )}
    </article>
  );
}

export function ProjectCard({ project }: ProjectCardProps) {
  if (project.status === "ready") {
    return (
      <Link href={`/editor/${project.id}`} aria-label={`Open ${project.name}`}>
        <CardContent project={project} />
      </Link>
    );
  }

  return <CardContent project={project} />;
}
