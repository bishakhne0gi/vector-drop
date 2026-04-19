"use client";

import { useEditorStore, type EditTool } from "@/stores/editorStore";

// Figma-style floating pill: tool toggles on the left, Done on the right.
// Only renders when the store has an editingPathId.

export function EditModeToolbar() {
  const editingPathId = useEditorStore((s) => s.editingPathId);
  const editTool = useEditorStore((s) => s.editTool);
  const setEditTool = useEditorStore((s) => s.setEditTool);
  const exitPathEdit = useEditorStore((s) => s.exitPathEdit);

  if (!editingPathId) return null;

  const tools: { key: EditTool; label: string; icon: React.ReactNode }[] = [
    { key: "move", label: "Move", icon: <MoveIcon /> },
    { key: "bend", label: "Bend", icon: <BendIcon /> },
    { key: "add", label: "Add", icon: <AddIcon /> },
    { key: "cut", label: "Cut", icon: <CutIcon /> },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 64,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 0,
        background: "rgba(22, 21, 22, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        padding: 4,
        zIndex: 30,
        userSelect: "none",
      }}
      role="toolbar"
      aria-label="Vector edit"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {tools.map((t) => {
        const active = editTool === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => setEditTool(t.key)}
            title={t.label}
            aria-label={t.label}
            aria-pressed={active}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 28,
              padding: "0 10px",
              background: active ? "rgba(255, 255, 255, 0.14)" : "transparent",
              border: "none",
              color: active ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
              fontFamily: "auxMono, monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: 0,
              transition: "color 0.12s, background 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}

      <span
        aria-hidden="true"
        style={{
          width: 1,
          height: 20,
          background: "rgba(255, 255, 255, 0.12)",
          margin: "0 6px",
        }}
      />

      <button
        type="button"
        onClick={() => exitPathEdit()}
        title="Done editing (Esc)"
        aria-label="Done editing"
        style={{
          height: 28,
          padding: "0 12px",
          background: "#ffffff",
          color: "#161516",
          border: "none",
          fontFamily: "auxMono, monospace",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 700,
          cursor: "pointer",
          borderRadius: 0,
        }}
      >
        Done
      </button>
    </div>
  );
}

// ─── Icons (14×14 line) ─────────────────────────────────────────────────────

function MoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 3 L3 9 L5 7 L7 9 L9 7 L7 5 L9 3 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 12 C 6 12, 6 4, 14 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="2" cy="12" r="1.5" fill="currentColor" />
      <circle cx="14" cy="4" r="1.5" fill="currentColor" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="2" y1="11" x2="14" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="6.5" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="8" x2="9.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <line x1="6" y1="4" x2="14" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="6" y1="12" x2="14" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
