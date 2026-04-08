/**
 * Mastery System powers use meters; Foundry scenes use grid.distance + grid.units (m, ft, …).
 * These helpers align highlight BFS steps and measurePath comparisons.
 *
 * **Tactical powers (utilities, zones on grid):** Stat values count as **grid spaces** (1:1):
 * e.g. Healing Pulse 16 m reach = 16 hex/square steps, radius 4 m = within 4 steps of center.
 * Use `isWithinMasteryPowerRange` / `masteryAoERadiusPixels` for that model.
 *
 * **Other helpers** (`metersToSceneDistance`, `isWithinRangeMeters`) try to reconcile SI-style
 * meters with the scene grid (ft/m) for ranged/melee previews.
 */
/** Scene distance equivalent to `rangeMeters` (same units as canvas.grid.measurePath / grid.distance). */
export declare function metersToSceneDistance(rangeMeters: number): number;
/**
 * BFS step count for highlightHexesInRange: how many grid spaces (edges) match `rangeMeters`.
 */
export declare function gridStepsFromMeters(rangeMeters: number): number;
/**
 * Fewest grid-adjacency steps between two canvas points (e.g. token centers), capped at `maxSteps`.
 * Matches the BFS model used by hex highlights so targeting cannot disagree with the painted range.
 */
export declare function gridStepsBetweenCenters(from: {
    x: number;
    y: number;
}, to: {
    x: number;
    y: number;
}, maxSteps: number): number | null;
/** Integer cap: stat "meters" = that many grid steps on the tactical map. */
export declare function masteryPowerMaxSteps(statMeters: number): number;
/**
 * True if `to` is within `statMeters` **grid steps** of `from` (BFS on hex/square grid).
 * Gridless: compares path distance to `statMeters * grid.distance`.
 */
export declare function isWithinMasteryPowerRange(from: {
    x: number;
    y: number;
}, to: {
    x: number;
    y: number;
}, statMeters: number): boolean;
/** Pixel radius for AoE disk: one stat unit ≈ one grid cell across. */
export declare function masteryAoERadiusPixels(radiusStat: number): number;
/** True if target is within `rangeMeters` by grid steps (same cap as range highlight) or scene path distance. */
export declare function isWithinRangeMeters(from: {
    x: number;
    y: number;
}, to: {
    x: number;
    y: number;
}, rangeMeters: number): boolean;
/** Distance between two canvas points in scene grid units (for comparison to metersToSceneDistance). */
export declare function measureSceneDistanceBetweenPoints(a: {
    x: number;
    y: number;
}, b: {
    x: number;
    y: number;
}): number;
//# sourceMappingURL=grid-range.d.ts.map