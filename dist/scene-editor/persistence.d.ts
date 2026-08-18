/**
 * Versioned scene flags, autosave, and portable JSON for one map.
 */
import type { AnalysisLayerVisibility, EditorTool, Hint, PortableSceneDocument, SceneEditorStored, SnapMode, Suggestion } from './types.js';
import type { Point } from './types.js';
export declare function migrateStored(raw: unknown, sceneId: string): SceneEditorStored;
export declare function readStored(scene: any): SceneEditorStored;
export declare function writeStored(scene: any, data: SceneEditorStored): Promise<void>;
export declare function backgroundFingerprint(scene: any): {
    src: string;
    width: number;
    height: number;
    fingerprint: string;
};
export declare function sceneBox(scene: any): {
    origin: Point;
    size: Point;
};
export declare function applyBackgroundWatch(stored: SceneEditorStored, scene: any): SceneEditorStored;
export declare function toPortable(stored: SceneEditorStored, sceneName: string, geometry: PortableSceneDocument['geometry'], origin: Point, size: Point): PortableSceneDocument;
export declare function fromPortable(doc: PortableSceneDocument, origin: Point, size: Point): {
    hints: Hint[];
    suggestions: Suggestion[];
    rejected: string[];
    geometry: PortableSceneDocument['geometry'];
};
export declare function parsePortable(raw: unknown): PortableSceneDocument | null;
export declare function patchUi(stored: SceneEditorStored, patch: {
    lastTool?: EditorTool;
    snapMode?: SnapMode;
    layers?: Partial<AnalysisLayerVisibility>;
}): SceneEditorStored;
export declare class Autosave {
    private readonly write;
    private readonly delay;
    private timer;
    private pending;
    constructor(write: (data: SceneEditorStored) => Promise<void>, delay?: number);
    queue(data: SceneEditorStored): void;
    flush(): Promise<void>;
    cancel(): void;
}
//# sourceMappingURL=persistence.d.ts.map