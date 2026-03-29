/**
 * Mastery System powers use meters; Foundry scenes use grid.distance + grid.units (m, ft, …).
 * These helpers align highlight BFS steps and measurePath comparisons.
 */
/** Scene distance equivalent to `rangeMeters` (same units as canvas.grid.measurePath / grid.distance). */
export function metersToSceneDistance(rangeMeters) {
    const u = String(canvas.scene?.grid?.units ?? "m").toLowerCase();
    if (u === "ft" || u === "feet" || u === "foot")
        return rangeMeters / 0.3048;
    if (u === "yd" || u === "yards" || u === "yard")
        return rangeMeters / 0.9144;
    if (u === "mi" || u === "miles" || u === "mile")
        return rangeMeters / 1609.34;
    return rangeMeters;
}
/**
 * BFS step count for highlightHexesInRange: how many grid spaces (edges) match `rangeMeters`.
 */
export function gridStepsFromMeters(rangeMeters) {
    const grid = canvas.grid;
    if (!grid || grid.type === CONST.GRID_TYPES.GRIDLESS) {
        return Math.max(1, Math.ceil(rangeMeters));
    }
    const perCell = Number(grid.distance) || 1;
    const sceneDist = metersToSceneDistance(rangeMeters);
    return Math.max(1, Math.ceil(sceneDist / perCell));
}
/** Distance between two canvas points in scene grid units (for comparison to metersToSceneDistance). */
export function measureSceneDistanceBetweenPoints(a, b) {
    const grid = canvas.grid;
    if (grid?.measurePath) {
        try {
            const path = grid.measurePath([a, b], {});
            if (path != null) {
                if (typeof path.distance === "number")
                    return path.distance;
                if (typeof path.total === "number")
                    return path.total;
                if (Array.isArray(path) && path.length > 0 && typeof path[0] === "number")
                    return path[0];
            }
        }
        catch {
            // fall through
        }
    }
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distPx = Math.hypot(dx, dy);
    const gridSize = grid?.size ?? 100;
    const gridUnits = distPx / gridSize;
    return gridUnits * (grid?.distance ?? 1);
}
//# sourceMappingURL=grid-range.js.map