"use client";

import { useEditorStore } from "@/stores/editorStore";

export function LayerPanel() {
  const paths = useEditorStore((s) => s.paths);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectPath = useEditorStore((s) => s.selectPath);

  return (
    <aside
      className="flex h-full w-48 shrink-0 flex-col border-r border-border bg-background"
      aria-label="Layers"
    >
      <div className="flex h-10 items-center border-b border-border px-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
          Layers
        </span>
      </div>

      {paths.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-xs text-foreground/40">No paths</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
          {/* Render top-to-bottom (last path = top visually) */}
          {[...paths].reverse().map((path) => {
            const isSelected = selectedIds.has(path.id);
            return (
              <li
                key={path.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => selectPath(path.id)}
                className={[
                  "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                  isSelected
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-foreground/70 hover:bg-foreground/5",
                ].join(" ")}
              >
                {/* Color swatch */}
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-sm border border-border"
                  style={{
                    background: path.fill === "none" || path.fill === "" ? "transparent" : path.fill,
                  }}
                  aria-hidden="true"
                />
                <span className="truncate font-mono">{path.id}</span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
