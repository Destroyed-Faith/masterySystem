/**
 * Owns the edit session: tool, selection, drawing, analysis, persistence.
 */
import { CommandStack } from './commands.js';
import { SceneEditorOverlay } from './overlay.js';
import { SceneEditorPointer } from './pointer.js';
import type { AnalysisLayerVisibility, DoorState, EditorStatus, EditorTool, EditorWallView, GeometryKind, Hint, HintKind, Point, SceneEditorStored, Segment, SnapMode, Suggestion } from './types.js';
export declare class SceneEditorController {
    readonly overlay: SceneEditorOverlay;
    readonly commands: CommandStack;
    readonly pointer: SceneEditorPointer;
    private toolbar;
    private autosave;
    private tokensInteractive;
    private abort;
    private lastDebug;
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
    setLayer(key: keyof AnalysisLayerVisibility, value: boolean): void;
    snap(p: Point): {
        point: Point;
        kind: string;
    };
    onPointerMove(event: PointerEvent): void;
    onPointerDown(event: PointerEvent): Promise<void>;
    onPointerUp(event: PointerEvent): Promise<void>;
    onDoubleClick(): Promise<void>;
    onKey(event: KeyboardEvent): void;
    onKeyUp(event: KeyboardEvent): void;
    finishChain(): void;
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