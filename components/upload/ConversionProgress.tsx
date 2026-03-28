"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { JobStatusResponse, ConversionStep } from "@/lib/types";

const STEPS: { key: ConversionStep; label: string; desc: string }[] = [
  { key: "upload",    label: "Upload",    desc: "Transferring your image" },
  { key: "normalize", label: "Normalize", desc: "Resizing & colour prep" },
  { key: "trace",     label: "Trace",     desc: "Drawing vector paths" },
  { key: "assemble",  label: "Assemble",  desc: "Building your SVG" },
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

  const currentStepIndex = data ? STEP_ORDER.indexOf(data.step) : 0;
  const isFailed = data?.status === "failed" || !!error;
  const isDone = data?.status === "done";
  const progress = data?.progress ?? 5;

  return (
    <div
      className="glass-card relative flex flex-col items-center justify-center gap-8 overflow-hidden p-12"
      style={{ minHeight: "280px" }}
    >
      {/* Animated teal glow behind */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isFailed
            ? "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(220,38,38,0.06) 0%, transparent 70%)"
            : "radial-gradient(ellipse 60% 50% at 50% 60%, var(--accent-glow) 0%, transparent 70%)",
          animation: isDone || isFailed ? "none" : "pulse-glow 3s ease-in-out infinite",
        }}
      />

      {/* Central status icon */}
      <div className="relative flex flex-col items-center gap-3">
        {isDone ? (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(16,185,129,0.15)", animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ) : isFailed ? (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(220,38,38,0.1)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        ) : (
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--accent-glow)" }}
          >
            {/* Orbiting dot */}
            <span
              aria-hidden="true"
              className="absolute h-2 w-2 rounded-full"
              style={{
                background: "var(--accent)",
                top: "-4px",
                left: "50%",
                marginLeft: "-4px",
                animation: "orbit 1.4s linear infinite",
                transformOrigin: "4px calc(32px)",
              }}
            />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
        )}

        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {isFailed ? "Conversion failed" : isDone ? "Done — opening editor…" : "Converting your image"}
        </p>
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isActive = i === currentStepIndex && !isDone && !isFailed;
          const isDoneStep = isDone || i < currentStepIndex;
          return (
            <div
              key={step.key}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-500"
              style={{
                background: isDoneStep
                  ? "rgba(16,185,129,0.12)"
                  : isActive
                    ? "var(--accent-bg)"
                    : "var(--bg-subtle)",
                color: isDoneStep
                  ? "#10b981"
                  : isActive
                    ? "var(--accent)"
                    : "var(--text-muted)",
                border: `1px solid ${isDoneStep ? "rgba(16,185,129,0.2)" : isActive ? "var(--accent-border)" : "var(--border-subtle)"}`,
                transform: isActive ? "scale(1.05)" : "scale(1)",
                boxShadow: isActive ? "0 0 12px var(--accent-glow)" : "none",
                animation: isActive ? "pill-pulse 2s ease-in-out infinite" : "none",
              }}
            >
              {isDoneStep ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : isActive ? (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--accent)", animation: "pulse-dot 1s ease-in-out infinite" }}
                />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--border-default)" }} />
              )}
              {step.label}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="mb-2 flex justify-between text-xs text-[var(--text-muted)]">
          <span>{isFailed ? "Failed" : isDone ? "Complete" : STEPS[Math.max(0, currentStepIndex)]?.desc}</span>
          <span style={{ color: isDone ? "#10b981" : "var(--accent)" }}>{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-subtle)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: isFailed
                ? "var(--destructive)"
                : isDone
                  ? "#10b981"
                  : "linear-gradient(90deg, var(--accent), var(--accent-light))",
              boxShadow: isFailed || isDone ? "none" : "0 0 10px var(--accent-glow)",
            }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Conversion progress"
          />
        </div>
      </div>

      {isFailed && (
        <p className="rounded-lg bg-[var(--destructive)]/10 px-4 py-2 text-xs text-[var(--destructive)]">
          {data?.error?.message ?? (error as Error | undefined)?.message ?? "An error occurred"}
        </p>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateY(-32px); }
          to   { transform: rotate(360deg) translateY(-32px); }
        }
        @keyframes pop-in {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes pill-pulse {
          0%, 100% { box-shadow: 0 0 8px var(--accent-glow); }
          50% { box-shadow: 0 0 20px var(--accent-glow); }
        }
      `}</style>
    </div>
  );
}
