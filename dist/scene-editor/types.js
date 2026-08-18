/**
 * Shared types for the Mastery Scene Editor.
 * Native Foundry walls are the runtime source of truth; these types describe
 * editor overlays, hints, suggestions and the versioned scene-flag document.
 */
export const SCENE_EDITOR_FLAG = 'sceneEditor';
export const SCENE_EDITOR_WALL_FLAG = 'sceneEditorWall';
export const SCENE_EDITOR_SCHEMA_VERSION = 1;
export const SCENE_EDITOR_VERSION = '1.0.0';
export const DEFAULT_LAYER_VISIBILITY = {
    map: true,
    mask: false,
    lines: false,
    suggestions: true,
    confirmed: true,
    hints: true,
};
export function emptyStored(sceneId) {
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
//# sourceMappingURL=types.js.map