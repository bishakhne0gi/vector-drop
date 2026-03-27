"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { serializeSvg } from "./EditorCanvas";
import { GenerateIconPanel } from "./GenerateIconPanel";

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
  const [generateOpen, setGenerateOpen] = useState(false);

  // Global keyboard shortcuts
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

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }

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

  return (
    <div className="shrink-0">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
        {/* Left: project name */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm font-medium text-foreground">{projectName}</span>
        </div>

        {/* Center: undo/redo */}
        <div className="flex items-center gap-1" role="group" aria-label="History controls">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-foreground/8 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Undo (Cmd+Z)"
            title="Undo"
          >
            <UndoIcon />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-foreground/8 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Redo (Cmd+Shift+Z)"
            title="Redo"
          >
            <RedoIcon />
          </button>
        </div>

        {/* Right: generate + save + toast */}
        <div className="flex items-center gap-3">
          {saveState === "error" && errorMsg && (
            <span className="text-xs text-destructive" role="alert">
              {errorMsg}
            </span>
          )}
          {saveState === "success" && (
            <span className="text-xs text-green-600 dark:text-green-400" role="status">
              Saved
            </span>
          )}
          <button
            onClick={() => setGenerateOpen((o) => !o)}
            className={[
              "flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              generateOpen
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground hover:bg-foreground/8",
            ].join(" ")}
            aria-label="Generate icon with AI"
            aria-expanded={generateOpen}
          >
            <SparkleIcon />
            Generate
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saveState === "saving" || !svgMeta}
            className="flex h-8 items-center gap-2 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Save project"
          >
            {saveState === "saving" ? (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background"
                aria-hidden="true"
              />
            ) : null}
            Save
          </button>
        </div>
      </header>

      {generateOpen && (
        <GenerateIconPanel
          projectId={projectId}
          onClose={() => setGenerateOpen(false)}
        />
      )}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 6H9.5C11.433 6 13 7.567 13 9.5S11.433 13 9.5 13H5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.5 3.5L3 6l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13 6H6.5C4.567 6 3 7.567 3 9.5S4.567 13 6.5 13H11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.5 3.5L13 6l-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
