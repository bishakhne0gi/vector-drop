"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { DropZone } from "@/components/upload/DropZone";
import { ConversionProgress } from "@/components/upload/ConversionProgress";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { Navbar } from "@/components/shared/Navbar";
import { FloatingStatusHint } from "@/components/shared/FloatingStatusHint";
import { FeedbackButton } from "@/components/shared/FeedbackButton";
import { CreditToast } from "@/components/shared/CreditToast";
import { PURCHASE_GRANT_UNITS, UNITS_PER_CREDIT } from "@/lib/credits/constants";
import type {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
  ConvertProjectResponse,
  JobStatusResponse,
} from "@/lib/types";

const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_MONO = "auxMono, monospace";

/* ─── Data fetching ─────────────────────────────────────────────────────────── */

async function fetchProjects(userId: string | null | undefined): Promise<Project[]> {
  // undefined = Clerk still loading; null = signed out (the app layout redirects,
  // so this only happens mid-transition).
  if (!userId) return [];
  {
    const res = await fetch("/api/projects");
    if (!res.ok) throw new Error("Failed to load projects");
    return res.json() as Promise<Project[]>
  }
}

/** Carries the HTTP status so the UI can tell "out of credits" from a real failure. */
class ConversionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ConversionError";
  }
}

/** True when the failure was "you have no credits", not a broken pipeline. */
function isOutOfCredits(err: unknown): boolean {
  return err instanceof ConversionError && err.status === 402;
}

async function createAndConvert(file: File): Promise<{ jobId: string; projectId: string }> {
  const body: CreateProjectRequest = {
    name: file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()),
    fileName: file.name
      .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
      .replace(/[^a-zA-Z0-9.]/g, ""),
    mimeType: file.type as CreateProjectRequest["mimeType"],
    fileSizeBytes: file.size,
  };
  const createRes = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!createRes.ok) {
    let message = "Failed to create project";
    try {
      const json = await createRes.json() as { error?: { message?: string } };
      if (json.error?.message) message = json.error.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  const { project, uploadUrl } = (await createRes.json()) as CreateProjectResponse;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Failed to upload image");

  const convertRes = await fetch(`/api/projects/${project.id}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!convertRes.ok) {
    // Surface the server's actual reason. This used to throw a flat
    // "Failed to start conversion", which hid the 402 telling the user they
    // were out of credits — leaving them with no idea what went wrong or what
    // to do about it.
    let message = "Failed to start conversion";
    try {
      const json = (await convertRes.json()) as { error?: { message?: string } };
      if (json.error?.message) message = json.error.message;
    } catch {
      /* keep the fallback */
    }
    throw new ConversionError(message, convertRes.status);
  }
  const { jobId } = (await convertRes.json()) as ConvertProjectResponse;
  return { jobId, projectId: project.id };
}

/* ─── Skeleton card ─────────────────────────────────────────────────────────── */

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="animate-stagger-in overflow-hidden"
      style={{
        background: "#131313",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 0,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="skeleton aspect-4/3 w-full" style={{ borderRadius: 0 }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "16px 18px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 12, width: "65%", borderRadius: 0 }} />
          <div className="skeleton" style={{ height: 10, width: "35%", borderRadius: 0 }} />
        </div>
        <div className="skeleton" style={{ height: 18, width: 48, borderRadius: 0 }} />
      </div>
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 0", textAlign: "center", fontFamily: FONT_BODY }}>
      <div style={{ marginBottom: 24, position: "relative" }}>
        <div style={{
          width: 72,
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 15 C3 15 6 6 12 12 C18 18 21 9 21 9" />
            <circle cx="3" cy="15" r="1.8" fill="rgba(255,255,255,0.30)" stroke="none" />
            <circle cx="12" cy="12" r="1.4" fill="rgba(255,255,255,0.20)" stroke="none" />
            <circle cx="21" cy="9" r="1.8" fill="rgba(255,255,255,0.30)" stroke="none" />
          </svg>
        </div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.70)", margin: 0 }}>No projects yet</p>
      <p style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.28)", maxWidth: 220, lineHeight: 1.6 }}>
        Drop an image above to trace your first vector
      </p>
    </div>
  );
}

/* ─── Dashboard page ────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const ph = usePostHog();
  const queryClient = useQueryClient();
  const [activeJob, setActiveJob] = useState<{ jobId: string; projectId: string } | null>(null);
  const [hintPhase, setHintPhase] = useState<"uploading" | "converting" | "done" | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<string | null>(null);

  const userId = isLoaded ? (user?.id ?? null) : undefined;

  // Returning from Dodo checkout. The webhook is the primary way credits are
  // granted, but it can be delayed or dropped — and a user staring at an
  // unchanged balance after paying will not wait patiently. Ask Dodo directly
  // what was paid; the grant is idempotent, so this and the webhook cannot
  // double-credit.
  useEffect(() => {
    if (!isLoaded || !user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchase") !== "success") return;

    void fetch("/api/payments/reconcile", { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { granted: number } | null) => {
        void queryClient.invalidateQueries({ queryKey: ["credits"] });
        if (body?.granted) {
          // Confirm the money did something. The payment happened on Dodo's
          // site, so without this the user returns to an apparently unchanged
          // page and has to go hunting for a number.
          setCreditsAdded(String(body.granted * (PURCHASE_GRANT_UNITS / UNITS_PER_CREDIT)));
          ph.capture("purchase_reconciled", { granted: body.granted });
        }
      })
      .finally(() => {
        // Drop the query param so a refresh does not look like a fresh purchase.
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, [isLoaded, user, queryClient, ph]);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects", userId],
    queryFn: () => fetchProjects(userId),
    enabled: isLoaded,
  });

  const mutation = useMutation({
    mutationFn: createAndConvert,
    onMutate: () => {
      setHintPhase("uploading");
      ph.capture("conversion_started");
    },
    onSuccess: (data) => {
      setActiveJob(data);
      setHintPhase("converting");
    },
    onError: (err) => {
      setHintPhase(null);
      ph.capture("conversion_failed", { error: (err as Error).message });
    },
  });

  const onFile = useCallback((file: File) => mutation.mutate(file), [mutation]);

  const onConversionDone = useCallback(
    (_job: JobStatusResponse) => {
      setHintPhase("done");
      setTimeout(() => setHintPhase(null), 2500);
      setActiveJob(null);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      ph.capture("conversion_completed");
    },
    [queryClient, ph],
  );

  const onConversionError = useCallback(() => {
    setHintPhase(null);
    setActiveJob(null);
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    ph.capture("conversion_error");
  }, [queryClient, ph]);

  const firstName = user?.firstName ?? user?.username ?? null;

  return (
    <div style={{ minHeight: "100vh", background: "#161516", fontFamily: FONT_BODY }}>
      <Navbar />

      <main style={{ maxWidth: 1024, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── Welcome header ─────────────────────────────────────────────── */}
        <header className="animate-fade-up" style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h1 style={{
                fontSize: 30,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                color: "#ffffff",
                margin: 0,
                lineHeight: 1.15,
                fontFamily: FONT_BODY,
              }}>
                {user
                  ? firstName
                    ? `Hey, ${firstName}`
                    : "Welcome back"
                  : "Convert your image"}
              </h1>
              <p style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.40)", fontFamily: FONT_BODY }}>
                {user
                  ? "Upload an image below to convert it to a perfect SVG"
                  : "Upload an image to convert — sign in to save and export your vectors"}
              </p>
            </div>

            {/* Stats pill */}
            {projects && projects.length > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.50)", fontFamily: FONT_MONO, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {projects.filter(p => p.status === "ready").length} / {projects.length} ready
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            marginTop: 28,
            height: 1,
            background: "linear-gradient(90deg, rgba(255,255,255,0.10), transparent 60%)",
          }} />
        </header>

        {/* ── Upload / Progress zone ──────────────────────────────────────── */}
        <section className="animate-fade-up" style={{ marginBottom: 48, animationDelay: "80ms" }}>
          {/* The drop zone stays put while converting — replacing it hid the
              thing the user just interacted with. Progress appears beneath it. */}
          <DropZone onFile={onFile} disabled={mutation.isPending || !!activeJob} />

          {activeJob && (
            <ConversionProgress
              jobId={activeJob.jobId}
              onDone={onConversionDone}
              onError={onConversionError}
            />
          )}

          {mutation.isError && isOutOfCredits(mutation.error) && (
            /* Out of credits is not an error the user can debug — it is a
               transaction they need to complete. Say what happened, what it
               costs, and give them the way out in the same box. */
            <div
              style={{
                marginTop: 12,
                padding: "16px 18px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,159,67,0.35)",
                fontFamily: FONT_BODY,
              }}
              role="alert"
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  color: "rgba(255,183,110,0.95)",
                }}
              >
                Out of credits
              </p>
              <p style={{ margin: "8px 0 4px", fontSize: 14, color: "rgba(255,255,255,0.88)" }}>
                Converting an image costs 1 credit, and your balance is empty.
              </p>
              <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "rgba(255,255,255,0.50)" }}>
                Your image was uploaded and is safe — top up and convert it whenever you like.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Link href="/pricing" style={{ textDecoration: "none" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: 34,
                      padding: "0 18px",
                      background: "#ffffff",
                      color: "#161516",
                      fontSize: 10,
                      fontFamily: FONT_MONO,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 700,
                    }}
                  >
                    Get 20 credits for $3
                  </span>
                </Link>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>
                  + tax · credits never expire
                </span>
              </div>
            </div>
          )}

          {mutation.isError && !isOutOfCredits(mutation.error) && (
            <div style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.20)",
              color: "#f87171",
              fontSize: 12,
              fontFamily: FONT_BODY,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {(mutation.error as Error).message}
            </div>
          )}
        </section>

        {/* ── Projects section ─────────────────────────────────────────────── */}
        {isLoading && (
          <section>
            <div className="skeleton" style={{ height: 10, width: 72, marginBottom: 20, borderRadius: 0 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} delay={i * 70} />
              ))}
            </div>
          </section>
        )}

        {error && (
          <p style={{ fontSize: 12, color: "#f87171" }}>Failed to load projects</p>
        )}

        {projects && projects.length === 0 && !isLoading && <EmptyState />}

        {projects && projects.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "160ms" }}>
            {/* Section header */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                color: "rgba(255,255,255,0.28)",
                margin: 0,
                fontFamily: FONT_MONO,
              }}>
                {user ? "All Projects" : "Your Conversions"}
              </h2>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: FONT_MONO }}>
                {projects.length} {projects.length === 1 ? "file" : "files"}
              </span>
            </div>

            {/* Grid */}
            <div className="stagger-children" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <FloatingStatusHint phase={hintPhase} />
      <FeedbackButton page="dashboard" />

      {creditsAdded && (
        <CreditToast credits={creditsAdded} onDismiss={() => setCreditsAdded(null)} />
      )}
    </div>
  );
}
