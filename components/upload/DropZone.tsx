"use client";

import { useCallback, useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
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
    <div className="flex flex-col gap-2">
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
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-16 transition-colors duration-150 outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          dragging
            ? "border-foreground bg-foreground/5"
            : "border-border hover:border-foreground/40 hover:bg-foreground/[0.02]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/8">
          <Upload className="h-5 w-5 text-foreground/60" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop an image here
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            or{" "}
            <label
              htmlFor="dropzone-input"
              className="cursor-pointer text-foreground underline-offset-2 hover:underline"
            >
              browse your files
            </label>
          </p>
          <p className="mt-2 text-xs text-foreground/40">
            JPEG, PNG, WebP — up to 10 MB
          </p>
        </div>
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
          className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
