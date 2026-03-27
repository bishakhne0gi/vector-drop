"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditorStore } from "@/stores/editorStore";
import { serializeSvg } from "./EditorCanvas";
// Icon Generation - Coming Soon (v2)
// import { GenerateIconPanel } from "./GenerateIconPanel";

interface ToolbarProps {
  projectId: string;
  projectName: string;
}

type SaveState = "idle" | "saving" | "success" | "error";

export function Toolbar({ projectId, projectName }: ToolbarProps) {
  const paths = useEditorStore((s) => s.paths);
  const svgMeta = useEditorStore((s) => s.svgMeta);
  const history = useEditorStore((s) => s.history);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, paths, svgMeta]);

  async function handleSave() {
    if (!svgMeta || saveState === "saving") return;
    setSaveState("saving");
    setErrorMsg(null);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);

    const svgContent = serializeSvg(paths, svgMeta.viewBox, svgMeta.width, svgMeta.height);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ svg_content: svgContent }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Save failed (${res.status})`);
      }
      setSaveState("success");
      successTimerRef.current = setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setSaveState("error");
      successTimerRef.current = setTimeout(() => {
        setSaveState("idle");
        setErrorMsg(null);
      }, 4000);
    }
  }

  function handleDownload() {
    if (!svgMeta) return;
    const svgContent = serializeSvg(paths, svgMeta.viewBox, svgMeta.width, svgMeta.height);
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCopySvg() {
    if (!svgMeta) return;
    const svgContent = serializeSvg(paths, svgMeta.viewBox, svgMeta.width, svgMeta.height);
    void navigator.clipboard.writeText(svgContent);
  }

  return (
    <header
      className="glass flex h-14 shrink-0 items-center justify-between px-4"
      style={{ borderRadius: 0, borderBottom: "1px solid var(--border-glass)" }}
    >
      {/* Left: back + project name */}
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-glass)] bg-[var(--bg-glass)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          aria-label="Back to dashboard"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {projectName}
        </span>
      </div>

      {/* Center: undo/redo */}
      <div className="flex items-center gap-1" role="group" aria-label="History controls">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Undo (Cmd+Z)"
          title="Undo"
        >
          <UndoIcon />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Redo (Cmd+Shift+Z)"
          title="Redo"
        >
          <RedoIcon />
        </button>
      </div>

      {/* Right: coming soon badge + download + save */}
      <div className="flex items-center gap-2">
        {saveState === "error" && errorMsg && (
          <span className="text-xs text-[var(--destructive)]" role="alert">
            {errorMsg}
          </span>
        )}
        {saveState === "success" && (
          <span className="text-xs text-emerald-500" role="status">
            Saved
          </span>
        )}

        {/* Icon Generation - Coming Soon (v2) */}
        {/* <GenerateIconPanel /> */}
        <div className="hidden items-center gap-1.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-glass)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] md:flex">
          <span>✨ Icon Gen</span>
          <span className="rounded-full bg-[var(--accent-glow)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--accent)]">
            Soon
          </span>
        </div>

        {/* Download SVG */}
        <div className="relative group">
          <button
            onClick={handleDownload}
            disabled={!svgMeta}
            className="btn-accent flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Download SVG"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hidden sm:inline">Download SVG</span>
          </button>
          {/* Copy SVG dropdown */}
          <div className="invisible absolute right-0 top-full z-50 mt-1 min-w-max rounded-xl border border-[var(--border-glass)] bg-[var(--bg-glass-strong)] p-1 opacity-0 shadow-xl backdrop-blur-xl transition-all duration-150 group-hover:visible group-hover:opacity-100">
            <button
              onClick={handleCopySvg}
              disabled={!svgMeta}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] disabled:opacity-40"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy SVG code
            </button>
          </div>
        </div>

        <button
          onClick={() => void handleSave()}
          disabled={saveState === "saving" || !svgMeta}
          className="flex h-8 items-center gap-2 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-glass)] px-4 text-xs font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-glass-strong)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Save project (Cmd+S)"
        >
          {saveState === "saving" && (
            <span
              className="h-3 w-3 rounded-full border-2 border-current/30 border-t-current"
              style={{ animation: "spin 0.7s linear infinite" }}
              aria-hidden="true"
            />
          )}
          Save
        </button>
      </div>
    </header>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 6H9.5C11.433 6 13 7.567 13 9.5S11.433 13 9.5 13H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 3.5L3 6l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 6H6.5C4.567 6 3 7.567 3 9.5S4.567 13 6.5 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.5 3.5L13 6l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
