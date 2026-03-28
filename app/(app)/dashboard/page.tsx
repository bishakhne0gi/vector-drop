"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { DropZone } from "@/components/upload/DropZone";
import { ConversionProgress } from "@/components/upload/ConversionProgress";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { Navbar } from "@/components/shared/Navbar";
import { FloatingStatusHint } from "@/components/shared/FloatingStatusHint";
import type {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
  ConvertProjectResponse,
  JobStatusResponse,
} from "@/lib/types";

const GUEST_IDS_KEY = "vd_guest_project_ids";

function getGuestIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_IDS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function addGuestId(id: string) {
  const ids = getGuestIds();
  if (!ids.includes(id)) {
    localStorage.setItem(GUEST_IDS_KEY, JSON.stringify([...ids, id]));
  }
}

function clearGuestIds() {
  localStorage.removeItem(GUEST_IDS_KEY);
}

async function fetchProjects(userId: string | null | undefined): Promise<Project[]> {
  if (userId === undefined) return []; // Still loading Clerk
  if (userId) {
    const res = await fetch("/api/projects");
    if (!res.ok) throw new Error("Failed to load projects");
    return res.json() as Promise<Project[]>;
  } else {
    const ids = getGuestIds();
    if (ids.length === 0) return [];
    const res = await fetch(`/api/projects?ids=${ids.join(",")}`);
    if (!res.ok) throw new Error("Failed to load projects");
    return res.json() as Promise<Project[]>;
  }
}

async function createAndConvert(
  file: File,
): Promise<{ jobId: string; projectId: string }> {
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

  // Track guest project IDs in localStorage
  if (!project.user_id) {
    addGuestId(project.id);
  }

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
  if (!convertRes.ok) throw new Error("Failed to start conversion");
  const { jobId } = (await convertRes.json()) as ConvertProjectResponse;

  return { jobId, projectId: project.id };
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const ph = usePostHog();
  const queryClient = useQueryClient();
  const [activeJob, setActiveJob] = useState<{
    jobId: string;
    projectId: string;
  } | null>(null);
  const [hintPhase, setHintPhase] = useState<"uploading" | "converting" | "done" | null>(null);

  // Claim guest projects after login
  useEffect(() => {
    if (!isLoaded || !user) return;
    const guestIds = getGuestIds();
    if (guestIds.length === 0) return;

    void fetch("/api/projects/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectIds: guestIds }),
    }).then((res) => {
      if (res.ok) {
        clearGuestIds();
        void queryClient.invalidateQueries({ queryKey: ["projects"] });
        ph.capture("guest_projects_claimed", { count: guestIds.length });
      }
    });
  }, [user, isLoaded, queryClient, ph]);

  const userId = isLoaded ? (user?.id ?? null) : undefined;

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

  const onFile = useCallback(
    (file: File) => mutation.mutate(file),
    [mutation],
  );

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

  return (
    <>
      <div className="page-bg" aria-hidden="true" />
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-6 pb-16 pt-8">
        {/* Welcome header */}
        <header className="mb-12 animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {user ? "Welcome back" : "Convert your image"}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {user
              ? "Upload an image below to convert it to a perfect SVG"
              : "Upload an image to convert — sign in to save and export your vectors"}
          </p>
        </header>

        {/* Upload / Progress */}
        <div
          className="mb-12 animate-fade-up"
          style={{ animationDelay: "80ms" }}
        >
          {activeJob ? (
            <ConversionProgress
              jobId={activeJob.jobId}
              onDone={onConversionDone}
              onError={onConversionError}
            />
          ) : (
            <DropZone onFile={onFile} disabled={mutation.isPending} />
          )}

          {mutation.isError && (
            <p className="mt-3 text-sm text-[var(--destructive)]">
              {(mutation.error as Error).message}
            </p>
          )}
        </div>

        {/* Loading state — shimmer skeleton cards */}
        {isLoading && (
          <section>
            <div className="mb-6 skeleton h-3 w-24 rounded-full" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-card overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="skeleton aspect-video w-full rounded-none" style={{ borderRadius: 0 }} />
                  <div className="flex items-start justify-between gap-3 p-5">
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="skeleton h-3.5 w-3/4" />
                      <div className="skeleton h-2.5 w-1/2" />
                    </div>
                    <div className="skeleton h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Error state */}
        {error && (
          <p className="text-sm text-[var(--destructive)]">
            Failed to load projects
          </p>
        )}

        {/* Empty state */}
        {projects && projects.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "var(--accent-glow)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">No projects yet</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Upload an image above to get started
            </p>
          </div>
        )}

        {/* Projects grid */}
        {projects && projects.length > 0 && (
          <section
            className="animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {user ? "All Projects" : "Your Conversions"}
            </h2>
            <div className="stagger-children grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} isGuest={!user} />
              ))}
            </div>
          </section>
        )}
      </main>

      <FloatingStatusHint phase={hintPhase} />
    </>
  );
}
