import { create } from "zustand";

export interface SVGPath {
  id: string;
  d: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeLinecap: "butt" | "round" | "square";
  strokeLinejoin: "miter" | "round" | "bevel";
  opacity: number;
  visible: boolean;
  locked: boolean;
  name: string;
}

export interface SVGMeta {
  viewBox: string;
  width: number;
  height: number;
}

interface HistoryEntry {
  paths: SVGPath[];
}

interface EditorState {
  paths: SVGPath[];
  selectedIds: Set<string>;
  history: HistoryEntry[];
  historyIndex: number;
  svgMeta: SVGMeta | null;
  zoom: number;
  panX: number;
  panY: number;

  // Actions
  setPaths: (paths: SVGPath[]) => void;
  setSvgMeta: (meta: SVGMeta) => void;
  selectPath: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  updatePath: (id: string, patch: Partial<SVGPath>) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  deletePaths: (ids: string[]) => void;
  duplicatePath: (id: string) => void;
  reorderPath: (id: string, direction: "up" | "down") => void;
  renamePath: (id: string, name: string) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
}

function pushHistory(
  state: Pick<EditorState, "history" | "historyIndex">,
  paths: SVGPath[],
): Pick<EditorState, "history" | "historyIndex" | "paths"> {
  const entry: HistoryEntry = { paths };
  const newHistory = state.history.slice(0, state.historyIndex + 1).concat(entry);
  return { paths, history: newHistory, historyIndex: newHistory.length - 1 };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  paths: [],
  selectedIds: new Set(),
  history: [],
  historyIndex: -1,
  svgMeta: null,
  zoom: 1,
  panX: 0,
  panY: 0,

  setSvgMeta: (meta) => set({ svgMeta: meta }),

  setPaths: (paths) => {
    const s = get();
    set(pushHistory(s, paths));
  },

  selectPath: (id, additive = false) => {
    set((s) => {
      const next = new Set(additive ? s.selectedIds : []);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    });
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  updatePath: (id, patch) => {
    set((s) => {
      const paths = s.paths.map((p) => (p.id === id ? { ...p, ...patch } : p));
      return pushHistory(s, paths);
    });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const prev = historyIndex - 1;
    set({ paths: history[prev].paths, historyIndex: prev, selectedIds: new Set() });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const next = historyIndex + 1;
    set({ paths: history[next].paths, historyIndex: next, selectedIds: new Set() });
  },

  setZoom: (z) => set({ zoom: Math.min(Math.max(z, 0.05), 40) }),

  setPan: (x, y) => set({ panX: x, panY: y }),

  deletePaths: (ids) => {
    set((s) => {
      const paths = s.paths.filter((p) => !ids.includes(p.id));
      const selectedIds = new Set([...s.selectedIds].filter((id) => !ids.includes(id)));
      return { ...pushHistory(s, paths), selectedIds };
    });
  },

  duplicatePath: (id) => {
    set((s) => {
      const source = s.paths.find((p) => p.id === id);
      if (!source) return {};
      const newId = `${source.id}-copy`;
      const copy: SVGPath = { ...source, id: newId, name: `${source.name} copy` };
      const idx = s.paths.findIndex((p) => p.id === id);
      const paths = [...s.paths.slice(0, idx + 1), copy, ...s.paths.slice(idx + 1)];
      return pushHistory(s, paths);
    });
  },

  reorderPath: (id, direction) => {
    set((s) => {
      const idx = s.paths.findIndex((p) => p.id === id);
      if (idx === -1) return {};
      const paths = [...s.paths];
      if (direction === "up" && idx < paths.length - 1) {
        [paths[idx], paths[idx + 1]] = [paths[idx + 1], paths[idx]];
      } else if (direction === "down" && idx > 0) {
        [paths[idx], paths[idx - 1]] = [paths[idx - 1], paths[idx]];
      }
      return pushHistory(s, paths);
    });
  },

  renamePath: (id, name) => {
    set((s) => {
      const paths = s.paths.map((p) => (p.id === id ? { ...p, name } : p));
      return pushHistory(s, paths);
    });
  },

  toggleVisibility: (id) => {
    set((s) => {
      const paths = s.paths.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p));
      return pushHistory(s, paths);
    });
  },

  toggleLock: (id) => {
    set((s) => {
      const paths = s.paths.map((p) => (p.id === id ? { ...p, locked: !p.locked } : p));
      const selectedIds = new Set(s.selectedIds);
      const target = paths.find((p) => p.id === id);
      if (target?.locked) selectedIds.delete(id);
      return { ...pushHistory(s, paths), selectedIds };
    });
  },
}));
