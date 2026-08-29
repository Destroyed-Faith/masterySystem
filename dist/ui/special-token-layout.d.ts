/**
 * Pure layout helpers for the diminishing-special token HUD.
 * Actor stack values stay on the actor; this only places token *views*.
 */
/** Max tokens stacked in one tower. Flip to 4 when testing shorter piles. */
export declare const SPECIAL_TOKEN_STACK_MAX = 8;
export declare const TOKEN_DRAG_THRESHOLD_PX = 5;
export interface TokenLayoutPos {
    x: number;
    y: number;
    z: number;
}
export interface SpecialTokenSpec {
    id: string;
    value: number;
    label: string;
}
export interface SpecialTokenView {
    id: string;
    specialId: string;
    index: number;
    label: string;
    asset: string;
    x: number;
    y: number;
    z: number;
}
export type SpecialTokenLayoutMap = Record<string, TokenLayoutPos>;
export declare function tokenInstanceId(specialId: string, index: number): string;
export declare function parseTokenInstanceId(id: string): {
    specialId: string;
    index: number;
} | null;
/** Auto-arrange into per-special towers (relative 0–1 coords). */
export declare function autoArrangeTokens(specials: SpecialTokenSpec[], stackMax?: number): SpecialTokenLayoutMap;
/**
 * Rebuild views from actor values + stored positions.
 * Keeps existing tokens; drops highest indices when the value shrinks;
 * parks new tokens next to the same Special.
 */
export declare function syncSpecialTokenViews(specials: SpecialTokenSpec[], stored: SpecialTokenLayoutMap | null | undefined, stackMax?: number): {
    tokens: SpecialTokenView[];
    layout: SpecialTokenLayoutMap;
};
export declare function moveTokenInLayout(layout: SpecialTokenLayoutMap, tokenId: string, x: number, y: number): SpecialTokenLayoutMap;
export declare function clampTokenToArea(xPx: number, yPx: number, areaW: number, areaH: number, tokenPx?: number): {
    x: number;
    y: number;
};
//# sourceMappingURL=special-token-layout.d.ts.map