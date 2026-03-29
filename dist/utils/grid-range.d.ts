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
/** Distance between two canvas points in scene grid units (for comparison to metersToSceneDistance). */
export declare function measureSceneDistanceBetweenPoints(a: {
    x: number;
    y: number;
}, b: {
    x: number;
    y: number;
}): number;
//# sourceMappingURL=grid-range.d.ts.map