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

  // Actions
  setPaths: (paths: SVGPath[]) => void;
  setSvgMeta: (meta: SVGMeta) => void;
  selectPath: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  updatePath: (id: string, patch: Partial<SVGPath>) => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  paths: [],
  selectedIds: new Set(),
  history: [],
  historyIndex: -1,
  svgMeta: null,

  setSvgMeta: (meta) => set({ svgMeta: meta }),

  setPaths: (paths) => {
    const entry: HistoryEntry = { paths };
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1).concat(entry);
    set({ paths, history: newHistory, historyIndex: newHistory.length - 1 });
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
      const entry: HistoryEntry = { paths };
      const newHistory = s.history.slice(0, s.historyIndex + 1).concat(entry);
      return { paths, history: newHistory, historyIndex: newHistory.length - 1 };
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
}));
