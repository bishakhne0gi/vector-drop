"use client";

import { useRef } from "react";
import { useEditorStore, type SVGPath } from "@/stores/editorStore";

/* ─── shared input styles ───────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  height: "28px",
  padding: "0 8px",
  borderRadius: "8px",
  background: "var(--bg-subtle, var(--bg-glass))",
  border: "1px solid var(--border-default, var(--border-glass))",
  color: "var(--text-primary)",
  fontSize: "11px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
  paddingTop: "12px",
  paddingBottom: "4px",
};

const dividerStyle: React.CSSProperties = {
  height: "1px",
  background: "var(--border-subtle, var(--border-glass))",
  margin: "8px 0",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "6px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--text-muted)",
  flexShrink: 0,
  minWidth: "48px",
};

function iconBtnCls(active?: boolean): React.CSSProperties {
  return {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: active
      ? "1px solid var(--accent)"
      : "1px solid var(--border-default, var(--border-glass))",
    background: active ? "var(--accent-glow)" : "var(--bg-subtle, var(--bg-glass))",
    color: active ? "var(--accent)" : "var(--text-muted)",
    cursor: "pointer",
    transition: "all 0.15s",
    flexShrink: 0,
    padding: 0,
  };
}

/* ─── colour row ───────────────────────────────────────────── */

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isNone = value === "none" || value === "";
  const safeHex = isNone ? "#000000" : value.startsWith("#") ? value : "#000000";

  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
  }

  function handleHexBlur(e: React.FocusEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
    else if (v === "" || v === "#") onChange("none");
  }

  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      {/* Swatch */}
      <button
        onClick={() => !isNone && colorInputRef.current?.click()}
        aria-label={`${label} color swatch`}
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          border: "1px solid var(--border-default, var(--border-glass))",
          background: isNone ? "transparent" : value,
          cursor: isNone ? "default" : "pointer",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isNone && (
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ position: "absolute", inset: 0, margin: "auto" }} aria-hidden="true">
            <line x1="2" y1="14" x2="14" y2="2" stroke="var(--text-muted)" strokeWidth="1.5" />
          </svg>
        )}
      </button>
      {/* Hidden native colour picker */}
      <input
        ref={colorInputRef}
        type="color"
        value={safeHex}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
        aria-hidden="true"
        tabIndex={-1}
      />
      {/* Hex text input */}
      <input
        type="text"
        value={isNone ? "" : value}
        onChange={handleHexChange}
        onBlur={handleHexBlur}
        placeholder="#rrggbb"
        style={{ ...inputStyle, flex: 1 }}
        aria-label={`${label} hex`}
      />
      {/* None toggle */}
      <button
        onClick={() => onChange(isNone ? "#000000" : "none")}
        style={{
          ...iconBtnCls(isNone),
          width: "auto",
          padding: "0 8px",
          fontSize: "10px",
          fontWeight: 600,
        }}
        aria-label={isNone ? `Set ${label}` : `Clear ${label}`}
        aria-pressed={isNone}
      >
        None
      </button>
    </div>
  );
}

/* ─── linecap icons ─────────────────────────────────────────── */

function LinecapIcon({ type }: { type: "butt" | "round" | "square" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="3"
        strokeLinecap={type} />
    </svg>
  );
}

function LinejoinIcon({ type }: { type: "miter" | "round" | "bevel" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <polyline points="2,13 8,3 14,13" stroke="currentColor" strokeWidth="2"
        strokeLinejoin={type} fill="none" />
    </svg>
  );
}

/* ─── single path ───────────────────────────────────────────── */

function SinglePathProperties({ path }: { path: SVGPath }) {
  const updatePath = useEditorStore((s) => s.updatePath);
  const renamePath = useEditorStore((s) => s.renamePath);
  const svgMeta = useEditorStore((s) => s.svgMeta);

  const hasStroke = path.stroke !== "none" && path.stroke !== "";

  return (
    <div style={{ padding: "8px 12px", overflowY: "auto", flex: 1 }}>
      {/* Section: Layer Info */}
      <p style={sectionLabelStyle}>Layer Info</p>
      <div style={{ marginBottom: "6px" }}>
        <input
          type="text"
          defaultValue={path.name}
          onBlur={(e) => renamePath(path.id, e.target.value.trim() || path.name)}
          key={path.id + "-name"}
          style={inputStyle}
          aria-label="Layer name"
        />
      </div>
      <p style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-muted)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        ID: {path.id}
      </p>

      <div style={dividerStyle} />

      {/* Section: Appearance */}
      <p style={sectionLabelStyle}>Appearance</p>
      <ColorRow
        label="Fill"
        value={path.fill}
        onChange={(v) => updatePath(path.id, { fill: v })}
      />
      <ColorRow
        label="Stroke"
        value={path.stroke}
        onChange={(v) => updatePath(path.id, { stroke: v })}
      />
      {/* Stroke width */}
      <div style={{ marginBottom: "6px" }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Width</span>
          <input
            type="number"
            min={0}
            max={20}
            step={0.5}
            value={path.strokeWidth}
            onChange={(e) => updatePath(path.id, { strokeWidth: parseFloat(e.target.value) || 0 })}
            style={{ ...inputStyle, width: "70px", flex: "none" }}
            aria-label="Stroke width"
          />
        </div>
        <input
          type="range"
          min={0}
          max={20}
          step={0.5}
          value={path.strokeWidth}
          onChange={(e) => updatePath(path.id, { strokeWidth: parseFloat(e.target.value) })}
          style={{ width: "100%", accentColor: "var(--accent)" }}
          aria-label="Stroke width slider"
        />
      </div>

      <div style={dividerStyle} />

      {/* Section: Opacity */}
      <p style={sectionLabelStyle}>Opacity</p>
      <div style={rowStyle}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={path.opacity}
          onChange={(e) => updatePath(path.id, { opacity: parseFloat(e.target.value) })}
          style={{ flex: 1, accentColor: "var(--accent)" }}
          aria-label="Opacity"
        />
        <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "34px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(path.opacity * 100)}%
        </span>
      </div>

      {hasStroke && (
        <>
          <div style={dividerStyle} />
          {/* Section: Stroke Style */}
          <p style={sectionLabelStyle}>Stroke Style</p>
          <div style={{ marginBottom: "8px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Linecap</p>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["butt", "round", "square"] as const).map((lc) => (
                <button
                  key={lc}
                  onClick={() => updatePath(path.id, { strokeLinecap: lc })}
                  style={iconBtnCls(path.strokeLinecap === lc)}
                  aria-label={`Linecap ${lc}`}
                  aria-pressed={path.strokeLinecap === lc}
                  title={lc}
                >
                  <LinecapIcon type={lc} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Linejoin</p>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["miter", "round", "bevel"] as const).map((lj) => (
                <button
                  key={lj}
                  onClick={() => updatePath(path.id, { strokeLinejoin: lj })}
                  style={iconBtnCls(path.strokeLinejoin === lj)}
                  aria-label={`Linejoin ${lj}`}
                  aria-pressed={path.strokeLinejoin === lj}
                  title={lj}
                >
                  <LinejoinIcon type={lj} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={dividerStyle} />

      {/* Section: Transform (informational) */}
      <p style={sectionLabelStyle}>Transform</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>Canvas W</p>
          <input
            type="text"
            value={svgMeta?.width ?? "—"}
            readOnly
            style={{ ...inputStyle, color: "var(--text-muted)", cursor: "default" }}
            aria-label="Canvas width"
          />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>Canvas H</p>
          <input
            type="text"
            value={svgMeta?.height ?? "—"}
            readOnly
            style={{ ...inputStyle, color: "var(--text-muted)", cursor: "default" }}
            aria-label="Canvas height"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── multi-select ──────────────────────────────────────────── */

function MultiPathProperties({ ids }: { ids: string[] }) {
  const updatePath = useEditorStore((s) => s.updatePath);
  const paths = useEditorStore((s) => s.paths);

  const selectedPaths = paths.filter((p) => ids.includes(p.id));
  const avgOpacity =
    selectedPaths.length > 0
      ? selectedPaths.reduce((sum, p) => sum + p.opacity, 0) / selectedPaths.length
      : 1;

  function handleOpacity(v: number) {
    ids.forEach((id) => updatePath(id, { opacity: v }));
  }

  function handleBulkFill(v: string) {
    ids.forEach((id) => updatePath(id, { fill: v }));
  }

  return (
    <div style={{ padding: "8px 12px", overflowY: "auto", flex: 1 }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
        {ids.length} paths selected
      </p>

      <p style={sectionLabelStyle}>Opacity</p>
      <div style={rowStyle}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={avgOpacity}
          onChange={(e) => handleOpacity(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: "var(--accent)" }}
          aria-label="Opacity"
        />
        <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "34px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(avgOpacity * 100)}%
        </span>
      </div>

      <div style={dividerStyle} />

      <p style={sectionLabelStyle}>Bulk Fill</p>
      <ColorRow label="Fill" value="#000000" onChange={handleBulkFill} />
    </div>
  );
}

/* ─── empty state ───────────────────────────────────────────── */

function EmptyState() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: "12px" }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3l18 18M10.5 10.677a2 2 0 0 0 2.823 2.823" />
        <path d="M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.991 5.282 6 9 6 1.55 0 3.043-.523 4.395-1.35M11 5.05A9.493 9.493 0 0 1 12 5c3.718 0 7.113 3.009 9 6a18.51 18.51 0 0 1-1.144 1.702" />
      </svg>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
        Select a path to inspect
      </p>
    </div>
  );
}

/* ─── PropertiesPanel ───────────────────────────────────────── */

export function PropertiesPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const paths = useEditorStore((s) => s.paths);

  const selectedArr = Array.from(selectedIds);

  return (
    <aside
      aria-label="Properties"
      style={{
        width: "260px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid var(--border-glass)",
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
          Properties
        </span>
      </div>

      {selectedArr.length === 0 ? (
        <EmptyState />
      ) : selectedArr.length === 1 ? (
        (() => {
          const path = paths.find((p) => p.id === selectedArr[0]);
          return path ? <SinglePathProperties path={path} /> : <EmptyState />;
        })()
      ) : (
        <MultiPathProperties ids={selectedArr} />
      )}
    </aside>
  );
}
