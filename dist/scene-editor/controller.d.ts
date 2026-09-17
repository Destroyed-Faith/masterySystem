/**
 * Owns the edit session: tool, selection, drawing, analysis, persistence.
 */
import { CommandStack } from './commands.js';
import { HoverProbe } from './hover-probe.js';
import { SceneEditorOverlay } from './overlay.js';
import { SceneEditorPointer } from './pointer.js';
import type { AnalysisLayerVisibility, DoorState, EditorStatus, EditorTool, EditorWallView, GeometryKind, Hint, HintKind, Point, SceneEditorStored, Segment, SnapMode, Suggestion } from './types.js';
export declare class SceneEditorController {
    readonly overlay: SceneEditorOverlay;
    readonly commands: CommandStack;
    readonly pointer: SceneEditorPointer;
    readonly hoverProbe: HoverProbe;
    private toolbar;
    private autosave;
    private tokensInteractive;
    private abort;
    private lastDebug;
    private captureEl;
    private capturePointerId;
    /** Last snapped world point from move/down — used when pointerup lacks coordinates. */
    private lastWorld;
    active: boolean;
    tool: EditorTool;
    snapMode: SnapMode;
    status: EditorStatus;
    stored: SceneEditorStored;
    selectedIds: string[];
    selectedSuggestionIds: string[];
    selectedHintIds: string[];
    drawStart: Point | null;
    preview: Segment | null;
    snapPoint: Point | null;
    hoverOpening: Segment | null;
    dragging: {
        kind: 'endpoint' | 'body' | 'hint';
        id: string;
        which?: 'a' | 'b';
        origin: Point;
        start: Segment | Hint;
    } | null;
    openingDraft: {
        wallId: string;
        center: Point;
        width: number;
        kind: 'door' | 'window';
    } | null;
    shiftHeld: boolean;
    altHeld: boolean;
    liveSyncNoted: boolean;
    hoverProbeEnabled: boolean;
    get walls(): EditorWallView[];
    get layers(): AnalysisLayerVisibility;
    get confirmedSegments(): Segment[];
    get suggestionSegments(): Segment[];
    effectiveSnap(): SnapMode;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    teardownCanvas(): void;
    reattach(): Promise<void>;
    refreshButton(): void;
    setTool(tool: EditorTool): void;
    setSnap(mode: SnapMode): void;
    setHoverProbe(on: boolean): void;
    setLayer(key: keyof AnalysisLayerVisibility, value: boolean): void;
    snap(p: Point): {
        point: Point;
        kind: string;
    };
    onPointerMove(event: PointerEvent): void;
    onPointerDown(event: PointerEvent): Promise<void>;
    onPointerUp(event: PointerEvent): Promise<void>;
    onPointerCancel(event: PointerEvent): Promise<void>;
    onDoubleClick(): Promise<void>;
    onKey(event: KeyboardEvent): void;
    onKeyUp(event: KeyboardEvent): void;
    finishChain(): void;
    private acquirePointerCapture;
    private releasePointerCapture;
    private beginSelect;
    private applyDrag;
    private finishDrag;
    createSegment(a: Point, b: Point, kind: GeometryKind): Promise<void>;
    commitOpening(wallId: string, center: Point, width: number, kind: 'door' | 'window'): Promise<void>;
    convertSelection(kind: GeometryKind): Promise<void>;
    setDoorState(state: DoorState): Promise<void>;
    deleteSelection(): Promise<void>;
    addHint(kind: HintKind, a: Point, b: Point): Promise<void>;
    analyze(opts?: {
        region?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }): Promise<void>;
    cancelAnalyze(): void;
    acceptSuggestions(ids: string[]): Promise<void>;
    rejectSuggestions(ids: string[]): Promise<void>;
    acceptAll(): Promise<void>;
    saveNow(): Promise<void>;
    exportJson(): Promise<void>;
    /** GM export describing how prepared walls/doors are structured (learning JSON). */
    exportWallLesson(): Promise<void>;
    importJson(): Promise<void>;
    openAdvanced(): void;
    undo(): Promise<void>;
    redo(): Promise<void>;
    redraw(): void;
    selectedWall(): EditorWallView | null;
    selectedSuggestion(): Suggestion | null;
    private nearestWall;
    private nearestSuggestion;
    private nearestHint;
    private openingPreview;
    private matchesRejected;
    private queueSave;
    private markDirtyThenSaved;
    private suppressTokens;
    private askHintKind;
    private askReanalyze;
    private askImportMode;
    private confirmDanger;
    private pickJsonFile;
}
export declare function getSceneEditor(): SceneEditorController;
//# sourceMappingURL=controller.d.ts.map