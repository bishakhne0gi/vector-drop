"use client";

import { useCallback, useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedMime = (typeof ACCEPTED_TYPES)[number];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

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
    <div className="flex flex-col gap-3">
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
        className={cn(
          "glass-card relative flex cursor-pointer flex-col items-center justify-center gap-5 p-16 transition-all duration-200 outline-none",
          "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
          dragging
            ? "scale-[1.01] border-[var(--accent)]/60"
            : "hover:border-[var(--accent)]/30 hover:bg-[var(--bg-glass-strong)]",
          disabled && "pointer-events-none opacity-50",
        )}
        style={
          dragging
            ? {
                background: "var(--accent-glow)",
                boxShadow: "0 0 0 1px var(--accent), 0 0 32px var(--accent-glow)",
              }
            : {}
        }
      >
        {/* Upload icon */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200"
          style={{
            background: dragging ? "var(--accent)" : "var(--accent-glow)",
            transform: dragging ? "scale(1.1)" : "scale(1)",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={dragging ? "white" : "var(--accent)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={dragging ? "" : "animate-bounce-subtle"}
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-base font-semibold text-[var(--text-primary)]">
            {dragging ? "Drop it here" : "Drop your image here or click to browse"}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            JPEG, PNG, WebP — up to 10 MB
          </p>
        </div>

        {/* Radial glow on drag */}
        {dragging && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)",
            }}
          />
        )}

        <input
          id="dropzone-input"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          disabled={disabled}
          onChange={onInputChange}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
