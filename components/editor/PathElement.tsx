"use client";

import { useEditorStore, type SVGPath } from "@/stores/editorStore";

interface PathElementProps {
  path: SVGPath;
}

export function PathElement({ path }: PathElementProps) {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectPath = useEditorStore((s) => s.selectPath);

  const isSelected = selectedIds.has(path.id);

  function handleClick(e: React.MouseEvent<SVGPathElement>) {
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
        style={{ cursor: "pointer" }}
      />
      {isSelected && (
        <path
          d={path.d}
          fill="none"
          stroke="hsl(221, 83%, 53%)"
          strokeWidth={2}
          opacity={0.5}
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        />
      )}
    </g>
  );
}
