"use client";

import type { IconStyleDNA } from "@/lib/types";

export interface StyleDNACardProps {
  dna: IconStyleDNA;
}

interface MetaRowProps {
  label: string;
  value: string;
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-widest text-foreground/40">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function StyleDNACard({ dna }: StyleDNACardProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-foreground">
          {dna.libraryName}
        </span>
        <span className="text-xs text-foreground/50">
          · {dna.sampleCount} icons analysed
        </span>
      </div>

      {/* Key/value grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetaRow
          label="Grid"
          value={`${dna.gridSize}×${dna.gridSize}px`}
        />
        <MetaRow
          label="Stroke"
          value={`${dna.strokeWidth}px · ${dna.strokeLinecap} caps`}
        />
        <MetaRow
          label="Joins"
          value={dna.strokeLinejoin}
        />
        <MetaRow
          label="Corners"
          value={dna.cornerRadius}
        />
        <MetaRow
          label="Style"
          value={dna.fillStyle}
        />
        <MetaRow
          label="Color"
          value={dna.colorMode}
        />
      </div>

      {/* Personality tags */}
      {dna.personality.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dna.personality.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-foreground/[0.08] px-2 py-0.5 text-xs text-foreground/70"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
