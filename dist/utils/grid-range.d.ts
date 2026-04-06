/**
 * Mastery System powers use meters; Foundry scenes use grid.distance + grid.units (m, ft, …).
 * These helpers align highlight BFS steps and measurePath comparisons.
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