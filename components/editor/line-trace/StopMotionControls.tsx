'use client'

import type { Params, AspectRatio } from '@/lib/line-trace/types'

type Props = {
  params: Params
  aspect: AspectRatio
  onChange: (next: Params) => void
  onAspectChange: (next: AspectRatio) => void
  onExportSvg: () => void
  onExportWebm: () => void
  webmProgress: number | null
}

export function StopMotionControls(props: Props) {
  const {
    params,
    aspect,
    onChange,
    onAspectChange,
    onExportSvg,
    onExportWebm,
    webmProgress,
  } = props

  function set<K extends keyof Params>(key: K, value: Params[K]) {
    onChange({ ...params, [key]: value })
  }

  return (
    <aside className="flex h-full w-full flex-col gap-4 border-l border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-200">
      <h2 className="text-base font-semibold">Stop Motion</h2>

      <label className="flex flex-col gap-1">
        <span>Total duration: {params.totalDurationSec}s</span>
        <input
          type="range"
          min={1}
          max={30}
          step={0.5}
          value={params.totalDurationSec}
          onChange={(e) => set('totalDurationSec', parseFloat(e.target.value))}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span>Stagger</span>
        <select
          value={params.staggerMode}
          onChange={(e) => set('staggerMode', e.target.value as Params['staggerMode'])}
          className="rounded bg-neutral-800 p-1"
        >
          <option value="sequential">Sequential</option>
          <option value="overlapped">Overlapped</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span>Draw order</span>
        <select
          value={params.sortMode}
          onChange={(e) => set('sortMode', e.target.value as Params['sortMode'])}
          className="rounded bg-neutral-800 p-1"
        >
          <option value="by-size">By size (big → small)</option>
          <option value="document">Document order</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span>Easing</span>
        <select
          value={params.easing}
          onChange={(e) => set('easing', e.target.value as Params['easing'])}
          className="rounded bg-neutral-800 p-1"
        >
          <option value="linear">Linear</option>
          <option value="ease-in-out">Ease in-out</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span>Stroke color override</span>
        <input
          type="color"
          value={params.strokeColorOverride ?? '#000000'}
          onChange={(e) => set('strokeColorOverride', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span>Export aspect (video)</span>
        <select
          value={aspect}
          onChange={(e) => onAspectChange(e.target.value as AspectRatio)}
          className="rounded bg-neutral-800 p-1"
        >
          <option value="1:1">1:1 (square)</option>
          <option value="9:16">9:16 (vertical)</option>
          <option value="16:9">16:9 (horizontal)</option>
        </select>
      </label>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={onExportSvg}
          className="rounded bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-100"
        >
          Export Animated SVG
        </button>
        <button
          type="button"
          onClick={onExportWebm}
          disabled={webmProgress !== null}
          className="rounded bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {webmProgress === null
            ? 'Export Video (.webm)'
            : `Recording… ${Math.round(webmProgress * 100)}%`}
        </button>
      </div>
    </aside>
  )
}
