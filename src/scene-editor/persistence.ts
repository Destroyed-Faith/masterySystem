/**
 * Versioned scene flags, autosave, and portable JSON for one map.
 */

import type {
  AnalysisLayerVisibility,
  EditorTool,
  Hint,
  PortableSceneDocument,
  SceneEditorStored,
  SnapMode,
  Suggestion,
} from './types.js';
import {
  emptyStored,
  SCENE_EDITOR_FLAG,
  SCENE_EDITOR_SCHEMA_VERSION,
  SCENE_EDITOR_VERSION,
} from './types.js';
import { denormalizePoint, normalizePoint } from './geometry.js';
import type { Point } from './types.js';

const SYSTEM = 'mastery-system';

export function migrateStored(raw: unknown, sceneId: string): SceneEditorStored {
  const base = emptyStored(sceneId);
  if (!raw || typeof raw !== 'object') return base;
  const src = raw as Partial<SceneEditorStored> & { schemaVersion?: number };
  const version = Number(src.schemaVersion) || 0;
  if (version > SCENE_EDITOR_SCHEMA_VERSION) return { ...base, ...pickKnown(src, sceneId) };
  return { ...base, ...pickKnown(src, sceneId), schemaVersion: SCENE_EDITOR_SCHEMA_VERSION };
}

function pickKnown(src: Partial<SceneEditorStored>, sceneId: string): SceneEditorStored {
  const empty = emptyStored(sceneId);
  return {
    ...empty,
    ...src,
    sceneId: String(src.sceneId || sceneId),
    schemaVersion: SCENE_EDITOR_SCHEMA_VERSION,
    editorVersion: String(src.editorVersion || SCENE_EDITOR_VERSION),
    hints: Array.isArray(src.hints) ? src.hints : [],
    suggestions: Array.isArray(src.suggestions) ? src.suggestions : [],
    rejected: Array.isArray(src.rejected) ? src.rejected : [],
    accepted: src.accepted && typeof src.accepted === 'object' ? src.accepted : {},
    analysis: { ...empty.analysis, ...(src.analysis ?? {}) },
    ui: { ...empty.ui, ...(src.ui ?? {}), layers: { ...empty.ui.layers, ...(src.ui?.layers ?? {}) } },
  };
}

export function readStored(scene: any): SceneEditorStored {
  const id = String(scene?.id ?? '');
  const raw = scene?.getFlag?.(SYSTEM, SCENE_EDITOR_FLAG) ?? scene?.flags?.[SYSTEM]?.[SCENE_EDITOR_FLAG];
  return migrateStored(raw, id);
}

export async function writeStored(scene: any, data: SceneEditorStored): Promise<void> {
  if (!scene?.setFlag) return;
  await scene.setFlag(SYSTEM, SCENE_EDITOR_FLAG, data);
}

export function backgroundFingerprint(scene: any): { src: string; width: number; height: number; fingerprint: string } {
  const src = String(scene?.background?.src || scene?.img || '');
  const width = Number(scene?.width || scene?.background?.width || 0);
  const height = Number(scene?.height || scene?.background?.height || 0);
  return { src, width, height, fingerprint: `${src}|${width}x${height}` };
}

export function sceneBox(scene: any): { origin: Point; size: Point } {
  const dims = (globalThis as any).canvas?.dimensions;
  const origin = {
    x: Number(dims?.sceneX ?? scene?.dimensions?.sceneX ?? 0) || 0,
    y: Number(dims?.sceneY ?? scene?.dimensions?.sceneY ?? 0) || 0,
  };
  const size = {
    x: Number(dims?.sceneWidth ?? scene?.width ?? 1) || 1,
    y: Number(dims?.sceneHeight ?? scene?.height ?? 1) || 1,
  };
  return { origin, size };
}

export function applyBackgroundWatch(stored: SceneEditorStored, scene: any): SceneEditorStored {
  const bg = backgroundFingerprint(scene);
  const changed = stored.backgroundFingerprint !== '' && stored.backgroundFingerprint !== bg.fingerprint;
  return {
    ...stored,
    backgroundSrc: bg.src,
    backgroundWidth: bg.width,
    backgroundHeight: bg.height,
    backgroundFingerprint: bg.fingerprint || stored.backgroundFingerprint,
    analysis: {
      ...stored.analysis,
      backgroundChanged: changed,
      stale: stored.analysis.stale || changed,
    },
  };
}

export function toPortable(
  stored: SceneEditorStored,
  sceneName: string,
  geometry: PortableSceneDocument['geometry'],
  origin: Point,
  size: Point,
): PortableSceneDocument {
  const norm = (p: Point) => normalizePoint(p, origin, size);
  return {
    schemaVersion: SCENE_EDITOR_SCHEMA_VERSION,
    editorVersion: SCENE_EDITOR_VERSION,
    sceneName,
    backgroundSrc: stored.backgroundSrc,
    backgroundWidth: stored.backgroundWidth,
    backgroundHeight: stored.backgroundHeight,
    geometry: geometry.map((g) => ({ ...g, a: norm(g.a), b: norm(g.b) })),
    hints: stored.hints.map((h) => ({ ...h, a: norm(h.a), b: norm(h.b) })),
    suggestions: stored.suggestions.map((s) => ({ ...s, a: norm(s.a), b: norm(s.b) })),
    rejected: [...stored.rejected],
    analysis: stored.analysis,
  };
}

export function fromPortable(doc: PortableSceneDocument, origin: Point, size: Point): {
  hints: Hint[];
  suggestions: Suggestion[];
  rejected: string[];
  geometry: PortableSceneDocument['geometry'];
} {
  const den = (p: Point) => denormalizePoint(p, origin, size);
  return {
    hints: (doc.hints ?? []).map((h) => ({ ...h, a: den(h.a), b: den(h.b) })),
    suggestions: (doc.suggestions ?? []).map((s) => ({ ...s, a: den(s.a), b: den(s.b) })),
    rejected: [...(doc.rejected ?? [])],
    geometry: (doc.geometry ?? []).map((g) => ({ ...g, a: den(g.a), b: den(g.b) })),
  };
}

export function parsePortable(raw: unknown): PortableSceneDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const doc = raw as Partial<PortableSceneDocument>;
  if (!Array.isArray(doc.geometry) && !Array.isArray(doc.hints) && !Array.isArray(doc.suggestions)) return null;
  return {
    schemaVersion: Number(doc.schemaVersion) || 1,
    editorVersion: String(doc.editorVersion || SCENE_EDITOR_VERSION),
    sceneName: String(doc.sceneName || ''),
    backgroundSrc: String(doc.backgroundSrc || ''),
    backgroundWidth: Number(doc.backgroundWidth) || 0,
    backgroundHeight: Number(doc.backgroundHeight) || 0,
    geometry: Array.isArray(doc.geometry) ? doc.geometry : [],
    hints: Array.isArray(doc.hints) ? doc.hints : [],
    suggestions: Array.isArray(doc.suggestions) ? doc.suggestions : [],
    rejected: Array.isArray(doc.rejected) ? doc.rejected : [],
    analysis: (doc.analysis as SceneEditorStored['analysis']) ?? emptyStored('').analysis,
  };
}

export function patchUi(
  stored: SceneEditorStored,
  patch: { lastTool?: EditorTool; snapMode?: SnapMode; layers?: Partial<AnalysisLayerVisibility> },
): SceneEditorStored {
  return {
    ...stored,
    ui: {
      ...stored.ui,
      ...patch,
      layers: { ...stored.ui.layers, ...(patch.layers ?? {}) },
    },
  };
}

export class Autosave {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: SceneEditorStored | null = null;

  constructor(
    private readonly write: (data: SceneEditorStored) => Promise<void>,
    private readonly delay = 400,
  ) {}

  queue(data: SceneEditorStored): void {
    this.pending = data;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flush();
    }, this.delay);
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const data = this.pending;
    this.pending = null;
    if (data) await this.write(data);
  }

  cancel(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pending = null;
  }
}
