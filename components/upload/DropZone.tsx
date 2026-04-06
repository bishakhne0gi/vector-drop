"use client";

import { useCallback, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedMime = (typeof ACCEPTED_TYPES)[number];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const FONT_MONO = "auxMono, monospace";
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

function validate(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as AcceptedMime)) {
    return "Only JPEG, PNG, and WebP images are supported.";
  }
  if (file.size > MAX_BYTES) {
    return "File must be 10 MB or smaller.";
  }
  return null;
}

/* ─── Ghost Editor Illustration ─────────────────────────────────────────── */

function GhostEditorIllustration({ active }: { active: boolean }) {
  const dim = active ? 0.42 : 0.13;

  return (
    <svg
      width="100%"
      viewBox="0 0 520 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", opacity: active ? 1 : 0.9, transition: "opacity 0.3s" }}
    >
      {/* ── Toolbar strip ───────────────────────────────────────────────── */}
      <rect x="0" y="0" width="520" height="28" fill={`rgba(255,255,255,${dim * 0.25})`} />
      {/* Back arrow */}
      <rect x="8" y="8" width="12" height="12" rx="0" fill={`rgba(255,255,255,${dim * 0.6})`} />
      {/* Project name */}
      <rect x="28" y="10" width="72" height="7" rx="0" fill={`rgba(255,255,255,${dim * 0.5})`} />
      {/* Center controls: undo/redo */}
      <rect x="208" y="8" width="16" height="12" rx="0" fill={`rgba(255,255,255,${dim * 0.4})`} />
      <rect x="228" y="8" width="16" height="12" rx="0" fill={`rgba(255,255,255,${dim * 0.4})`} />
      {/* Separator */}
      <rect x="252" y="10" width="1" height="8" fill={`rgba(255,255,255,${dim * 0.25})`} />
      {/* Zoom */}
      <rect x="258" y="10" width="28" height="8" rx="0" fill={`rgba(255,255,255,${dim * 0.3})`} />
      {/* Export button — white pill */}
      <rect x="430" y="7" width="52" height="14" rx="0" fill={`rgba(255,255,255,${dim * 0.85})`} />
      {/* Save button */}
      <rect x="488" y="7" width="24" height="14" rx="0" fill={`rgba(255,255,255,${dim * 0.3})`} />

      {/* ── Left panel (Layers) ──────────────────────────────────────────── */}
      <rect x="0" y="28" width="130" height="172" fill={`rgba(255,255,255,${dim * 0.08})`} />
      {/* Panel border right */}
      <line x1="130" y1="28" x2="130" y2="200" stroke={`rgba(255,255,255,${dim * 0.4})`} strokeWidth="0.5" />
      {/* Panel header */}
      <rect x="8" y="36" width="36" height="6" rx="0" fill={`rgba(255,255,255,${dim * 0.35})`} />
      <rect x="112" y="34" width="12" height="10" rx="0" fill={`rgba(255,255,255,${dim * 0.25})`} />
      <line x1="0" y1="50" x2="130" y2="50" stroke={`rgba(255,255,255,${dim * 0.25})`} strokeWidth="0.5" />

      {/* Layer rows */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const y = 54 + i * 20;
        const isActive = i === 2;
        return (
          <g key={i}>
            {isActive && (
              <rect x="0" y={y - 2} width="130" height="20" fill={`rgba(255,255,255,${dim * 0.18})`} />
            )}
            {/* Eye icon */}
            <rect x="6" y={y + 4} width="10" height="8" rx="0" fill={`rgba(255,255,255,${dim * (isActive ? 0.6 : 0.3)})`} />
            {/* Color swatch */}
            <rect x="20" y={y + 4} width="8" height="8" rx="0" fill={isActive ? `rgba(20,184,166,${dim})` : `rgba(255,255,255,${dim * 0.25})`} />
            {/* Name bar */}
            <rect x="32" y={y + 6} width={40 + (i % 3) * 12} height="5" rx="0" fill={`rgba(255,255,255,${dim * (isActive ? 0.7 : 0.28)})`} />
          </g>
        );
      })}

      {/* Panel footer */}
      <line x1="0" y1="178" x2="130" y2="178" stroke={`rgba(255,255,255,${dim * 0.25})`} strokeWidth="0.5" />
      <rect x="6" y="183" width="56" height="11" rx="0" fill={`rgba(255,255,255,${dim * 0.15})`} />
      <rect x="68" y="183" width="56" height="11" rx="0" fill={`rgba(255,255,255,${dim * 0.18})`} />

      {/* ── Canvas area ──────────────────────────────────────────────────── */}
      {/* Dot grid */}
      {Array.from({ length: 11 }, (_, xi) =>
        Array.from({ length: 7 }, (_, yi) => (
          <circle
            key={`${xi}-${yi}`}
            cx={148 + xi * 22}
            cy={42 + yi * 24}
            r="0.8"
            fill={`rgba(255,255,255,${dim * 0.35})`}
          />
        ))
      )}

      {/* SVG canvas frame */}
      <rect
        x="178"
        y="48"
        width="144"
        height="120"
        fill="rgba(255,255,255,0.04)"
        stroke={`rgba(255,255,255,${dim * 0.5})`}
        strokeWidth="0.75"
      />

      {/* Vector path being drawn — a flower/bezier shape */}
      <path
        d="M238 90 C238 72 258 68 258 88 C258 68 278 72 278 90 C278 108 258 112 258 108 C258 112 238 108 238 90 Z"
        stroke={`rgba(20,184,166,${dim * 1.2})`}
        strokeWidth="1.5"
        fill={`rgba(20,184,166,${dim * 0.12})`}
      />
      {/* Anchor dots on path */}
      <circle cx="238" cy="90" r="3" fill={`rgba(255,255,255,${dim})`} />
      <circle cx="258" cy="68" r="3" fill={`rgba(20,184,166,${dim * 1.5})`} />
      <circle cx="278" cy="90" r="3" fill={`rgba(255,255,255,${dim})`} />
      <circle cx="258" cy="112" r="3" fill={`rgba(255,255,255,${dim})`} />
      {/* Control handles */}
      <line x1="238" y1="90" x2="248" y2="74" stroke={`rgba(255,255,255,${dim * 0.5})`} strokeWidth="0.75" strokeDasharray="2 2" />
      <line x1="258" y1="68" x2="268" y2="74" stroke={`rgba(255,255,255,${dim * 0.5})`} strokeWidth="0.75" strokeDasharray="2 2" />
      <circle cx="248" cy="74" r="1.5" fill={`rgba(255,255,255,${dim * 0.6})`} />
      <circle cx="268" cy="74" r="1.5" fill={`rgba(255,255,255,${dim * 0.6})`} />

      {/* ── Right panel (Properties) ─────────────────────────────────────── */}
      <rect x="390" y="28" width="130" height="172" fill={`rgba(255,255,255,${dim * 0.08})`} />
      <line x1="390" y1="28" x2="390" y2="200" stroke={`rgba(255,255,255,${dim * 0.4})`} strokeWidth="0.5" />
      {/* Panel header */}
      <rect x="398" y="36" width="52" height="6" rx="0" fill={`rgba(255,255,255,${dim * 0.35})`} />
      <line x1="390" y1="50" x2="520" y2="50" stroke={`rgba(255,255,255,${dim * 0.25})`} strokeWidth="0.5" />

      {/* Layer Info section */}
      <rect x="398" y="58" width="30" height="5" rx="0" fill={`rgba(255,255,255,${dim * 0.25})`} />
      <rect x="398" y="68" width="114" height="16" rx="0" fill={`rgba(255,255,255,${dim * 0.12})`} stroke={`rgba(255,255,255,${dim * 0.3})`} strokeWidth="0.5" />

      {/* Appearance section */}
      <rect x="398" y="96" width="50" height="5" rx="0" fill={`rgba(255,255,255,${dim * 0.25})`} />
      {/* Fill row */}
      <rect x="398" y="108" width="22" height="6" rx="0" fill={`rgba(255,255,255,${dim * 0.2})`} />
      <rect x="430" y="106" width="16" height="10" rx="0" fill={`rgba(20,184,166,${dim * 0.8})`} />
      <rect x="450" y="106" width="48" height="10" rx="0" fill={`rgba(255,255,255,${dim * 0.12})`} stroke={`rgba(255,255,255,${dim * 0.25})`} strokeWidth="0.5" />
      {/* Stroke row */}
      <rect x="398" y="122" width="30" height="6" rx="0" fill={`rgba(255,255,255,${dim * 0.2})`} />
      <rect x="430" y="120" width="16" height="10" rx="0" fill={`rgba(255,255,255,${dim * 0.06})`} stroke={`rgba(255,255,255,${dim * 0.3})`} strokeWidth="0.5" />
      <rect x="450" y="120" width="48" height="10" rx="0" fill={`rgba(255,255,255,${dim * 0.12})`} stroke={`rgba(255,255,255,${dim * 0.25})`} strokeWidth="0.5" />

      {/* Opacity slider */}
      <rect x="398" y="148" width="40" height="5" rx="0" fill={`rgba(255,255,255,${dim * 0.25})`} />
      <rect x="398" y="160" width="100" height="4" rx="0" fill={`rgba(255,255,255,${dim * 0.15})`} />
      <rect x="398" y="158" width="68" height="8" rx="0" fill={`rgba(20,184,166,${dim * 0.7})`} />
      <circle cx="466" cy="162" r="4" fill={`rgba(255,255,255,${dim})`} />

      {/* ── Bottom status bar ────────────────────────────────────────────── */}
      <rect x="130" y="192" width="260" height="8" fill={`rgba(255,255,255,${dim * 0.08})`} />
      <rect x="136" y="194" width="40" height="4" rx="0" fill={`rgba(255,255,255,${dim * 0.3})`} />
      <rect x="230" y="194" width="48" height="4" rx="0" fill={`rgba(255,255,255,${dim * 0.3})`} />
      <rect x="342" y="194" width="24" height="4" rx="0" fill={`rgba(255,255,255,${dim * 0.3})`} />
    </svg>
  );
}

/* ─── DropZone ───────────────────────────────────────────────────────────── */

export function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handle(file);
    },
    [handle],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handle(file);
      e.target.value = "";
    },
    [handle],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload image — drag and drop or click to browse"
        aria-disabled={disabled}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={disabled ? undefined : onDrop}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            document.getElementById("dropzone-input")?.click();
          }
        }}
        onClick={() => {
          if (!disabled) document.getElementById("dropzone-input")?.click();
        }}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: disabled ? "default" : "pointer",
          background: dragging ? "rgba(255,255,255,0.04)" : "#131313",
          border: `1px solid ${dragging ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 0,
          overflow: "hidden",
          outline: "none",
          transition: "border-color 0.2s, background 0.2s",
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.30)";
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = dragging ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)";
        }}
        onMouseEnter={(e) => {
          if (!dragging) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)";
        }}
        onMouseLeave={(e) => {
          if (!dragging) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        }}
      >
        {/* Ghost editor illustration */}
        <div style={{
          width: "100%",
          maxHeight: 120,
          overflow: "hidden",
          padding: "16px 28px 0",
          opacity: dragging ? 0.6 : 1,
          transition: "opacity 0.25s",
        }}>
          <GhostEditorIllustration active={dragging} />
        </div>

        {/* Fade overlay — bottom of illustration */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 60,
            height: 70,
            background: `linear-gradient(to bottom, transparent 0%, ${dragging ? "rgba(255,255,255,0.04)" : "#131313"} 100%)`,
            pointerEvents: "none",
            transition: "background 0.2s",
          }}
        />

        {/* Text + action */}
        <div style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "12px 32px 20px",
          textAlign: "center",
          fontFamily: FONT_BODY,
        }}>
          <p style={{
            fontSize: 15,
            fontWeight: 500,
            color: dragging ? "#ffffff" : "rgba(255,255,255,0.80)",
            margin: 0,
            letterSpacing: "-0.015em",
            transition: "color 0.2s",
          }}>
            {dragging ? "Release to upload" : "Drop your image here or click to browse"}
          </p>

          <p style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.28)",
            margin: 0,
            fontFamily: FONT_MONO,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            JPEG · PNG · WebP — up to 10 MB
          </p>

          {/* Browse button */}
          {!dragging && (
            <div style={{
              marginTop: 8,
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 24px",
              background: "#ffffff",
              color: "#0a0a0a",
              fontSize: 11,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              borderRadius: 0,
              userSelect: "none",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 4px 24px rgba(255,255,255,0.10)",
              transition: "box-shadow 0.15s",
            }}>
              Browse files
            </div>
          )}

          {dragging && (
            <div style={{
              marginTop: 4,
              height: 32,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 20px",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.20)",
              color: "rgba(255,255,255,0.80)",
              fontSize: 10,
              fontFamily: FONT_MONO,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              borderRadius: 0,
            }}>
              ↓ Drop now
            </div>
          )}
        </div>

        <input
          id="dropzone-input"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
          disabled={disabled}
          onChange={onInputChange}
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.20)",
            color: "#f87171",
            fontSize: 12,
            fontFamily: FONT_BODY,
            borderRadius: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
