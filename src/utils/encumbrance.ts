/**
 * Encumbrance & Inventory-Grid Load helpers.
 *
 * Source: Players Guide 7546–7727.
 *
 *   • Inventory Grid is **24 × 9 squares**, divided into 3 zones of 8
 *     columns each:
 *       Zone 1 (cols 1..8)   = Normal Load
 *       Zone 2 (cols 9..16)  = Encumbered  (Movement −4 m, dice pool −20 %)
 *       Zone 3 (cols 17..24) = Heavy Load  (Movement −6 m, dice pool −50 %)
 *   • Only the *highest occupied* zone matters.
 *   • Items spanning multiple zones inherit the highest zone they touch.
 *
 * The character-sheet UI renders three equal 8 × 9 bands (Normal /
 * Encumbered / Heavy Load). Dice-pool penalties apply to **all rolls**
 * and stack additively with health penalties (both as % of the same base
 * pool); the final pool may reach 0.
 */

import { getCurrentPenalty } from './calculations.js';

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

/** Dice-pool penalty (% of base pool, floored) per load zone. */
export const DICE_POOL_PENALTY_PERCENT_BY_ZONE: Record<LoadZone, number> = {
    normal: 0,
    encumbered: 20,
    overloaded: 50,
};

export const LOAD_ZONE_LABEL: Record<LoadZone, string> = {
    normal: 'Normal Load',
    encumbered: 'Encumbered',
    overloaded: 'Heavy Load',
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

/** Floored dice removed from a pool due to encumbrance (0 when zone is normal). */
export function dicePoolPenaltyFromLoadZone(zone: LoadZone, pool: number): number {
    const pct = DICE_POOL_PENALTY_PERCENT_BY_ZONE[zone] ?? 0;
    const base = Math.max(0, Math.floor(Number(pool) || 0));
    if (pct <= 0 || base <= 0) return 0;
    return Math.floor(base * pct / 100);
}

/**
 * Highest load zone from inventory-band flags on an actor's items.
 * Only items in the carry grid (`container: 'inventory'`) count.
 */
export function getActorInventoryLoadZone(actor: { items: Iterable<any> }): LoadZone {
    let encumberedCount = 0;
    let overloadedCount = 0;
    for (const item of actor.items) {
        const flags =
            item.getFlag?.('mastery-system', 'equipment')
            ?? item.flags?.['mastery-system']?.equipment
            ?? {};
        if (flags.weaponSetPrepared === true) continue;
        if (flags.container !== 'inventory') continue;
        if (flags.slot) continue;
        if (flags.consumableSlot != null && Number.isFinite(Number(flags.consumableSlot))) continue;
        const band = flags.band ?? 'not';
        if (band === 'heavy') overloadedCount++;
        else if (band === 'enc') encumberedCount++;
    }
    return loadZoneFromBands({ normalCount: 0, encumberedCount, overloadedCount });
}

export interface PoolPenaltyResult {
    numDice: number;
    healthPenaltyDice: number;
    encumbrancePenaltyDice: number;
    loadZone: LoadZone;
}

/**
 * Apply health and encumbrance penalties to a dice pool. Both are computed as
 * percentages of the same `basePool` and subtracted additively; result floors
 * at 0 (encumbrance can zero the pool when stacked with wounds).
 */
export function applyHealthAndEncumbrancePenalties(
    basePool: number,
    actor: { items: Iterable<any>; system?: any },
): PoolPenaltyResult {
    const pool = Math.max(0, Math.floor(Number(basePool) || 0));
    const loadZone = getActorInventoryLoadZone(actor);
    const healthBars = actor.system?.health?.bars || [];
    const currentBar = actor.system?.health?.currentBar ?? 0;
    const healthPenalty = getCurrentPenalty(healthBars, currentBar, pool);
    const healthPenaltyDice = healthPenalty < 0 ? -healthPenalty : 0;
    const encumbrancePenaltyDice = dicePoolPenaltyFromLoadZone(loadZone, pool);
    const numDice = Math.max(0, pool - healthPenaltyDice - encumbrancePenaltyDice);
    return { numDice, healthPenaltyDice, encumbrancePenaltyDice, loadZone };
}

/**
 * Compute the effective base movement after applying the load penalty.
 * Floors at 0 — actors are never moved into negative speed.
 */
export function applyEncumbranceToMovement(baseMovementM: number, zone: LoadZone): number {
    const penalty = movementPenaltyForLoad(zone);
    return Math.max(0, baseMovementM + penalty);
}
