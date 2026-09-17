/**
 * Global hit-blocker probe — finds invisible layers that steal hover/clicks.
 *
 * Enable (GM):
 *   - Keyboard: Ctrl+Alt+H
 *   - Console: game.masteryHitProbe.enable() / .disable() / .toggle()
 *
 * While on:
 *   - HUD lists elementsFromPoint under the cursor (tag, id, pe, z-index, size)
 *   - Suspicious overlays get a red outline (large / transparent / pe:auto)
 *   - Every click logs who RECEIVED the event vs who is TOP under the pointer
 */
export interface HitSample {
    tag: string;
    id: string;
    className: string;
    pointerEvents: string;
    zIndex: string;
    opacity: string;
    width: number;
    height: number;
    area: number;
    suspicious: boolean;
    reason: string | null;
    el: Element;
}
export declare function sampleHitStack(x: number, y: number, limit?: number): HitSample[];
export declare class HitBlockerProbe {
    private enabled;
    private hud;
    private lastKey;
    private lastAt;
    private readonly minIntervalMs;
    private onMove;
    private onClick;
    private onKey;
    get isEnabled(): boolean;
    bindHotkey(): void;
    enable(): void;
    disable(): void;
    toggle(): void;
    /** Dump stack at a point without leaving the probe on. */
    dumpAt(x: number, y: number): HitSample[];
    private ensureHud;
    private clearOutlines;
    private handleMove;
    private handleClick;
}
export declare function getHitBlockerProbe(): HitBlockerProbe;
export declare function initializeHitBlockerProbe(): void;
//# sourceMappingURL=hit-blocker-probe.d.ts.map