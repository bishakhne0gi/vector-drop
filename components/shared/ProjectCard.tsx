"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-foreground/8 text-foreground/60",
  },
  converting: {
    label: "Converting",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  ready: {
    label: "Ready",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  error: {
    label: "Error",
    className: "bg-destructive/10 text-destructive",
  },
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const badge = STATUS_CONFIG[project.status];
  const isReady = project.status === "ready";

  const card = (
    <article
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 transition-colors duration-150",
        isReady && "hover:border-foreground/30 hover:bg-foreground/[0.02]",
      )}
    >
      {/* Thumbnail / placeholder */}
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-foreground/5">
        {project.svg_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.svg_url}
            alt={project.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-foreground/30">No preview</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {project.name}
          </p>
          <p className="mt-0.5 text-xs text-foreground/50">
            {new Date(project.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>

      {project.error_message && (
        <p className="text-xs text-destructive line-clamp-2">
          {project.error_message}
        </p>
      )}
    </article>
  );

  if (isReady) {
    return (
      <Link href={`/editor/${project.id}`} aria-label={`Open ${project.name}`}>
        {card}
      </Link>
    );
  }

  return card;
}
