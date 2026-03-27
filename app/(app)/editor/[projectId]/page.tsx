"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { Toolbar } from "@/components/editor/Toolbar";
import { LayerPanel } from "@/components/sidebar/LayerPanel";
import { PropertiesPanel } from "@/components/sidebar/PropertiesPanel";
import type { Project } from "@/lib/types";

async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Project not found");
  return res.json() as Promise<Project>;
}

export default function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-destructive">
          {error ? (error as Error).message : "Project not found"}
        </p>
      </div>
    );
  }

  const svgUrl = project.svg_url ?? null;

  if (!svgUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-foreground/50">
          SVG not yet available. Convert the project first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar projectId={projectId} projectName={project.name} />

      <div className="flex flex-1 overflow-hidden">
        <LayerPanel />
        <main className="flex-1 overflow-hidden">
          <EditorCanvas svgUrl={svgUrl} />
        </main>
        <PropertiesPanel />
      </div>
    </div>
  );
}
