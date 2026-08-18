/**
 * PIXI overlay for suggestions, hints, handles and previews.
 * Native walls stay on Foundry's wall layer; we only draw editor chrome.
 */
import type { AnalysisDebug, AnalysisLayerVisibility, EditorWallView, Hint, Point, Segment, Suggestion } from './types.js';
export interface OverlayDrawState {
    walls: EditorWallView[];
    suggestions: Suggestion[];
    hints: Hint[];
    selectedIds: string[];
    selectedSuggestionIds: string[];
    selectedHintIds: string[];
    preview: Segment | null;
    snap: Point | null;
    hoverOpening: Segment | null;
    layers: AnalysisLayerVisibility;
    debug: AnalysisDebug | null;
    handleRadius: number;
}
export declare class SceneEditorOverlay {
    private root;
    private gfx;
    private maskSprite;
    get attached(): boolean;
    attach(): void;
    detach(): void;
    private clearMask;
    draw(state: OverlayDrawState): void;
    private drawKindMark;
    private drawHint;
    private drawMask;
    private stroke;
    private handles;
    private dot;
    private rect;
}
export declare function screenHandleRadius(): number;
export declare function worldFromEvent(event: PointerEvent | MouseEvent): Point | null;
export declare function hitHandle(p: Point, a: Point, b: Point, radius: number): 'a' | 'b' | null;
//# sourceMappingURL=overlay.d.ts.map