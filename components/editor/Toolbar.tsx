"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditorStore } from "@/stores/editorStore";
import { serializeSvg } from "./EditorCanvas";

interface ToolbarProps {
  projectId: string;
  projectName: string;
}

type SaveState = "idle" | "saving" | "success" | "error";

function exportPng(
  svgContent: string,
  width: number,
  height: number,
  scale: number,
  name: string,
) {
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(pngBlob);
      a.download = `${name}.png`;
      a.click();
    });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/* ─── Tooltip ────────────────────────────────────────────────── */

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg-glass-strong)",
            border: "1px solid var(--border-glass)",
            backdropFilter: "blur(12px)",
            color: "var(--text-secondary)",
            fontSize: "10px",
            padding: "3px 7px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 100,
          }}
          role="tooltip"
        >
          {label}
        </span>
      )}
    </span>
  );
}

/* ─── Export dropdown ─────────────────────────────────────────── */

function ExportDropdown({
  onDownloadSvg,
  onExportPng1x,
  onExportPng2x,
  onCopySvg,
  onCopyDataUrl,
  disabled,
}: {
  onDownloadSvg: () => void;
  onExportPng1x: () => void;
  onExportPng2x: () => void;
  onCopySvg: () => void;
  onCopyDataUrl: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 12px",
    fontSize: "12px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "background 0.12s, color 0.12s",
    border: "none",
    background: "transparent",
    width: "100%",
    textAlign: "left",
  };

  function Item({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
      <button
        onClick={() => { onClick(); setOpen(false); }}
        style={itemStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-glass)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="btn-accent flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <DownloadIcon />
        <span className="hidden sm:inline">Export</span>
        <ChevronIcon />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            minWidth: "190px",
            background: "var(--bg-glass-strong)",
            border: "1px solid var(--border-glass)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            backdropFilter: "blur(16px)",
            padding: "6px",
            zIndex: 50,
          }}
          role="menu"
        >
          <Item onClick={onDownloadSvg}>
            <DownloadIcon /> Download SVG
          </Item>
          <Item onClick={onExportPng1x}>
            <ImageIcon /> Export PNG 1×
          </Item>
          <Item onClick={onExportPng2x}>
            <ImageIcon /> Export PNG 2×
          </Item>
          <div
            style={{
              height: "1px",
              background: "var(--border-subtle, var(--border-glass))",
              margin: "4px 0",
            }}
          />
          <Item onClick={onCopySvg}>
            <CopyIcon /> Copy SVG code
          </Item>
          <Item onClick={onCopyDataUrl}>
            <CopyIcon /> Copy as Data URL
          </Item>
        </div>
      )}
    </div>
  );
}

/* ─── Toolbar ─────────────────────────────────────────────────── */

export function Toolbar({ projectId, projectName }: ToolbarProps) {
  const paths = useEditorStore((s) => s.paths);
  const svgMeta = useEditorStore((s) => s.svgMeta);
  const history = useEditorStore((s) => s.history);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);

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

  function getSvgContent() {
    if (!svgMeta) return null;
    return serializeSvg(paths, svgMeta.viewBox, svgMeta.width, svgMeta.height);
  }

  function handleDownload() {
    const svgContent = getSvgContent();
    if (!svgContent) return;
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

  function handleExportPng(scale: number) {
    const svgContent = getSvgContent();
    if (!svgContent || !svgMeta) return;
    exportPng(svgContent, svgMeta.width, svgMeta.height, scale, projectName);
  }

  function handleCopySvg() {
    const svgContent = getSvgContent();
    if (!svgContent) return;
    void navigator.clipboard.writeText(svgContent);
  }

  function handleCopyDataUrl() {
    const svgContent = getSvgContent();
    if (!svgContent) return;
    const b64 = btoa(unescape(encodeURIComponent(svgContent)));
    const dataUrl = `data:image/svg+xml;base64,${b64}`;
    void navigator.clipboard.writeText(dataUrl);
  }

  function handleFitToView() {
    window.dispatchEvent(new CustomEvent("editor:fit"));
  }

  const zoomPct = Math.round(zoom * 100);

  const iconBtn =
    "flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

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

      {/* Center: undo/redo + zoom */}
      <div className="flex items-center gap-1" role="group" aria-label="Editor controls">
        <Tooltip label="⌘Z">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={iconBtn}
            aria-label="Undo"
          >
            <UndoIcon />
          </button>
        </Tooltip>
        <Tooltip label="⇧⌘Z">
          <button
            onClick={redo}
            disabled={!canRedo}
            className={iconBtn}
            aria-label="Redo"
          >
            <RedoIcon />
          </button>
        </Tooltip>

        {/* Divider */}
        <span
          aria-hidden="true"
          style={{ width: "1px", height: "18px", background: "var(--border-glass)", margin: "0 4px" }}
        />

        {/* Zoom controls */}
        <button
          onClick={() => setZoom(zoom / 1.25)}
          className={iconBtn}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <MinusIcon />
        </button>

        <button
          onClick={(e) => {
            if (e.shiftKey) {
              handleFitToView();
            } else {
              setZoom(1);
            }
          }}
          className="flex h-7 min-w-[52px] items-center justify-center rounded-lg px-2 text-xs font-medium tabular-nums text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Zoom level — click to reset, shift+click to fit"
          title="Click to reset to 100%, Shift+click to fit to view"
        >
          {zoomPct}%
        </button>

        <button
          onClick={() => setZoom(zoom * 1.25)}
          className={iconBtn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <PlusIcon />
        </button>

        <button
          onClick={handleFitToView}
          className={iconBtn}
          aria-label="Fit to view"
          title="Fit to view"
        >
          <FitIcon />
        </button>
      </div>

      {/* Right: save state + export + save */}
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

        {/* Coming soon badge */}
        <div className="hidden items-center gap-1.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-glass)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] md:flex">
          <span>✨ Icon Gen</span>
          <span className="rounded-full bg-[var(--accent-glow)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--accent)]">
            Soon
          </span>
        </div>

        <ExportDropdown
          onDownloadSvg={handleDownload}
          onExportPng1x={() => handleExportPng(1)}
          onExportPng2x={() => handleExportPng(2)}
          onCopySvg={handleCopySvg}
          onCopyDataUrl={handleCopyDataUrl}
          disabled={!svgMeta}
        />

        <Tooltip label="⌘S">
          <button
            onClick={() => void handleSave()}
            disabled={saveState === "saving" || !svgMeta}
            className="flex h-8 items-center gap-2 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-glass)] px-4 text-xs font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-glass-strong)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Save project"
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
        </Tooltip>
      </div>
    </header>
  );
}

/* ─── Icons ─────────────────────────────────────────────────── */

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

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 6V2h4M10 2h4v4M15 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 6 8 10 12 6" />
    </svg>
  );
}
