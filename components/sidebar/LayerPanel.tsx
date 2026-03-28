"use client";

import { useCallback, useRef, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";

/* ─── tiny icon components ─────────────────────────────────── */

function EyeIcon({ hidden }: { hidden?: boolean }) {
  return hidden ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LockIcon({ locked }: { locked?: boolean }) {
  return locked ? (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ) : (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function DragHandle() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="2.5" r="1" />
      <circle cx="7" cy="2.5" r="1" />
      <circle cx="3" cy="5" r="1" />
      <circle cx="7" cy="5" r="1" />
      <circle cx="3" cy="7.5" r="1" />
      <circle cx="7" cy="7.5" r="1" />
    </svg>
  );
}

/* ─── LayerPanel ────────────────────────────────────────────── */

export function LayerPanel() {
  const paths = useEditorStore((s) => s.paths);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectPath = useEditorStore((s) => s.selectPath);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const toggleVisibility = useEditorStore((s) => s.toggleVisibility);
  const toggleLock = useEditorStore((s) => s.toggleLock);
  const duplicatePath = useEditorStore((s) => s.duplicatePath);
  const deletePaths = useEditorStore((s) => s.deletePaths);
  const reorderPath = useEditorStore((s) => s.reorderPath);
  const renamePath = useEditorStore((s) => s.renamePath);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Drag-to-reorder state
  const dragId = useRef<string | null>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Reversed for visual order (top path = last in array)
  const visiblePaths = [...paths].reverse();

  function handleSelectRow(e: React.MouseEvent, id: string) {
    selectPath(id, e.metaKey || e.shiftKey || e.ctrlKey);
  }

  function startRename(id: string, currentName: string) {
    setRenamingId(id);
    setRenameValue(currentName);
  }

  function commitRename(id: string) {
    if (renameValue.trim()) renamePath(id, renameValue.trim());
    setRenamingId(null);
  }

  function handleDragMouseDown(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    dragId.current = id;
    dragStartY.current = e.clientY;
    dragCurrentY.current = e.clientY;

    function onMove(ev: MouseEvent) {
      if (!dragId.current) return;
      const dy = ev.clientY - dragCurrentY.current;
      dragCurrentY.current = ev.clientY;
      // Each row is roughly 30px; determine direction
      const totalDy = ev.clientY - dragStartY.current;
      const steps = Math.round(totalDy / 30);
      // Find the target index
      const sourceIdx = visiblePaths.findIndex((p) => p.id === dragId.current);
      const targetIdx = Math.max(0, Math.min(visiblePaths.length - 1, sourceIdx + steps));
      setDragOverId(visiblePaths[targetIdx]?.id ?? null);
      // Suppress unused variable warning
      void dy;
    }

    function onUp(ev: MouseEvent) {
      if (dragId.current) {
        const totalDy = ev.clientY - dragStartY.current;
        const steps = Math.round(totalDy / 30);
        // reorderPath: up = higher index = lower in reversed display
        // visually "down" in the layer list = "down" in array (lower index)
        if (steps !== 0) {
          const absSteps = Math.abs(steps);
          const direction = steps > 0 ? "down" : "up";
          for (let i = 0; i < absSteps; i++) {
            reorderPath(dragId.current!, direction);
          }
        }
      }
      dragId.current = null;
      setDragOverId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const selectAll = useCallback(() => {
    clearSelection();
    paths
      .filter((p) => !p.locked && p.visible)
      .forEach((p) => selectPath(p.id, true));
  }, [paths, clearSelection, selectPath]);

  const rowStyle: React.CSSProperties = {
    height: "30px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 8px 0 4px",
    cursor: "pointer",
    transition: "background 0.15s",
    position: "relative",
    fontSize: "11px",
    userSelect: "none",
  };

  const iconBtnStyle: React.CSSProperties = {
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    flexShrink: 0,
    border: "none",
    background: "transparent",
    color: "var(--text-muted)",
    padding: 0,
  };

  return (
    <aside
      aria-label="Layers"
      style={{
        width: "220px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid var(--border-glass)",
        background: "var(--bg-card, var(--bg-glass-strong))",
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: "1px solid var(--border-glass)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
          }}
        >
          Layers
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-muted)",
            background: "var(--bg-glass)",
            border: "1px solid var(--border-default, var(--border-glass))",
            borderRadius: "20px",
            padding: "1px 7px",
            minWidth: "20px",
            textAlign: "center",
          }}
        >
          {paths.length}
        </span>
      </div>

      {/* Layer list */}
      {paths.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>No paths</p>
        </div>
      ) : (
        <ul
          style={{ flex: 1, overflowY: "auto", padding: "4px 0", listStyle: "none", margin: 0 }}
          role="listbox"
          aria-multiselectable="true"
        >
          {visiblePaths.map((path) => {
            const isSelected = selectedIds.has(path.id);
            const isDragTarget = dragOverId === path.id && dragId.current !== path.id;

            return (
              <li
                key={path.id}
                role="option"
                aria-selected={isSelected}
                onClick={(e) => handleSelectRow(e, path.id)}
                className="group"
                style={{
                  ...rowStyle,
                  background: isSelected
                    ? "var(--accent-glow)"
                    : isDragTarget
                    ? "var(--bg-glass)"
                    : "transparent",
                  borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                  color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                  outline: isDragTarget ? "1px dashed var(--border-default, var(--border-glass))" : "none",
                }}
              >
                {/* Drag handle */}
                <span
                  onMouseDown={(e) => handleDragMouseDown(e, path.id)}
                  style={{
                    ...iconBtnStyle,
                    opacity: 0,
                    color: "var(--text-muted)",
                    cursor: "grab",
                  }}
                  className="group-hover:!opacity-100"
                  aria-hidden="true"
                >
                  <DragHandle />
                </span>

                {/* Eye toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(path.id); }}
                  style={{
                    ...iconBtnStyle,
                    opacity: path.visible ? 1 : 0.35,
                    color: isSelected ? "var(--accent)" : "var(--text-muted)",
                  }}
                  aria-label={path.visible ? "Hide layer" : "Show layer"}
                  title={path.visible ? "Hide" : "Show"}
                >
                  <EyeIcon hidden={!path.visible} />
                </button>

                {/* Color swatch */}
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "4px",
                    flexShrink: 0,
                    border: "1px solid var(--border-default, var(--border-glass))",
                    background:
                      path.fill === "none" || path.fill === ""
                        ? "transparent"
                        : path.fill,
                  }}
                  aria-hidden="true"
                />

                {/* Name — double-click to rename */}
                {renamingId === path.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(path.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(path.id);
                      if (e.key === "Escape") setRenamingId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: "22px",
                      fontSize: "11px",
                      borderRadius: "6px",
                      border: "1px solid var(--accent)",
                      background: "var(--bg-subtle, var(--bg-glass))",
                      color: "var(--text-primary)",
                      padding: "0 6px",
                      outline: "none",
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => { e.stopPropagation(); startRename(path.id, path.name); }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                    title={path.name}
                  >
                    {path.name}
                  </span>
                )}

                {/* Lock icon inline (always visible when locked) */}
                {path.locked && (
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    <LockIcon locked />
                  </span>
                )}

                {/* Hover actions */}
                <span
                  className="group-hover:!flex"
                  style={{ display: "none", alignItems: "center", gap: "2px", flexShrink: 0 }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLock(path.id); }}
                    style={{ ...iconBtnStyle }}
                    aria-label={path.locked ? "Unlock layer" : "Lock layer"}
                    title={path.locked ? "Unlock" : "Lock"}
                  >
                    <LockIcon locked={path.locked} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicatePath(path.id); }}
                    style={{ ...iconBtnStyle }}
                    aria-label="Duplicate layer"
                    title="Duplicate"
                  >
                    <DuplicateIcon />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePaths([path.id]); }}
                    style={{ ...iconBtnStyle, color: "var(--destructive, #ef4444)" }}
                    aria-label="Delete layer"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer buttons */}
      <div
        style={{
          borderTop: "1px solid var(--border-glass)",
          padding: "8px",
          display: "flex",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        {/* Add Layer — disabled / soon */}
        <button
          disabled
          style={{
            flex: 1,
            height: "28px",
            borderRadius: "8px",
            border: "1px solid var(--border-default, var(--border-glass))",
            background: "var(--bg-subtle, var(--bg-glass))",
            color: "var(--text-muted)",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            cursor: "not-allowed",
            opacity: 0.6,
          }}
          aria-label="Add layer (coming soon)"
        >
          Add Layer
          <span
            style={{
              fontSize: "9px",
              background: "var(--accent-glow)",
              color: "var(--accent)",
              borderRadius: "20px",
              padding: "1px 5px",
              fontWeight: 600,
            }}
          >
            Soon
          </span>
        </button>

        {/* Select All */}
        <button
          onClick={selectAll}
          style={{
            flex: 1,
            height: "28px",
            borderRadius: "8px",
            border: "1px solid var(--border-default, var(--border-glass))",
            background: "var(--bg-subtle, var(--bg-glass))",
            color: "var(--text-secondary)",
            fontSize: "11px",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
          aria-label="Select all unlocked visible paths"
        >
          Select All
        </button>
      </div>
    </aside>
  );
}
