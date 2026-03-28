"use client";

import { useEditorStore, type SVGPath } from "@/stores/editorStore";

interface PathElementProps {
  path: SVGPath;
}

export function PathElement({ path }: PathElementProps) {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectPath = useEditorStore((s) => s.selectPath);

  const isSelected = selectedIds.has(path.id);

  if (!path.visible) return null;

  function handleClick(e: React.MouseEvent<SVGPathElement>) {
    if (path.locked) return;
    e.stopPropagation();
    selectPath(path.id, e.metaKey || e.shiftKey);
  }

  return (
    <g>
      <path
        id={path.id}
        d={path.d}
        fill={path.fill}
        stroke={path.stroke}
        strokeWidth={path.strokeWidth}
        strokeLinecap={path.strokeLinecap}
        strokeLinejoin={path.strokeLinejoin}
        opacity={path.opacity}
        onClick={handleClick}
        style={{ cursor: path.locked ? "default" : "pointer" }}
      />
      {isSelected && (
        <path
          d={path.d}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.8}
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        />
      )}
    </g>
  );
}
