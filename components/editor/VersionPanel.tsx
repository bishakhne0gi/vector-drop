"use client";

import { useQuery } from "@tanstack/react-query";
import { useEditorStore } from "@/stores/editorStore";
import { parseSvg } from "@/lib/parseSvg";
import type { ProjectVersionWithUnlock } from "@/lib/types";

const FONT_MONO = "auxMono, monospace";

interface VersionPanelProps {
  projectId: string;
}

/**
 * Version history.
 *
 * Switching, previewing, and restoring versions are all FREE — only exporting
 * an edited version that is not yet unlocked costs anything. The panel says so
 * explicitly, because a history people are afraid to click is not history.
 */
export function VersionPanel({ projectId }: VersionPanelProps) {
  const setPaths = useEditorStore((s) => s.setPaths);
  const setSvgMeta = useEditorStore((s) => s.setSvgMeta);

  const { data: versions, isLoading } = useQuery<ProjectVersionWithUnlock[]>({
    queryKey: ["versions", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      if (!res.ok) throw new Error(`Failed to load versions (${res.status})`);
      return res.json();
    },
  });

  async function loadVersion(version: ProjectVersionWithUnlock) {
    // Fetch the stored SVG through the export route with cost 0 for originals;
    // for edits this is a preview only — the charge happens on download.
    const res = await fetch(
      `/api/projects/${projectId}/export?format=svg&versionId=${version.id}`,
    );
    if (!res.ok) return;
    const text = await res.text();
    const { paths, meta } = parseSvg(text);
    setPaths(paths);
    setSvgMeta(meta);
  }

  if (isLoading || !versions || versions.length === 0) return null;

  return (
    <aside
      aria-label="Version history"
      style={{
        borderTop: "1px solid var(--border-glass)",
        padding: "12px 14px",
        maxHeight: 240,
        overflowY: "auto",
      }}
    >
      <p
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          margin: "0 0 10px",
        }}
      >
        Versions · switching is free
      </p>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
        {versions.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => void loadVersion(v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "7px 9px",
                background: "var(--bg-glass)",
                border: "1px solid var(--border-glass)",
                borderRadius: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: "var(--text-primary)" }}>
                  v{v.version_number}
                  {v.source === "conversion" ? " · original" : ""}
                </span>
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: FONT_MONO }}>
                  {new Date(v.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </span>

              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                  color: v.unlocked ? "rgba(120,255,180,0.85)" : "var(--text-muted)",
                }}
              >
                {v.unlocked ? "free export" : "0.1 credit"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
