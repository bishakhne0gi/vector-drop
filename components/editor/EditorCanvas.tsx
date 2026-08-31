"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useEditorStore, type SVGMeta } from "@/stores/editorStore";
// Single shared parser. EditorCanvas used to keep its own copy, which
// generated random path ids on every load — so layer names churned between
// sessions and the two implementations could drift apart.
import { parseSvg } from "@/lib/parseSvg";
import { PathElement } from "./PathElement";
import {
  AdjustFilterDefs,
  AdjustmentToolbar,
  DEFAULT_ADJUST,
  type AdjustState,
} from "./AdjustmentToolbar";
import { PathEditOverlay } from "./PathEditOverlay";
import { EditModeToolbar } from "./EditModeToolbar";

interface EditorCanvasProps {
  svgUrl: string;
}

// Re-exported so existing importers keep working; the definition now lives in
// lib/editor/serialize because the store needs it too.
export { serializeSvg } from "@/lib/editor/serialize";

export function EditorCanvas({ svgUrl }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<SVGMeta | null>(null);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const [adjust, setAdjust] = useState<AdjustState>(DEFAULT_ADJUST);
  const filterId = `adjust-${useId().replace(/:/g, "")}`;

  const paths = useEditorStore((s) => s.paths);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const loadPaths = useEditorStore((s) => s.loadPaths);
  const storeMeta = useEditorStore((s) => s.svgMeta);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const editingPathId = useEditorStore((s) => s.editingPathId);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setIsLoading(true);

    fetch(svgUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load SVG: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const { paths: parsed, meta: parsedMeta } = parseSvg(text);
        // svgUrl points at the project's current SVG, i.e. its latest version,
        // so the baseline version id is left null to mean exactly that.
        loadPaths(parsed, parsedMeta, null);
        setMeta(parsedMeta);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError((err as Error).message);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [svgUrl, loadPaths]);

  // Block native wheel on the canvas container (passive:false required for preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) { e.preventDefault(); }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Listen for fit-to-view event from Toolbar
  useEffect(() => {
    function handleFit() {
      const container = containerRef.current;
      const activeMeta = storeMeta ?? meta;
      if (!container || !activeMeta) return;
      const { clientWidth: cw, clientHeight: ch } = container;
      const MIN_DISPLAY = 480;
      const displayW = Math.max(activeMeta.width, MIN_DISPLAY);
      const displayH = Math.max(activeMeta.height, MIN_DISPLAY);
      const scale = Math.min(cw / displayW, ch / displayH) * 0.85;
      setZoom(scale);
      setPan(0, 0);
    }
    window.addEventListener("editor:fit", handleFit);
    return () => window.removeEventListener("editor:fit", handleFit);
  }, [storeMeta, meta, setZoom, setPan]);

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    // Figma convention: ctrl/meta + wheel (and trackpad pinch, which browsers
    // dispatch as a wheel event with ctrlKey=true) zooms about the cursor.
    // Plain wheel / two-finger scroll pans in both axes.
    if (e.ctrlKey || e.metaKey) {
      const rect = container.getBoundingClientRect();
      // Cursor position relative to container center — this is the coord
      // system our transformed div lives in (transform-origin: center center).
      const cx = e.clientX - (rect.left + rect.width / 2);
      const cy = e.clientY - (rect.top + rect.height / 2);
      const factor = Math.exp(-e.deltaY * 0.002);
      const newZoom = Math.max(0.05, Math.min(64, zoom * factor));
      const k = newZoom / zoom;
      // Keep the point under the cursor fixed while the scale changes.
      setZoom(newZoom);
      setPan(cx - (cx - panX) * k, cy - (cy - panY) * k);
    } else {
      setPan(panX - e.deltaX, panY - e.deltaY);
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    // Only start panning when the press started on the background itself —
    // not on a child (path, anchor, handle, toolbar). Without this the canvas
    // would hijack drags meant for vector-edit anchors.
    if (e.target !== e.currentTarget) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: panX, ty: panY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grabbing";
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan(panStart.current.tx + dx, panStart.current.ty + dy);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (isPanning.current) {
      isPanning.current = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      e.currentTarget.style.cursor = "grab";
    }
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  const activeMeta = storeMeta ?? meta;

  const MIN_DISPLAY = 480;
  const displayWidth = activeMeta ? Math.max(activeMeta.width, MIN_DISPLAY) : MIN_DISPLAY;
  const displayHeight = activeMeta ? Math.max(activeMeta.height, MIN_DISPLAY) : MIN_DISPLAY;

  if (isLoading || !activeMeta) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  const selectedCount = selectedIds.size;
  const pathCount = paths.length;
  const zoomPct = Math.round(zoom * 100);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) clearSelection();
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          cursor: "grab",
          backgroundImage: "radial-gradient(circle, var(--border-default) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundColor: "var(--bg-canvas, #1e1e1e)",
        }}
        aria-label="SVG editor canvas"
        role="application"
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isPanning.current ? "none" : "transform 0.05s ease-out",
            }}
          >
            <div style={{ position: "relative" }}>
              <svg
                viewBox={activeMeta.viewBox}
                width={displayWidth}
                height={displayHeight}
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  display: "block",
                  maxWidth: "none",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.08)",
                  background: "#fff",
                  borderRadius: "4px",
                }}
              >
                <AdjustFilterDefs id={filterId} state={adjust} />
                <g filter={adjust.mode === "none" ? undefined : `url(#${filterId})`}>
                  {paths.map((p) => (
                    <PathElement key={p.id} path={p} />
                  ))}
                </g>
              </svg>
              {editingPathId && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: displayWidth,
                    height: displayHeight,
                    pointerEvents: "none",
                  }}
                >
                  <PathEditOverlay zoom={zoom} viewBox={activeMeta.viewBox} />
                </div>
              )}
            </div>
          </div>
        </div>

        <AdjustmentToolbar state={adjust} onChange={setAdjust} />
        <EditModeToolbar />
      </div>

      {/* Bottom status bar */}
      <div
        className="glass flex h-7 shrink-0 items-center justify-between px-3"
        style={{
          borderTop: "1px solid var(--border-subtle, var(--border-glass))",
          borderRadius: 0,
          fontSize: "10px",
          color: "var(--text-muted)",
        }}
        aria-label="Canvas status"
      >
        {/* Left: dimensions */}
        <span>
          W: {activeMeta.width}&nbsp;&nbsp;H: {activeMeta.height}
        </span>

        {/* Center: path counts */}
        <span>
          {pathCount} path{pathCount !== 1 ? "s" : ""}
          {selectedCount > 0 && (
            <span style={{ color: "var(--text-primary)" }}>
              &nbsp;&nbsp;{selectedCount} selected
            </span>
          )}
        </span>

        {/* Right: zoom + fit */}
        <div className="flex items-center gap-1">
          <span>{zoomPct}%</span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("editor:fit"))}
            className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[var(--bg-glass)]"
            aria-label="Fit to view"
            title="Fit to view"
            style={{ cursor: "pointer" }}
          >
            <FitIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function FitIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 6V2h4M10 2h4v4M15 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
