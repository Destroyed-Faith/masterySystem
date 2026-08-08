/**
 * Pick the token the user most likely meant under a canvas point.
 *
 * Foundry `placeables` order is not paint/z order. Returning the first
 * `bounds.contains` hit often selects a token behind another when they
 * overlap — classic "I clicked Sjossfur but got Alaris" bug.
 *
 * Preference:
 * 1. Tokens whose bounds contain the point
 * 2. Among those, closest click → token center
 * 3. Higher zIndex / later placeables index as tie-break (topmost)
 * 4. Optional fallback: nearest center within a small pad radius
 */
export type TokenPickOptions = {
    /** Skip these token ids (usually the attacker). */
    excludeIds?: Iterable<string>;
    /** When set, only these token ids are eligible. */
    onlyIds?: Iterable<string> | Set<string>;
    /** Soft center-radius fallback when no bounds hit (default 15 px pad). */
    centerPadPx?: number;
    /** Disable soft radius fallback. */
    noCenterFallback?: boolean;
};
/**
 * Best token under canvas-stage local coordinates `(x, y)`.
 */
export declare function pickTokenAtPoint(x: number, y: number, options?: TokenPickOptions): any | null;
/** Convenience: resolve stage-local point from a FederatedPointerEvent, then pick. */
export declare function pickTokenFromPointerEvent(ev: PIXI.FederatedPointerEvent, options?: TokenPickOptions): any | null;
//# sourceMappingURL=token-pick.d.ts.map