"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { JobStatusResponse, ConversionStep } from "@/lib/types";

const FONT_MONO = "auxMono, monospace";

/** What each pipeline step is actually doing, in plain language. */
const STEP_LABEL: Record<ConversionStep, string> = {
  upload: "Transferring your image",
  normalize: "Preparing colours",
  trace: "Drawing vector paths",
  assemble: "Building your SVG",
};

async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`/api/jobs/${jobId}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch job status");
  }
  return res.json() as Promise<JobStatusResponse>;
}

interface ConversionProgressProps {
  jobId: string;
  onDone?: (job: JobStatusResponse) => void;
  onError?: (message: string) => void;
}

/**
 * Conversion progress, rendered as a slim strip beneath the drop zone.
 *
 * The previous version was a 280px glass card that replaced the upload area
 * entirely, using .glass-card (var(--bg-glass), which resolves LIGHT) plus teal
 * step pills — a white panel with green accents inside a black app. It also hid
 * the thing the user had just interacted with.
 *
 * This keeps the drop zone in place and matches DropZone's own conventions:
 * explicit dark values rather than theme variables that can resolve light,
 * square corners, mono uppercase labels, and a neutral bar.
 */
export function ConversionProgress({ jobId, onDone, onError }: ConversionProgressProps) {
  const { data, error } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJobStatus(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "done" || status === "failed" ? false : 2000;
    },
    retry: 3,
  });

  useEffect(() => {
    if (data?.status === "done") onDone?.(data);
  }, [data, onDone]);

  useEffect(() => {
    if (data?.status === "failed") onError?.(data.error?.message ?? "Conversion failed");
    if (error) onError?.((error as Error).message);
  }, [data, error, onError]);

  const isFailed = data?.status === "failed" || !!error;
  const isDone = data?.status === "done";
  const progress = data?.progress ?? 5;
  const label = isFailed
    ? (data?.error?.message ?? "Conversion failed")
    : isDone
      ? "Done"
      : STEP_LABEL[data?.step ?? "upload"];

  const barColor = isFailed ? "#f87171" : isDone ? "rgba(120,255,180,0.85)" : "#ffffff";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginTop: 12,
        padding: "12px 16px",
        background: "#131313",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: isFailed ? "#f87171" : "rgba(255,255,255,0.55)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.40)",
            flexShrink: 0,
          }}
        >
          {isFailed ? "—" : `${progress}%`}
        </span>
      </div>

      <div style={{ height: 2, width: "100%", background: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            height: "100%",
            width: `${isFailed ? 100 : progress}%`,
            background: barColor,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
