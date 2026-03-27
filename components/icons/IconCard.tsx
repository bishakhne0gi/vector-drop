"use client";

import { useState, useCallback } from "react";
import { Lock, Copy, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Icon } from "@/lib/types";

const STYLE_LABELS: Record<Icon["style"], string> = {
  outline: "Outline",
  flat: "Flat",
  duotone: "Duotone",
};

const STYLE_CLASS: Record<Icon["style"], string> = {
  outline: "bg-foreground/8 text-foreground/60",
  flat: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  duotone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

interface IconCardProps {
  icon: Icon;
  onClick: (icon: Icon) => void;
  /** When true, show visibility toggle and delete actions */
  showAdminActions?: boolean;
  onVisibilityToggle?: (icon: Icon) => void;
  onDelete?: (icon: Icon) => void;
}

export function IconCard({
  icon,
  onClick,
  showAdminActions = false,
  onVisibilityToggle,
  onDelete,
}: IconCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(icon.svg_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
    [icon.svg_content],
  );

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onVisibilityToggle?.(icon);
    },
    [icon, onVisibilityToggle],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(`Delete icon "${icon.prompt}"? This cannot be undone.`)) {
        onDelete?.(icon);
      }
    },
    [icon, onDelete],
  );

  return (
    <article
      onClick={() => onClick(icon)}
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-border bg-background transition-colors duration-150 hover:border-foreground/30 hover:bg-foreground/[0.02]"
      aria-label={`Icon: ${icon.prompt}`}
    >
      {/* Lock badge */}
      {!icon.is_public && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-background/80 p-1 backdrop-blur-sm">
          <Lock className="h-3 w-3 text-foreground/50" aria-label="Private" />
        </span>
      )}

      {/* Hover action overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-background/80 opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5"
          aria-label="Copy SVG"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy SVG
            </>
          )}
        </button>
        <a
          href={`/api/icons/${icon.id}/download?format=svg`}
          onClick={handleDownload}
          download
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5"
          aria-label="Download SVG"
        >
          <Download className="h-3 w-3" />
          Download
        </a>
      </div>

      {/* SVG preview — checkerboard background indicates transparency */}
      <div
        className="aspect-square w-full overflow-hidden rounded-t-2xl p-4"
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
          // svg_content is server-generated SVG; safe for display
          dangerouslySetInnerHTML={{ __html: icon.svg_content }}
        />
      </div>

      {/* Bottom strip */}
      <div className="flex items-center gap-2 rounded-b-2xl border-t border-border px-3 py-2">
        {/* Color dot */}
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: icon.primary_color }}
          aria-label={`Primary color: ${icon.primary_color}`}
        />
        {/* Prompt */}
        <p className="min-w-0 flex-1 truncate text-xs text-foreground/60">
          {icon.prompt}
        </p>
        {/* Theme badge */}
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            STYLE_CLASS[icon.style],
          )}
        >
          {STYLE_LABELS[icon.style]}
        </span>
      </div>

      {/* Admin actions (my icons page) */}
      {showAdminActions && (
        <div className="flex items-center gap-1 rounded-b-2xl border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={handleVisibilityToggle}
            className="flex-1 rounded-lg py-1 text-xs text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label={icon.is_public ? "Make private" : "Make public"}
          >
            {icon.is_public ? "Make private" : "Make public"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg px-2 py-1 text-xs text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete icon"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
