"use client";

import { useEditorStore, type SVGPath } from "@/stores/editorStore";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const colorValue = value === "none" || value === "" ? "#000000" : value;
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-foreground/60">{label}</label>
      <div className="flex items-center gap-1.5">
        <div
          className="h-5 w-5 rounded border border-border"
          style={{ background: value === "none" || value === "" ? "transparent" : value }}
          aria-hidden="true"
        />
        <input
          type="color"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-5 w-5 cursor-pointer appearance-none rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-foreground/60">{label}</label>
        <span className="text-xs tabular-nums text-foreground/60">
          {step < 1 ? `${Math.round(value * 100)}%` : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500"
        aria-label={label}
      />
    </div>
  );
}

function SinglePathProperties({ path }: { path: SVGPath }) {
  const updatePath = useEditorStore((s) => s.updatePath);

  return (
    <div className="flex flex-col gap-4 p-4">
      <ColorField
        label="Fill"
        value={path.fill}
        onChange={(v) => updatePath(path.id, { fill: v })}
      />
      <ColorField
        label="Stroke"
        value={path.stroke}
        onChange={(v) => updatePath(path.id, { stroke: v })}
      />
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-foreground/60">Stroke width</label>
        <input
          type="number"
          min={0}
          max={20}
          step={0.5}
          value={path.strokeWidth}
          onChange={(e) => updatePath(path.id, { strokeWidth: parseFloat(e.target.value) || 0 })}
          className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-xs"
          aria-label="Stroke width"
        />
      </div>
      <NumberField
        label="Opacity"
        value={path.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updatePath(path.id, { opacity: v })}
      />
    </div>
  );
}

function MultiPathProperties({ ids }: { ids: string[] }) {
  const updatePath = useEditorStore((s) => s.updatePath);
  const paths = useEditorStore((s) => s.paths);

  const selectedPaths = paths.filter((p) => ids.includes(p.id));
  const avgOpacity =
    selectedPaths.length > 0
      ? selectedPaths.reduce((sum, p) => sum + p.opacity, 0) / selectedPaths.length
      : 1;

  function handleOpacity(v: number) {
    ids.forEach((id) => updatePath(id, { opacity: v }));
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-foreground/50">{ids.length} paths selected</p>
      <NumberField
        label="Opacity"
        value={avgOpacity}
        min={0}
        max={1}
        step={0.01}
        onChange={handleOpacity}
      />
    </div>
  );
}

export function PropertiesPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const paths = useEditorStore((s) => s.paths);

  const selectedArr = Array.from(selectedIds);

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col border-l border-border bg-background"
      aria-label="Properties"
    >
      <div className="flex h-10 items-center border-b border-border px-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
          Properties
        </span>
      </div>

      {selectedArr.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-xs text-foreground/40">Select a path to edit</p>
        </div>
      ) : selectedArr.length === 1 ? (
        (() => {
          const path = paths.find((p) => p.id === selectedArr[0]);
          return path ? <SinglePathProperties path={path} /> : null;
        })()
      ) : (
        <MultiPathProperties ids={selectedArr} />
      )}
    </aside>
  );
}
