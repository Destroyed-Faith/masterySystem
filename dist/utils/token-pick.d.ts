/**
 * Pick the token the user most likely meant under a canvas point / pointer event.
 *
 * Coordinate priority (Foundry v13):
 * 1. PIXI event-target Token (walk parents)
 * 2. `canvas.canvasCoordinatesFromClient(clientX/Y)` from the real click
 * 3. `event.getLocalPosition(canvas.stage)` / stage.toLocal(global)
 *
 * Do **not** prefer `canvas.mousePosition` — it can lag behind the click when the
 * event was captured by a stage overlay (rings/highlights), which caused distant
 * clicks to resolve as a nearby token (e.g. always Fynn).
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
    fromClient: {
        x: number;
        y: number;
    } | null;
    stageLocal: {
        x: number;
        y: number;
    } | null;
    mousePosition: {
        x: number;
        y: number;
    } | null;
    fromEventTarget: string | null;
    boundsHits: Array<{
        id: string;
        name: string;
        dist: number;
    }>;
    nearestAll: Array<{
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
/** Best canvas-space point for a pointer event (never trusts stale mousePosition alone). */
export declare function pointerEventCanvasPoint(ev?: any): {
    world: {
        x: number;
        y: number;
    };
    fromClient: {
        x: number;
        y: number;
    } | null;
    stageLocal: {
        x: number;
        y: number;
    } | null;
    mousePosition: {
        x: number;
        y: number;
    } | null;
    source: string;
};
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