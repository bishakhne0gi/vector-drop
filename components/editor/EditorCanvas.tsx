"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore, type SVGPath, type SVGMeta } from "@/stores/editorStore";
import { PathElement } from "./PathElement";

interface EditorCanvasProps {
  svgUrl: string;
}

function parseSvg(text: string): { paths: SVGPath[]; meta: SVGMeta } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  const viewBox = svgEl?.getAttribute("viewBox") ?? "0 0 800 600";
  const widthAttr = svgEl?.getAttribute("width");
  const heightAttr = svgEl?.getAttribute("height");

  const parseUnit = (val: string | null | undefined, fallback: number): number => {
    if (!val) return fallback;
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const vbParts = viewBox.split(/[\s,]+/).map(Number);
  const vbW = vbParts[2] ?? 800;
  const vbH = vbParts[3] ?? 600;

  const width = parseUnit(widthAttr, vbW);
  const height = parseUnit(heightAttr, vbH);

  const pathEls = doc.querySelectorAll("path");
  let counter = 0;

  const paths: SVGPath[] = Array.from(pathEls).map((el) => {
    const rawId = el.getAttribute("id");
    const id = rawId && rawId.trim() !== "" ? rawId : `path-${++counter}-${Math.random().toString(36).slice(2, 8)}`;

    const lc = el.getAttribute("stroke-linecap") ?? "round";
    const lj = el.getAttribute("stroke-linejoin") ?? "round";
    return {
      id,
      d: el.getAttribute("d") ?? "",
      fill: el.getAttribute("fill") ?? "none",
      stroke: el.getAttribute("stroke") ?? "none",
      strokeWidth: parseFloat(el.getAttribute("stroke-width") ?? "2") || 2,
      strokeLinecap: (["butt", "round", "square"].includes(lc) ? lc : "round") as SVGPath["strokeLinecap"],
      strokeLinejoin: (["miter", "round", "bevel"].includes(lj) ? lj : "round") as SVGPath["strokeLinejoin"],
      opacity: parseFloat(el.getAttribute("opacity") ?? "1") || 1,
      visible: true,
      locked: false,
      name: id,
    };
  });

  return { paths, meta: { viewBox, width, height } };
}

export function serializeSvg(paths: SVGPath[], viewBox: string, width: number, height: number): string {
  const pathEls = paths
    .map(
      (p) =>
        `<path id="${p.id}" d="${p.d}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linecap="${p.strokeLinecap}" stroke-linejoin="${p.strokeLinejoin}" opacity="${p.opacity}" />`,
    )
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">\n${pathEls}\n</svg>`;
}

export function EditorCanvas({ svgUrl }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<SVGMeta | null>(null);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const paths = useEditorStore((s) => s.paths);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setPaths = useEditorStore((s) => s.setPaths);
  const setSvgMeta = useEditorStore((s) => s.setSvgMeta);
  const storeMeta = useEditorStore((s) => s.svgMeta);
  const clearSelection = useEditorStore((s) => s.clearSelection);
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
        setPaths(parsed);
        setMeta(parsedMeta);
        setSvgMeta(parsedMeta);
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
  }, [svgUrl, setPaths, setSvgMeta]);

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
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(zoom * factor);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: panX, ty: panY };
    e.currentTarget.style.cursor = "grabbing";
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan(panStart.current.tx + dx, panStart.current.ty + dy);
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (isPanning.current) {
      isPanning.current = false;
      e.currentTarget.style.cursor = "grab";
    }
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
    if (isPanning.current) {
      isPanning.current = false;
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
        onClick={() => clearSelection()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: "grab",
          backgroundImage: "radial-gradient(circle, var(--border-default) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundColor: "var(--bg-canvas, hsl(0,0%,94%))",
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
              {paths.map((p) => (
                <PathElement key={p.id} path={p} />
              ))}
            </svg>
          </div>
        </div>
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
            <span style={{ color: "var(--accent)" }}>
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
