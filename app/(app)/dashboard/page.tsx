"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DropZone } from "@/components/upload/DropZone";
import { ConversionProgress } from "@/components/upload/ConversionProgress";
import { ProjectCard } from "@/components/shared/ProjectCard";
import type {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
  ConvertProjectResponse,
  JobStatusResponse,
} from "@/lib/types";

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json() as Promise<Project[]>;
}

async function createAndConvert(
  file: File,
): Promise<{ jobId: string; projectId: string }> {
  // 1. Create project + get upload URL
  const body: CreateProjectRequest = {
    name: file.name.replace(/\.[^.]+$/, ""),
    fileName: file.name,
    mimeType: file.type as CreateProjectRequest["mimeType"],
    fileSizeBytes: file.size,
  };
  const createRes = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!createRes.ok) throw new Error("Failed to create project");
  const { project, uploadUrl } = (await createRes.json()) as CreateProjectResponse;

  // 2. Upload file to storage
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Failed to upload image");

  // 3. Kick off conversion
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, startSignOut] = useTransition();
  const [activeJob, setActiveJob] = useState<{
    jobId: string;
    projectId: string;
  } | null>(null);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const mutation = useMutation({
    mutationFn: createAndConvert,
    onSuccess: (data) => setActiveJob(data),
  });

  const onFile = useCallback(
    (file: File) => mutation.mutate(file),
    [mutation],
  );

  const onConversionDone = useCallback(
    (_job: JobStatusResponse) => {
      setActiveJob(null);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    [queryClient],
  );

  const onConversionError = useCallback(() => {
    setActiveJob(null);
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
  }, [queryClient]);

  function handleSignOut() {
    startSignOut(async () => {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
    });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-16">
      <header className="mb-12 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-sm text-foreground/50">
            Upload an image to convert it to an editable SVG
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/icons"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
          >
            Icon Library
          </Link>
          <Link
            href="/icons/my"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
          >
            My Icons
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>

      <div className="mb-12">
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
          <p className="mt-3 text-sm text-destructive">
            {(mutation.error as Error).message}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">Failed to load projects</p>
      )}

      {projects && projects.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-foreground/40">
            No projects yet. Upload an image above to get started.
          </p>
        </div>
      )}

      {projects && projects.length > 0 && (
        <section>
          <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-foreground/40">
            All Projects
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
