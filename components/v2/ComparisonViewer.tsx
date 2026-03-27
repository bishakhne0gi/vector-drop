"use client";

import { CheckCircle2 } from "lucide-react";
import type { IconStyleDNA } from "@/lib/types";

export interface ComparisonViewerProps {
  originalSvg: string | null; // null = generate mode (no original)
  transferredSvg: string;
  dna: IconStyleDNA;
  onDownload: () => void;
  onSave: () => void;
  isSaving: boolean;
  savedIconId: string | null;
  generatedDescription?: string;
}

interface SvgPreviewProps {
  svg: string;
  label: string;
}

function SvgPreview({ svg, label }: SvgPreviewProps) {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium uppercase tracking-widest text-foreground/40">
        {label}
      </span>
      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-foreground/[0.02] p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

export function ComparisonViewer({
  originalSvg,
  transferredSvg,
  dna,
  onDownload,
  onSave,
  isSaving,
  savedIconId,
  generatedDescription,
}: ComparisonViewerProps) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-background p-6">
      {/* Previews */}
      {originalSvg !== null ? (
        /* Two-column: transfer mode */
        <div className="grid grid-cols-2 gap-6">
          <SvgPreview svg={originalSvg} label="Original" />
          <SvgPreview svg={transferredSvg} label={`Converted · ${dna.libraryName}`} />
        </div>
      ) : (
        /* Single-column: generate mode */
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-xs">
            <SvgPreview svg={transferredSvg} label="Generated icon" />
          </div>
          {generatedDescription && (
            <p className="text-center text-xs text-foreground/50">
              {generatedDescription}
            </p>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onDownload}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
        >
          Download SVG
        </button>

        {savedIconId ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            Saved
          </span>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving && (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/20 border-t-background"
                aria-hidden="true"
              />
            )}
            {isSaving ? "Saving\u2026" : "Save to My Icons"}
          </button>
        )}
      </div>
    </div>
  );
}
