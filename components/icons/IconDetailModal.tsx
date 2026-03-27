"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, Download } from "lucide-react";
import type { Icon } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLE_LABELS: Record<Icon["style"], string> = {
  outline: "Outline",
  flat: "Flat",
  duotone: "Duotone",
};

const PNG_SIZES = [64, 128, 256, 512] as const;

interface IconDetailModalProps {
  icon: Icon | null;
  onClose: () => void;
}

export function IconDetailModal({ icon, onClose }: IconDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!icon) return;
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [icon, handleKeyDown]);

  if (!icon) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Icon detail: ${icon.prompt}`}
    >
      <div className="relative flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-border bg-background p-8 shadow-xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* SVG Preview */}
        <div
          className="mx-auto flex h-[300px] w-[300px] items-center justify-center rounded-2xl border border-border p-8"
          style={{
            backgroundImage:
              "linear-gradient(45deg, var(--color-border) 25%, transparent 25%), linear-gradient(-45deg, var(--color-border) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-border) 75%), linear-gradient(-45deg, transparent 75%, var(--color-border) 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            backgroundColor: "var(--color-background)",
          }}
        >
          <div
            className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: icon.svg_content }}
          />
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">{icon.prompt}</p>
          {icon.description && (
            <p className="text-sm text-foreground/60">{icon.description}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-foreground/8 px-2.5 py-1 text-xs font-medium text-foreground/60">
              {STYLE_LABELS[icon.style]}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-foreground/50">
              <span
                className="inline-block h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: icon.primary_color }}
              />
              {icon.primary_color}
            </span>
            <span className="text-xs text-foreground/40">
              {icon.path_count} {icon.path_count === 1 ? "path" : "paths"}
            </span>
          </div>
          {icon.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {icon.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Downloads */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-foreground/40">
            Download
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/icons/${icon.id}/download?format=svg`}
              download
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground",
                "transition-colors hover:bg-foreground/5",
              )}
            >
              <Download className="h-3 w-3" />
              SVG
            </a>
            {PNG_SIZES.map((size) => (
              <a
                key={size}
                href={`/api/icons/${icon.id}/download?format=png&size=${size}`}
                download
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground",
                  "transition-colors hover:bg-foreground/5",
                )}
              >
                <Download className="h-3 w-3" />
                PNG {size}px
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
