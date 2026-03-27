"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { parseSvg } from "@/lib/parseSvg";
import type { GenerateIconRequest, GenerateIconResponse, IconStyle } from "@/lib/types";

interface GenerateIconPanelProps {
  projectId: string;
  onClose: () => void;
}

const STYLES: { id: IconStyle; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "flat", label: "Flat" },
  { id: "duotone", label: "Duotone" },
];

export function GenerateIconPanel({ projectId, onClose }: GenerateIconPanelProps) {
  const setPaths = useEditorStore((s) => s.setPaths);
  const setSvgMeta = useEditorStore((s) => s.setSvgMeta);

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<IconStyle>("outline");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [useCurrentImage, setUseCurrentImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSvg, setLastSvg] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim() && !useCurrentImage) {
      setError("Enter a description or check 'Use current image'.");
      return;
    }

    setLoading(true);
    setError(null);

    const body: GenerateIconRequest = {
      prompt: prompt.trim(),
      style,
      primaryColor,
      ...(useCurrentImage ? { projectId } : {}),
    };

    try {
      const res = await fetch("/api/ai/generate-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(
          data.error?.message ?? `Request failed (${res.status})`,
        );
      }

      const data = (await res.json()) as GenerateIconResponse;
      const svgContent = data.svgContent;

      setLastSvg(svgContent);

      const { paths, meta } = parseSvg(svgContent);
      setPaths(paths);
      setSvgMeta(meta);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="border-b border-border bg-background px-4 py-3"
      role="region"
      aria-label="Generate icon panel"
    >
      <div className="flex flex-wrap items-start gap-3">
        {/* Prompt */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label
            htmlFor="generate-prompt"
            className="text-xs font-medium text-foreground/70"
          >
            Description
          </label>
          <input
            id="generate-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="minimalist rocket icon, coffee cup line art…"
            className="h-8 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter") void generate();
            }}
          />
        </div>

        {/* Color picker */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="generate-color"
            className="text-xs font-medium text-foreground/70"
          >
            Color
          </label>
          <input
            id="generate-color"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            disabled={loading}
            className="h-8 w-10 cursor-pointer rounded-md border border-border bg-background p-0.5 disabled:pointer-events-none disabled:opacity-50"
          />
        </div>

        {/* Use current image */}
        <div className="flex flex-col justify-end gap-1 pb-0.5">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground/70">
            <input
              type="checkbox"
              checked={useCurrentImage}
              onChange={(e) => setUseCurrentImage(e.target.checked)}
              disabled={loading}
              className="h-3.5 w-3.5 accent-foreground"
            />
            Use current image
          </label>
        </div>

        {/* Generate button */}
        <div className="flex flex-col justify-end gap-1">
          <button
            onClick={() => void generate()}
            disabled={loading}
            className="flex h-8 items-center gap-2 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {loading ? (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background"
                aria-hidden="true"
              />
            ) : null}
            {lastSvg && !loading ? "Regenerate" : "Generate"}
          </button>
        </div>

        {/* Close */}
        <div className="flex flex-col justify-end gap-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 transition-colors hover:bg-foreground/8 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close generate panel"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Style selector */}
      <div className="mt-3 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-foreground/70">Style</span>
        <div
          className="flex gap-2"
          role="group"
          aria-label="Icon style"
        >
          {STYLES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStyle(id)}
              disabled={loading}
              aria-pressed={style === id}
              className={[
                "flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                style === id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground/60 hover:border-foreground/40 hover:text-foreground/80",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1 1l12 12M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
