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
  isGuest?: boolean;
}

function CardContent({ project, isGuest }: ProjectCardProps) {
  const badge = STATUS_CONFIG[project.status];
  const isReady = project.status === "ready";

  return (
    <article
      className={cn(
        "animate-stagger-in group flex flex-col overflow-hidden transition-all duration-300",
        isReady && "hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--accent-glow)]",
      )}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "16px",
        boxShadow: "var(--shadow-card)",
        ...(isReady ? {} : {}),
      }}
    >
      {/* Thumbnail */}
      <div
        className="card-thumbnail-grid relative w-full overflow-hidden"
        style={{
          aspectRatio: "4/3",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        {/* Radial glow centre — teal tint, fades at edges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 50%, var(--accent-glow) 0%, transparent 70%)",
            opacity: 0.6,
          }}
        />

        {project.svg_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.svg_url}
            alt={project.name}
            width={400}
            height={300}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.10))" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2 p-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
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

        <div className="flex flex-col items-end gap-1">
          <Badge variant={badge.variant} pulse={badge.pulse}>
            {badge.label}
          </Badge>
          {isGuest && project.status === "ready" && (
            <span className="text-[10px] text-[var(--text-muted)]">Sign in to export</span>
          )}
        </div>
      </div>

      {project.error_message && (
        <p className="px-4 pb-3 text-xs text-[var(--destructive)] line-clamp-2">
          {project.error_message}
        </p>
      )}
    </article>
  );
}

export function ProjectCard({ project, isGuest }: ProjectCardProps) {
  if (project.status === "ready" && !isGuest) {
    return (
      <Link href={`/editor/${project.id}`} aria-label={`Open ${project.name}`}>
        <CardContent project={project} isGuest={isGuest} />
      </Link>
    );
  }

  return <CardContent project={project} isGuest={isGuest} />;
}
