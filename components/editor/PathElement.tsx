"use client";

import { useEditorStore, type SVGPath } from "@/stores/editorStore";

interface PathElementProps {
  path: SVGPath;
}

export function PathElement({ path }: PathElementProps) {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectPath = useEditorStore((s) => s.selectPath);
  const enterPathEdit = useEditorStore((s) => s.enterPathEdit);
  const editingPathId = useEditorStore((s) => s.editingPathId);

  const isSelected = selectedIds.has(path.id);
  const isEditing = editingPathId === path.id;

  if (!path.visible) return null;

  function handleClick(e: React.MouseEvent<SVGPathElement>) {
    if (path.locked) return;
    e.stopPropagation();
    selectPath(path.id, e.metaKey || e.shiftKey);
  }

  function handleDoubleClick(e: React.MouseEvent<SVGPathElement>) {
    if (path.locked) return;
    e.stopPropagation();
    enterPathEdit(path.id);
  }

  return (
    <g>
      <path
        id={path.id}
        d={path.d}
        fill={path.fill}
        fillRule={path.fillRule}
        stroke={path.stroke}
        strokeWidth={path.strokeWidth}
        strokeLinecap={path.strokeLinecap}
        strokeLinejoin={path.strokeLinejoin}
        opacity={isEditing ? path.opacity * 0.5 : path.opacity}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: path.locked ? "default" : "pointer" }}
      />
      {isSelected && !isEditing && (
        <path
          d={path.d}
          fill="none"
          // Canvas is always white; use a dark gray for selection contrast.
          stroke="#1f2937"
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.85}
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        />
      )}
    </g>
  );
}
