"use client";

import { use, useState } from "react";
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
      <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {[80, 60, 70].map((widthPct, i) => (
          <div
            key={i}
            style={{
              height: "14px",
              width: `${widthPct}%`,
              borderRadius: "7px",
              background: "var(--bg-glass-strong)",
              backgroundImage: "linear-gradient(90deg, transparent 0%, var(--bg-glass) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: `shimmer 1.4s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}

type MobileTab = "layers" | "canvas" | "properties";

function MobileTabBar({ active, onChange }: { active: MobileTab; onChange: (t: MobileTab) => void }) {
  const tabs: { key: MobileTab; label: string; icon: React.ReactNode }[] = [
    {
      key: "layers",
      label: "Layers",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      key: "canvas",
      label: "Canvas",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
    },
    {
      key: "properties",
      label: "Props",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid var(--border-default)",
        background: "var(--bg-glass-strong)",
        backdropFilter: "blur(20px)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "10px 0",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              background: "none",
              border: "none",
              fontSize: "10px",
              fontWeight: isActive ? 600 : 400,
              transition: "color 0.15s ease",
              borderTop: isActive ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [mobileTab, setMobileTab] = useState<MobileTab>("canvas");

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });

  if (isLoading) return <LoadingSkeleton />;

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
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          SVG not yet available. Convert the project first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar projectId={projectId} projectName={project.name} />

      {/* Desktop layout — side panels visible */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <LayerPanel />
        <main className="flex-1 overflow-hidden">
          <EditorCanvas svgUrl={svgUrl} />
        </main>
        <PropertiesPanel />
      </div>

      {/* Mobile layout — tab-switched panels */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {mobileTab === "layers" && (
            <div className="h-full overflow-y-auto" style={{ background: "var(--bg-card)" }}>
              <LayerPanel />
            </div>
          )}
          {mobileTab === "canvas" && (
            <EditorCanvas svgUrl={svgUrl} />
          )}
          {mobileTab === "properties" && (
            <div className="h-full overflow-y-auto" style={{ background: "var(--bg-card)" }}>
              <PropertiesPanel />
            </div>
          )}
        </div>
        <MobileTabBar active={mobileTab} onChange={setMobileTab} />
      </div>
    </div>
  );
}
