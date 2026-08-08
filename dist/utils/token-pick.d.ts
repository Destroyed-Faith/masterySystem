/**
 * Pick the token the user most likely meant under a canvas point.
 *
 * Foundry `placeables` order is not paint/z order. Returning the first
 * `bounds.contains` hit often selects a token behind another when they
 * overlap.
 *
 * Preference:
 * 1. Token recovered by walking the PIXI event target tree (most reliable)
 * 2. Tokens whose bounds contain the point — closest center, then topmost
 * 3. Soft center-radius fallback
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
export type TokenPickDebug = {
    world: {
        x: number;
        y: number;
    };
    mousePosition: {
        x: number;
        y: number;
    } | null;
    stageLocal: {
        x: number;
        y: number;
    } | null;
    fromEventTarget: string | null;
    boundsHits: Array<{
        id: string;
        name: string;
        dist: number;
    }>;
    picked: string | null;
    pickReason: string;
};
/** Walk PIXI parent chain from the event target to find a Token placeable. */
export declare function tokenFromEventTarget(ev: any): any | null;
/** True when the pointer event landed on (or inside) a Token placeable. */
export declare function pointerEventIsOnToken(ev: any): boolean;
/**
 * Best token under canvas coordinates `(x, y)`.
 */
export declare function pickTokenAtPoint(x: number, y: number, options?: TokenPickOptions): any | null;
/**
 * Resolve pointer → token with debug metadata.
 * Prefers the PIXI event-target token when eligible.
 */
export declare function pickTokenFromPointerEvent(ev: PIXI.FederatedPointerEvent | any, options?: TokenPickOptions, outDebug?: TokenPickDebug): any | null;
//# sourceMappingURL=token-pick.d.ts.map