"use client";

import Link from "next/link";
import type { Project, ProjectStatus } from "@/lib/types";

const FONT_MONO = "auxMono, monospace";
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string; border: string; pulse: boolean }> = {
  pending:    { label: "Pending",    color: "rgba(255,255,255,0.40)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.10)", pulse: false },
  converting: { label: "Converting", color: "#f59e0b",               bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.20)",  pulse: true  },
  ready:      { label: "Ready",      color: "#34d399",               bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.20)",  pulse: false },
  error:      { label: "Error",      color: "#f87171",               bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.20)", pulse: false },
};

interface ProjectCardProps {
  project: Project;
  isGuest?: boolean;
}

function StatusBadge({ status, pulse }: { status: ProjectStatus; pulse: boolean }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 8px",
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      fontSize: 9,
      fontFamily: FONT_MONO,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      borderRadius: 0,
      flexShrink: 0,
    }}>
      {pulse && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: cfg.color,
          display: "inline-block",
          animation: "pulse-dot 1.4s ease-in-out infinite",
        }} />
      )}
      {cfg.label}
    </span>
  );
}

function CardContent({ project, isGuest }: ProjectCardProps) {
  const isReady = project.status === "ready";

  return (
    <article
      className="animate-stagger-in group"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#131313",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 0,
        transition: "border-color 0.2s, transform 0.2s",
        fontFamily: FONT_BODY,
      }}
      onMouseEnter={(e) => {
        if (!isReady) return;
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          aspectRatio: "4/3",
          position: "relative",
          overflow: "hidden",
          background: "#0d0d0d",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {project.kind === "video" ? (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="1" />
              <line x1="6" y1="6" x2="6" y2="18" />
              <line x1="10" y1="6" x2="10" y2="18" />
              <line x1="14" y1="6" x2="14" y2="18" />
              <line x1="18" y1="6" x2="18" y2="18" />
            </svg>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: FONT_MONO, letterSpacing: "0.08em" }}>
              STOP MOTION
            </span>
          </div>
        ) : project.svg_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.svg_url}
            alt={project.name}
            width={400}
            height={300}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 24,
              transition: "transform 0.5s ease",
              filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.4))",
            }}
            className="group-hover:scale-105"
          />
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        padding: "14px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {project.name}
          </p>
          <p style={{ marginTop: 3, fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: FONT_MONO }}>
            {new Date(project.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <StatusBadge status={project.status} pulse={STATUS_CONFIG[project.status].pulse} />
          {isGuest && project.status === "ready" && (
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: FONT_MONO }}>Sign in to export</span>
          )}
        </div>
      </div>

      {project.error_message && (
        <p style={{ padding: "0 16px 12px", fontSize: 11, color: "#f87171", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {project.error_message}
        </p>
      )}
    </article>
  );
}

export function ProjectCard({ project, isGuest }: ProjectCardProps) {
  if (project.status === "ready" && !isGuest) {
    const href =
      project.kind === "video"
        ? `/editor/${project.id}/stopmotion`
        : `/editor/${project.id}`;
    return (
      <Link href={href} aria-label={`Open ${project.name}`} style={{ textDecoration: "none", display: "block" }}>
        <CardContent project={project} isGuest={isGuest} />
      </Link>
    );
  }

  return <CardContent project={project} isGuest={isGuest} />;
}
