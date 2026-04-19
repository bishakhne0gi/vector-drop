"use client";

import { useMemo } from "react";

export type AdjustMode = "none" | "color" | "grayscale" | "bw";

export interface AdjustState {
  mode: AdjustMode;
  colorSteps: number;    // 2–64
  grayIntensity: number; // 0–100
  bwThreshold: number;   // 0–1
}

export const DEFAULT_ADJUST: AdjustState = {
  mode: "none",
  colorSteps: 32,
  grayIntensity: 100,
  bwThreshold: 0.5,
};

const MODE_META: Record<Exclude<AdjustMode, "none">, {
  label: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
  read: (s: AdjustState) => number;
  write: (v: number) => Partial<AdjustState>;
}> = {
  color: {
    label: "Colors",
    min: 2,
    max: 64,
    step: 1,
    decimals: 0,
    read: (s) => s.colorSteps,
    write: (v) => ({ colorSteps: Math.round(v) }),
  },
  grayscale: {
    label: "Intensity",
    min: 0,
    max: 100,
    step: 1,
    decimals: 0,
    read: (s) => s.grayIntensity,
    write: (v) => ({ grayIntensity: Math.round(v) }),
  },
  bw: {
    label: "Threshold",
    min: 0,
    max: 1,
    step: 0.01,
    decimals: 2,
    read: (s) => s.bwThreshold,
    write: (v) => ({ bwThreshold: v }),
  },
};

// ─── Filter defs ─────────────────────────────────────────────────────────────

export function AdjustFilterDefs({
  id,
  state,
}: {
  id: string;
  state: AdjustState;
}) {
  const filter = useMemo(() => {
    if (state.mode === "color") {
      const n = Math.max(2, Math.min(64, Math.round(state.colorSteps)));
      const table = Array.from({ length: n }, (_, i) =>
        (i / (n - 1)).toFixed(4),
      ).join(" ");
      return (
        <filter id={id} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues={table} />
            <feFuncG type="discrete" tableValues={table} />
            <feFuncB type="discrete" tableValues={table} />
          </feComponentTransfer>
        </filter>
      );
    }
    if (state.mode === "grayscale") {
      const sat = Math.max(0, 1 - state.grayIntensity / 100);
      return (
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values={sat.toFixed(4)} />
        </filter>
      );
    }
    if (state.mode === "bw") {
      const t = Math.max(0, Math.min(1, state.bwThreshold));
      const N = 100;
      const cut = Math.max(1, Math.min(N - 1, Math.round(t * N)));
      const table = Array.from({ length: N }, (_, i) => (i < cut ? "0" : "1")).join(" ");
      return (
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues={table} />
            <feFuncG type="discrete" tableValues={table} />
            <feFuncB type="discrete" tableValues={table} />
          </feComponentTransfer>
        </filter>
      );
    }
    return null;
  }, [id, state.mode, state.colorSteps, state.grayIntensity, state.bwThreshold]);

  if (!filter) return null;
  return <defs>{filter}</defs>;
}

// ─── Toolbar UI ──────────────────────────────────────────────────────────────

interface ToolbarProps {
  state: AdjustState;
  onChange: (next: AdjustState) => void;
}

export function AdjustmentToolbar({ state, onChange }: ToolbarProps) {
  const activeMeta = state.mode === "none" ? null : MODE_META[state.mode];
  const value = activeMeta ? activeMeta.read(state) : 0;

  function setMode(mode: AdjustMode) {
    onChange({ ...state, mode: state.mode === mode ? "none" : mode });
  }

  function setValue(v: number) {
    if (!activeMeta) return;
    const clamped = Math.max(activeMeta.min, Math.min(activeMeta.max, v));
    onChange({ ...state, ...activeMeta.write(clamped) });
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 0,
        background: "rgba(22, 21, 22, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        padding: 4,
        zIndex: 20,
        userSelect: "none",
      }}
      role="group"
      aria-label="Image adjustments"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <ModeButton
        active={state.mode === "color"}
        onClick={() => setMode("color")}
        label="Color"
        ariaLabel="Color adjustment"
      >
        <ColorIcon />
      </ModeButton>
      <ModeButton
        active={state.mode === "grayscale"}
        onClick={() => setMode("grayscale")}
        label="Grayscale"
        ariaLabel="Grayscale adjustment"
      >
        <GrayscaleIcon />
      </ModeButton>
      <ModeButton
        active={state.mode === "bw"}
        onClick={() => setMode("bw")}
        label="Black & white"
        ariaLabel="Black and white adjustment"
      >
        <BlackWhiteIcon />
      </ModeButton>

      {activeMeta && (
        <>
          <span
            aria-hidden="true"
            style={{
              width: 1,
              height: 20,
              background: "rgba(255, 255, 255, 0.12)",
              margin: "0 8px",
            }}
          />
          <input
            type="number"
            value={Number(value.toFixed(activeMeta.decimals))}
            min={activeMeta.min}
            max={activeMeta.max}
            step={activeMeta.step}
            onChange={(e) => {
              const n = parseFloat(e.currentTarget.value);
              if (!Number.isNaN(n)) setValue(n);
            }}
            aria-label={activeMeta.label}
            style={{
              width: 52,
              height: 26,
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              color: "#ffffff",
              fontFamily: "auxMono, monospace",
              fontSize: 11,
              textAlign: "center",
              padding: "0 4px",
              borderRadius: 0,
              outline: "none",
            }}
          />
          <input
            type="range"
            min={activeMeta.min}
            max={activeMeta.max}
            step={activeMeta.step}
            value={value}
            onChange={(e) => setValue(parseFloat(e.currentTarget.value))}
            aria-label={`${activeMeta.label} slider`}
            className="adjust-range"
            style={{
              width: 140,
              margin: "0 10px",
              accentColor: "var(--accent, #a7f55a)",
            }}
          />
          <button
            onClick={() => onChange({ ...state, mode: "none" })}
            aria-label="Clear adjustment"
            title="Clear"
            style={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.6)",
              cursor: "pointer",
              borderRadius: 0,
              transition: "color 0.12s, background 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <CloseIcon />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Mode button ─────────────────────────────────────────────────────────────

function ModeButton({
  active,
  onClick,
  label,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={ariaLabel}
      aria-pressed={active}
      style={{
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "rgba(255, 255, 255, 0.14)" : "transparent",
        border: "none",
        color: active ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
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
      {children}
    </button>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function ColorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <defs>
        <linearGradient id="adjust-color-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff3b3b" />
          <stop offset="0.33" stopColor="#ffd23b" />
          <stop offset="0.66" stopColor="#3bd66b" />
          <stop offset="1" stopColor="#3b6bff" />
        </linearGradient>
      </defs>
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="url(#adjust-color-grad)"
        strokeWidth="2"
      />
    </svg>
  );
}

function GrayscaleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <defs>
        <linearGradient id="adjust-gray-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="1" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="8" cy="8" r="6" fill="url(#adjust-gray-grad)" />
    </svg>
  );
}

function BlackWhiteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <defs>
        <clipPath id="adjust-bw-clip">
          <circle cx="8" cy="8" r="6" />
        </clipPath>
      </defs>
      <g clipPath="url(#adjust-bw-clip)">
        <rect x="2" y="2" width="6" height="12" fill="currentColor" opacity="0.25" />
        <rect x="8" y="2" width="6" height="12" fill="currentColor" />
      </g>
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
