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

function LoadingSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8">
      <div
        style={{
          width: "280px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {[80, 60, 70].map((widthPct, i) => (
          <div
            key={i}
            style={{
              height: "14px",
              width: `${widthPct}%`,
              borderRadius: "7px",
              background: "var(--bg-glass-strong)",
              backgroundImage:
                "linear-gradient(90deg, transparent 0%, var(--bg-glass) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: `shimmer 1.4s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
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
    return <LoadingSkeleton />;
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
