// Shared types for the stop-motion feature. Imported by every module in lib/stopmotion.

export type Path = {
  d: string;
  fill: string;
  stroke: string;
  length: number;
  bbox: { x: number; y: number; width: number; height: number };
};

export type SortMode = 'by-size' | 'document';
export type StaggerMode = 'sequential' | 'overlapped';
export type Easing = 'linear' | 'ease-in-out';
export type AspectRatio = '1:1' | '9:16' | '16:9';

export type Params = {
  totalDurationSec: number;
  staggerMode: StaggerMode;
  sortMode: SortMode;
  strokeColorOverride: string | null;
  easing: Easing;
  maxPaths: number;
};

export type Schedule = {
  pathStartSec: number;
  pathEndSec: number;
};

export const DEFAULT_PARAMS: Params = {
  totalDurationSec: 6,
  staggerMode: 'sequential',
  sortMode: 'by-size',
  strokeColorOverride: null,
  easing: 'linear',
  maxPaths: 200,
};
