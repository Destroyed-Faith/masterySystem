/**
 * Shared types for the Mastery Scene Editor.
 * Native Foundry walls are the runtime source of truth; these types describe
 * editor overlays, hints, suggestions and the versioned scene-flag document.
 */

export const SCENE_EDITOR_FLAG = 'sceneEditor';
export const SCENE_EDITOR_WALL_FLAG = 'sceneEditorWall';
export const SCENE_EDITOR_SCHEMA_VERSION = 1;
export const SCENE_EDITOR_VERSION = '1.0.0';

export type EditorTool =
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'hint'
  | 'ignore'
  | 'region-analyze';

export type SnapMode = 'magnetic' | 'grid' | 'free';

export type GeometryKind = 'wall' | 'door' | 'window';

export type HintKind = 'wall' | 'door' | 'window' | 'ignore';

export type DoorState = 'open' | 'closed' | 'locked';

export type SuggestionOrigin = 'local' | 'hint-assisted' | 'import';

export type WallOrigin = 'manual' | 'analysis' | 'hint-assisted' | 'import';

export type EditorStatus =
  | 'saved'
  | 'saving'
  | 'dirty'
  | 'analyzing'
  | 'analyzed'
  | 'stale'
  | 'background-changed'
  | 'no-map';

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  a: Point;
  b: Point;
}

export interface EditorWallView {
  id: string;
  a: Point;
  b: Point;
  kind: GeometryKind;
  doorState: DoorState | null;
  /** Secret doors are preserved but never offered as a tool. */
  secret: boolean;
  /** Native fields the editor does not own. */
  extra: Record<string, unknown>;
}

export interface Suggestion {
  id: string;
  kind: GeometryKind;
  a: Point;
  b: Point;
  confidence: number;
  origin: SuggestionOrigin;
  rejected: boolean;
  uncertain: boolean;
  hintIds: string[];
}

export interface Hint {
  id: string;
  kind: HintKind;
  /** Line hint (wall / door / window) or first corner of an ignore rect. */
  a: Point;
  /** Second point of the line, or opposite corner of an ignore rect. */
  b: Point;
}

export interface AnalysisDebug {
  width: number;
  height: number;
  /** 0/1 mask, row-major, only kept in memory — never written to scene flags. */
  mask?: Uint8Array;
  lines: Segment[];
}

export interface AnalyzerInput {
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement;
  imageWidth: number;
  imageHeight: number;
  sceneOrigin: Point;
  sceneSize: Point;
  region?: { x: number; y: number; width: number; height: number };
  confirmed: Segment[];
  hints: Hint[];
  maxResolution: number;
  minSegmentLength: number;
}

export interface AnalyzerOutput {
  suggestions: Suggestion[];
  uncertainCount: number;
  warnings: string[];
  debug: AnalysisDebug;
  analyzer: string;
  analyzerVersion: string;
}

export interface Analyzer {
  id: string;
  version: string;
  analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<AnalyzerOutput>;
}

export interface SceneEditorStored {
  schemaVersion: number;
  editorVersion: string;
  sceneId: string;
  backgroundSrc: string;
  backgroundWidth: number;
  backgroundHeight: number;
  backgroundFingerprint: string;
  analysis: {
    lastRun: number | null;
    analyzer: string | null;
    analyzerVersion: string | null;
    params: { maxResolution: number; minSegmentLength: number };
    stale: boolean;
    backgroundChanged: boolean;
  };
  hints: Hint[];
  suggestions: Suggestion[];
  rejected: string[];
  accepted: Record<string, string>;
  ui: {
    lastTool: EditorTool;
    snapMode: SnapMode;
    layers: AnalysisLayerVisibility;
  };
}

export interface AnalysisLayerVisibility {
  map: boolean;
  mask: boolean;
  lines: boolean;
  suggestions: boolean;
  confirmed: boolean;
  hints: boolean;
}

export const DEFAULT_LAYER_VISIBILITY: AnalysisLayerVisibility = {
  map: true,
  mask: false,
  lines: false,
  suggestions: true,
  confirmed: true,
  hints: true,
};

export interface PortableSceneDocument {
  schemaVersion: number;
  editorVersion: string;
  sceneName: string;
  backgroundSrc: string;
  backgroundWidth: number;
  backgroundHeight: number;
  geometry: Array<{
    id?: string;
    kind: GeometryKind;
    doorState?: DoorState | null;
    secret?: boolean;
    a: Point;
    b: Point;
  }>;
  hints: Hint[];
  suggestions: Suggestion[];
  rejected: string[];
  analysis: SceneEditorStored['analysis'];
}

export function emptyStored(sceneId: string): SceneEditorStored {
  return {
    schemaVersion: SCENE_EDITOR_SCHEMA_VERSION,
    editorVersion: SCENE_EDITOR_VERSION,
    sceneId,
    backgroundSrc: '',
    backgroundWidth: 0,
    backgroundHeight: 0,
    backgroundFingerprint: '',
    analysis: {
      lastRun: null,
      analyzer: null,
      analyzerVersion: null,
      params: { maxResolution: 800, minSegmentLength: 48 },
      stale: false,
      backgroundChanged: false,
    },
    hints: [],
    suggestions: [],
    rejected: [],
    accepted: {},
    ui: {
      lastTool: 'select',
      snapMode: 'magnetic',
      layers: { ...DEFAULT_LAYER_VISIBILITY },
    },
  };
}
