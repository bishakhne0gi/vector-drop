"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore, type SVGPath, type SVGMeta } from "@/stores/editorStore";
import { PathElement } from "./PathElement";

interface EditorCanvasProps {
  svgUrl: string;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

function parseSvg(text: string): { paths: SVGPath[]; meta: SVGMeta } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  const viewBox = svgEl?.getAttribute("viewBox") ?? "0 0 800 600";
  const widthAttr = svgEl?.getAttribute("width");
  const heightAttr = svgEl?.getAttribute("height");

  // Parse width/height — strip units like "px", "pt" etc.
  const parseUnit = (val: string | null | undefined, fallback: number): number => {
    if (!val) return fallback;
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  // Fall back to viewBox dimensions
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

  // Pan/zoom transform
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const paths = useEditorStore((s) => s.paths);
  const setPaths = useEditorStore((s) => s.setPaths);
  const setSvgMeta = useEditorStore((s) => s.setSvgMeta);
  const storeMeta = useEditorStore((s) => s.svgMeta);
  const clearSelection = useEditorStore((s) => s.clearSelection);

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

  // Scroll-wheel zoom
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((t) => ({
      ...t,
      scale: Math.min(Math.max(t.scale * factor, 0.05), 40),
    }));
  }

  // Pan: mousedown on background
  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    e.currentTarget.style.cursor = "grabbing";
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform((t) => ({ ...t, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
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

  // Use store meta if updated by GenerateIconPanel; fall back to local meta from fetch
  const activeMeta = storeMeta ?? meta;

  // Auto-fit: display small icons (e.g. 24×24) at a sensible minimum size
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

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[hsl(0,0%,93%)] dark:bg-[hsl(0,0%,10%)]"
      onClick={() => clearSelection()}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: "grab" }}
      aria-label="SVG editor canvas"
      role="application"
    >
      {/* Checkerboard pattern for transparency indication */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-conic-gradient(hsl(0,0%,88%) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px",
        }}
        aria-hidden="true"
      />

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
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
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
              boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
              background: "#fff",
            }}
          >
            {paths.map((p) => (
              <PathElement key={p.id} path={p} />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

