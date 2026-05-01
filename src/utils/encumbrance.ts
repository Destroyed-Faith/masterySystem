/**
 * Encumbrance & Inventory-Grid Load helpers.
 *
 * Source: Players Guide 7546–7727.
 *
 *   • Inventory Grid is **24 × 9 squares**, divided into 3 zones of 8
 *     columns each:
 *       Zone 1 (cols 1..8)   = Normal Load
 *       Zone 2 (cols 9..16)  = Encumbered  (Movement −4 m)
 *       Zone 3 (cols 17..24) = Overloaded  (Movement −6 m)
 *   • Only the *highest occupied* zone matters.
 *   • Items spanning multiple zones inherit the highest zone they touch.
 *
 * The character-sheet UI currently splits the 24 × 9 grid into three
 * 24 × 9 visual bands (one per zone). The functions here treat any of
 * the two representations uniformly and return the canonical load zone +
 * movement penalty for use elsewhere in the system.
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
export const INVENTORY_GRID_COLS = 24;
export const INVENTORY_GRID_ROWS = 9;
export const ZONE_WIDTH_COLS = 8;

/** Movement penalties per zone (Players Guide 7575–7579). */
export const MOVEMENT_PENALTY_BY_ZONE: Record<LoadZone, number> = {
    normal: 0,
    encumbered: -4,
    overloaded: -6,
};

/** Highest column an item rect occupies (1-based, inclusive). */
function maxColumnOf(rect: PlacedItemRect): number {
    return rect.x + rect.w - 1;
}

/** Map a column index to its zone (1, 2, or 3). */
export function columnToZoneIndex(col: number): 1 | 2 | 3 {
    if (col <= ZONE_WIDTH_COLS) return 1;
    if (col <= ZONE_WIDTH_COLS * 2) return 2;
    return 3;
}

/** Convert a zone index to its load name. */
export function zoneIndexToLoad(idx: 1 | 2 | 3): LoadZone {
    return idx === 1 ? 'normal' : idx === 2 ? 'encumbered' : 'overloaded';
}

/**
 * Determine the highest occupied zone across an item collection placed
 * on the canonical 24 × 9 inventory grid.
 *
 * Empty inventories report `'normal'`.
 */
export function loadZoneFromRects(rects: readonly PlacedItemRect[]): LoadZone {
    let max: 1 | 2 | 3 = 1;
    for (const r of rects) {
        const z = columnToZoneIndex(maxColumnOf(r));
        if (z > max) max = z as 1 | 2 | 3;
    }
    return zoneIndexToLoad(max);
}

/**
 * Legacy 3-band representation: when the UI splits the grid into a
 * Normal / Encumbered / Overloaded band, this helper picks the highest
 * non-empty band as the load zone.
 */
export function loadZoneFromBands(opts: {
    normalCount: number;
    encumberedCount: number;
    overloadedCount: number;
}): LoadZone {
    if (opts.overloadedCount > 0) return 'overloaded';
    if (opts.encumberedCount > 0) return 'encumbered';
    return 'normal';
}

/** Return the movement penalty (in meters, ≤ 0) for a load zone. */
export function movementPenaltyForLoad(zone: LoadZone): number {
    return MOVEMENT_PENALTY_BY_ZONE[zone];
}

/**
 * Compute the effective base movement after applying the load penalty.
 * Floors at 0 — actors are never moved into negative speed.
 */
export function applyEncumbranceToMovement(baseMovementM: number, zone: LoadZone): number {
    const penalty = movementPenaltyForLoad(zone);
    return Math.max(0, baseMovementM + penalty);
}
