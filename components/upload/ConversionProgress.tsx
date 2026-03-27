"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
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
    if (data?.status === "failed") onError?.(data.error?.message ?? "Conversion failed");
    if (error) onError?.((error as Error).message);
  }, [data, error, onError]);

  const currentStepIndex = data ? STEP_ORDER.indexOf(data.step) : -1;
  const isFailed = data?.status === "failed" || !!error;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-background p-8">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {isFailed
            ? "Conversion failed"
            : data?.status === "done"
              ? "Conversion complete"
              : "Converting…"}
        </span>
        <span className="text-xs text-foreground/50">{data?.progress ?? 0}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isFailed ? "bg-destructive" : "bg-foreground",
          )}
          style={{ width: `${data?.progress ?? 0}%` }}
          role="progressbar"
          aria-valuenow={data?.progress ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Steps */}
      <ol className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isDone = currentStepIndex > i || data?.status === "done";
          const isActive = currentStepIndex === i && !isFailed;
          const isFuture = currentStepIndex < i;

          return (
            <li key={step.key} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300",
                  isDone
                    ? "border-foreground bg-foreground text-background"
                    : isActive
                      ? "border-foreground bg-transparent"
                      : isFailed && currentStepIndex === i
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border bg-transparent",
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isFailed && currentStepIndex === i ? (
                  <XCircle className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className={cn("text-xs font-medium", isFuture && "text-foreground/30")}>
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isDone || isActive ? "text-foreground" : "text-foreground/40",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {(isFailed) && (
        <p className="text-xs text-destructive">
          {data?.error?.message ?? (error as Error | undefined)?.message ?? "An error occurred"}
        </p>
      )}
    </div>
  );
}
