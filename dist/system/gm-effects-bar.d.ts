/**
 * Client settings for the floating GM Effects bar (Manage Effects mode).
 */
export declare const GM_EFFECTS_BAR_COLLAPSED_SETTING = "gmEffectsBarCollapsed";
export declare const GM_EFFECTS_BAR_POSITION_SETTING = "gmEffectsBarPosition";
export interface GmEffectsBarPosition {
    x: number;
    y: number;
}
export declare const DEFAULT_GM_EFFECTS_BAR_POSITION: GmEffectsBarPosition;
export declare function sanitizeGmEffectsBarPosition(raw: unknown): GmEffectsBarPosition;
export declare function clampGmEffectsBarPosition(pos: GmEffectsBarPosition, viewport: {
    width: number;
    height: number;
}, size: {
    width: number;
    height: number;
}): GmEffectsBarPosition;
export declare function registerGmEffectsBarSettings(): void;
export declare function readGmEffectsBarCollapsed(): boolean;
export declare function setGmEffectsBarCollapsed(collapsed: boolean): Promise<void>;
export declare function readGmEffectsBarPosition(): GmEffectsBarPosition;
export declare function setGmEffectsBarPosition(pos: GmEffectsBarPosition): Promise<void>;
//# sourceMappingURL=gm-effects-bar.d.ts.map