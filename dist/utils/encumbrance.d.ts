/**
 * Encumbrance & Inventory-Grid Load helpers.
 *
 * Source: Players Guide "Inventory Grid & Load".
 *
 *   • Inventory Grid is **24 × 9 squares**, divided into 3 zones of 8
 *     columns each:
 *       Zone 1 (cols 1..8)   = Normal Load
 *       Zone 2 (cols 9..16)  = Encumbered  (Movement −4 m)
 *       Zone 3 (cols 17..24) = Overloaded  (Movement −6 m)
 *   • Only the *highest occupied* zone matters.
 *   • Items spanning multiple zones inherit the highest zone they touch.
 *
 * Load affects Movement only — there is NO dice-pool penalty from
 * encumbrance in the current rulebook. (Dropping the load costs 1 Attack
 * Action when Encumbered, 2 when Overloaded.)
 */
export type LoadZone = 'normal' | 'encumbered' | 'overloaded';
export interface PlacedItemRect {
    /** 1-based column of the top-left cell. */
    x: number;
    /** 1-based row of the top-left cell. */
    y: number;
    /** Cell width. */
    w: number;
    /** Cell height. */
    h: number;
}
/** Total inventory grid columns / rows / per-zone width. */
export declare const INVENTORY_GRID_COLS = 24;
export declare const INVENTORY_GRID_ROWS = 9;
export declare const ZONE_WIDTH_COLS = 8;
/** Movement penalties per zone (Players Guide load table). */
export declare const MOVEMENT_PENALTY_BY_ZONE: Record<LoadZone, number>;
export declare const LOAD_ZONE_LABEL: Record<LoadZone, string>;
/** Map a column index to its zone (1, 2, or 3). */
export declare function columnToZoneIndex(col: number): 1 | 2 | 3;
/** Convert a zone index to its load name. */
export declare function zoneIndexToLoad(idx: 1 | 2 | 3): LoadZone;
/**
 * Determine the highest occupied zone across an item collection placed
 * on the canonical 24 × 9 inventory grid.
 *
 * Empty inventories report `'normal'`.
 */
export declare function loadZoneFromRects(rects: readonly PlacedItemRect[]): LoadZone;
/**
 * Legacy 3-band representation: when the UI splits the grid into a
 * Normal / Encumbered / Overloaded band, this helper picks the highest
 * non-empty band as the load zone.
 */
export declare function loadZoneFromBands(opts: {
    normalCount: number;
    encumberedCount: number;
    overloadedCount: number;
}): LoadZone;
/** Return the movement penalty (in meters, ≤ 0) for a load zone. */
export declare function movementPenaltyForLoad(zone: LoadZone): number;
/**
 * Highest load zone from inventory-band flags on an actor's items.
 * Only items in the carry grid (`container: 'inventory'`) count.
 */
export declare function getActorInventoryLoadZone(actor: {
    items: Iterable<any>;
}): LoadZone;
export interface PoolPenaltyResult {
    numDice: number;
    healthPenaltyDice: number;
    loadZone: LoadZone;
}
/**
 * Apply the Health percentage penalty to a dice pool. Encumbrance affects
 * Movement only (no dice-pool reduction in the current rulebook); the load
 * zone is still reported for UI display.
 */
export declare function applyHealthAndEncumbrancePenalties(basePool: number, actor: {
    items: Iterable<any>;
    system?: any;
}): PoolPenaltyResult;
/**
 * Compute the effective base movement after applying the load penalty.
 * Floors at 0 — actors are never moved into negative speed.
 */
export declare function applyEncumbranceToMovement(baseMovementM: number, zone: LoadZone): number;
//# sourceMappingURL=encumbrance.d.ts.map