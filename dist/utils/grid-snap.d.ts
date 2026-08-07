/**
 * Foundry v12+ grid snapping helpers.
 *
 * `BaseGrid#getSnappedPosition` was removed after its deprecation window.
 * Prefer `getCenterPoint` / `getSnappedPoint` / `getTopLeftPoint`.
 */
export type WorldPoint = {
    x: number;
    y: number;
};
/** Snap a world point to the center of the containing grid space (AoE placement). */
export declare function snapWorldCenter(x: number, y: number): WorldPoint;
/** Snap a world point to the top-left of the containing grid space (token moves). */
export declare function snapWorldTopLeft(x: number, y: number): WorldPoint;
/** Resolve pointer event → canvas world coordinates (Pixi FederatedEvent safe). */
export declare function eventWorldPoint(ev: any): WorldPoint;
/** Best-effort PIXI container for temporary targeting overlays. */
export declare function resolveOverlayContainer(): any | null;
//# sourceMappingURL=grid-snap.d.ts.map