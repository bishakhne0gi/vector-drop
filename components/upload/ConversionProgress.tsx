"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { JobStatusResponse, ConversionStep } from "@/lib/types";

const STEPS: { key: ConversionStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "normalize", label: "Normalize" },
  { key: "trace", label: "Trace" },
  { key: "assemble", label: "Assemble" },
];

const STEP_ORDER: ConversionStep[] = ["upload", "normalize", "trace", "assemble"];

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

export function ConversionProgress({
  jobId,
  onDone,
  onError,
}: ConversionProgressProps) {
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
    if (data?.status === "failed")
      onError?.(data.error?.message ?? "Conversion failed");
    if (error) onError?.((error as Error).message);
  }, [data, error, onError]);

  const currentStepIndex = data ? STEP_ORDER.indexOf(data.step) : -1;
  const isFailed = data?.status === "failed" || !!error;
  const isDone = data?.status === "done";
  const progress = data?.progress ?? 0;

  return (
    <div className="glass-card flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDone ? (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : isFailed ? (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "rgba(220,38,38,0.1)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "var(--accent-glow)" }}
            >
              <span
                className="h-4 w-4 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]"
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            </div>
          )}

          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {isFailed
              ? "Conversion failed"
              : isDone
                ? "Conversion complete"
                : "Converting your image…"}
          </span>
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-glass)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: isFailed
              ? "var(--destructive)"
              : "linear-gradient(90deg, var(--accent), var(--accent-light))",
            boxShadow: isFailed ? "none" : "0 0 8px var(--accent-glow)",
          }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Conversion progress"
        />
      </div>

      {/* Step indicators */}
      <ol className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isComplete = isDone || currentStepIndex > i;
          const isActive = currentStepIndex === i && !isFailed && !isDone;
          const isFailing = isFailed && currentStepIndex === i;

          return (
            <li key={step.key} className="flex flex-col items-center gap-2">
              {/* Step circle */}
              <div className="relative flex h-9 w-9 items-center justify-center">
                {/* Pulse ring for active step */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-[var(--accent)]"
                    style={{ animation: "pulse-ring 1.2s ease-out infinite" }}
                  />
                )}

                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isComplete
                      ? "border-transparent"
                      : isActive
                        ? "border-[var(--accent)] bg-[var(--accent-glow)]"
                        : isFailing
                          ? "border-[var(--destructive)]/50 bg-[var(--destructive)]/10"
                          : "border-[var(--border-glass)] bg-[var(--bg-glass)]",
                  )}
                  style={
                    isComplete
                      ? { background: "linear-gradient(135deg, var(--accent), var(--accent-light))" }
                      : {}
                  }
                >
                  {isComplete ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isFailing ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : isActive ? (
                    <span
                      className="h-3 w-3 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]"
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {i + 1}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={cn(
                  "text-xs font-medium transition-colors duration-200",
                  isComplete || isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)]",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Error message */}
      {isFailed && (
        <p className="rounded-lg bg-[var(--destructive)]/10 px-4 py-2.5 text-xs text-[var(--destructive)]">
          {data?.error?.message ??
            (error as Error | undefined)?.message ??
            "An error occurred during conversion"}
        </p>
      )}

      {/* Success celebration */}
      {isDone && (
        <p className="text-center text-xs text-[var(--text-secondary)]">
          Your SVG is ready — opening the editor shortly…
        </p>
      )}
    </div>
  );
}
