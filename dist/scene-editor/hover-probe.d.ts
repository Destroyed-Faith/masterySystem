/**
 * Temporary GM-only hit-test HUD. Opt-in via the Scene Editor toolbar.
 * Shows what document.elementsFromPoint returns under the cursor so chrome
 * overlays (e.g. Application .window-content) can be diagnosed quickly.
 */
export interface HoverProbeSample {
    tag: string;
    id: string;
    className: string;
    zIndex: string;
    pointerEvents: string;
    width: number;
    height: number;
    flagged: string | null;
}
export declare function sampleElementsFromPoint(x: number, y: number, limit?: number): HoverProbeSample[];
export declare class HoverProbe {
    private enabled;
    private hud;
    private lastTopKey;
    private lastAt;
    private readonly minIntervalMs;
    get isEnabled(): boolean;
    setEnabled(on: boolean): void;
    destroy(): void;
    onPointerMove(event: PointerEvent): void;
    private ensureHud;
    private hide;
    private renderHud;
}
//# sourceMappingURL=hover-probe.d.ts.map