/**
 * Foundry V13 – Reliable Hex Range Highlight
 * - Uses grid.getOffset(token.center) => {i,j}
 * - BFS via grid.getAdjacentOffsets / grid.getNeighbors
 * - Draws via canvas.interface.grid.highlightPosition(layerId, {x,y,color,alpha})
 * - Uses grid.getTopLeftPoint(offsetObj) where offsetObj is {i,j}
 */
import { log } from './logger.js';
/** Normalize grid.getOffset() (hex i,j, square col/row, or x,y) to {i,j} for BFS + getTopLeftPoint. */
function pixelOffsetToIJ(raw) {
    if (!raw)
        return null;
    if (raw.i !== undefined && raw.j !== undefined)
        return { i: Number(raw.i), j: Number(raw.j) };
    if (raw.col !== undefined && raw.row !== undefined)
        return { i: Number(raw.col), j: Number(raw.row) };
    if (raw.x !== undefined && raw.y !== undefined)
        return { i: Number(raw.x), j: Number(raw.y) };
    return null;
}
function getNeighborFn(grid) {
    if (typeof grid.getAdjacentOffsets === "function")
        return (o) => grid.getAdjacentOffsets(o) ?? [];
    if (typeof grid.getNeighbors === "function")
        return (o) => grid.getNeighbors(o) ?? [];
    return null;
}
function toIJ(n) {
    if (n?.i !== undefined && n?.j !== undefined)
        return { i: Number(n.i), j: Number(n.j) };
    if (n?.offset?.i !== undefined && n?.offset?.j !== undefined)
        return { i: Number(n.offset.i), j: Number(n.offset.j) };
    return null;
}
const ijKey = (o) => `${o.i},${o.j}`;
/** BFS: all hex offsets within exactly `rangeSteps` adjacency steps from `start` (inclusive). */
function collectHexOffsetsWithinSteps(start, rangeSteps, getNeighbors, keyFn) {
    const visited = new Set([keyFn(start)]);
    let frontier = [start];
    const all = [start];
    for (let step = 1; step <= rangeSteps; step++) {
        const next = [];
        for (const o of frontier) {
            for (const n of getNeighbors(o)) {
                const cand = toIJ(n);
                if (!cand)
                    continue;
                const k = keyFn(cand);
                if (visited.has(k))
                    continue;
                visited.add(k);
                next.push(cand);
                all.push(cand);
            }
        }
        frontier = next;
    }
    return all;
}
export function highlightHexesInRange(tokenId, rangeUnits, highlightLayerId, color = 0x00ff00, alpha = 0.35) {
    const token = canvas.tokens.get(tokenId);
    if (!token) {
        console.warn("MS | highlightHexesInRange: Token not found", tokenId);
        return;
    }
    const grid = canvas.grid;
    const gridUI = canvas.interface?.grid;
    if (!grid || !gridUI) {
        console.warn("MS | highlightHexesInRange: grid/gridUI missing", { grid: !!grid, gridUI: !!gridUI });
        return;
    }
    const RANGE = Math.max(0, Math.floor(Number(rangeUnits)));
    if (!Number.isFinite(RANGE))
        return;
    const startRaw = grid.getOffset(token.center);
    const start = pixelOffsetToIJ(startRaw);
    log.debug("[MS][HL] start", {
        tokenId,
        tokenName: token.name,
        RANGE,
        gridType: grid.type,
        gridSize: grid.size,
        start: startRaw
    });
    if (!start) {
        console.error("[MS][HL] getOffset failed (expected {i,j})", startRaw);
        return;
    }
    const getNeighbors = getNeighborFn(grid);
    if (!getNeighbors) {
        console.error("[MS][HL] No neighbor API found on grid (getAdjacentOffsets/getNeighbors)");
        return;
    }
    const all = collectHexOffsetsWithinSteps(start, RANGE, getNeighbors, ijKey);
    log.debug("[MS][HL] total", { hexes: all.length });
    // Highlight layer (the reliable way you already used successfully)
    gridUI.addHighlightLayer?.(highlightLayerId);
    gridUI.clearHighlightLayer?.(highlightLayerId);
    let highlighted = 0;
    let tlFail = 0;
    for (const o of all) {
        const tl = grid.getTopLeftPoint(o);
        if (!tl || tl.x === undefined || tl.y === undefined) {
            tlFail++;
            continue;
        }
        gridUI.highlightPosition?.(highlightLayerId, { x: tl.x, y: tl.y, color, alpha });
        highlighted++;
    }
    log.debug("[MS][HL] done", { highlighted, tlFail });
}
/** Hex keys (`"i,j"`) reachable from the token in `rangeSteps` BFS steps (same rules as `highlightHexesInRange`). */
export function collectHexKeysInRangeForToken(tokenId, rangeSteps) {
    const token = canvas.tokens.get(tokenId);
    if (!token)
        return null;
    const grid = canvas.grid;
    if (!grid)
        return null;
    const RANGE = Math.max(0, Math.floor(Number(rangeSteps)));
    if (!Number.isFinite(RANGE))
        return null;
    const startRaw = grid.getOffset(token.center);
    const start = pixelOffsetToIJ(startRaw);
    if (!start)
        return null;
    const getNeighbors = getNeighborFn(grid);
    if (!getNeighbors)
        return null;
    const all = collectHexOffsetsWithinSteps(start, RANGE, getNeighbors, ijKey);
    return new Set(all.map(ijKey));
}
/** Darken cells that are both in movement range and occupied by others (tabu destinations). */
export function highlightTabuHexesOnLayer(highlightLayerId, tabuHexKeys, reachableHexKeys, color = 0x992222, alpha = 0.55) {
    const grid = canvas.grid;
    const gridUI = canvas.interface?.grid;
    if (!grid || !gridUI)
        return;
    for (const k of tabuHexKeys) {
        if (!reachableHexKeys.has(k))
            continue;
        const parts = k.split(",");
        const i = Number(parts[0]);
        const j = Number(parts[1]);
        if (!Number.isFinite(i) || !Number.isFinite(j))
            continue;
        const tl = grid.getTopLeftPoint({ i, j });
        if (!tl || tl.x === undefined || tl.y === undefined)
            continue;
        gridUI.highlightPosition?.(highlightLayerId, { x: tl.x, y: tl.y, color, alpha });
    }
}
export function clearHexHighlight(highlightLayerId) {
    const gridUI = canvas.interface?.grid;
    gridUI?.clearHighlightLayer?.(highlightLayerId);
}
/**
 * Highlight all grid cells within `rangeSteps` adjacency steps of a canvas point (AoE center, etc.).
 * Uses the same v13 API as ranged/melee (`highlightPosition` + `getTopLeftPoint({i,j})`).
 */
export function highlightHexesWithinStepsFromPoint(center, rangeSteps, highlightLayerId, color = 0x66aaff, alpha = 0.35) {
    const grid = canvas.grid;
    const gridUI = canvas.interface?.grid;
    if (!grid || !gridUI || grid.type === CONST.GRID_TYPES.GRIDLESS)
        return;
    const RANGE = Math.max(0, Math.floor(Number(rangeSteps)));
    if (!Number.isFinite(RANGE))
        return;
    const startRaw = grid.getOffset(center);
    const start = pixelOffsetToIJ(startRaw);
    if (!start)
        return;
    const getNeighbors = getNeighborFn(grid);
    if (!getNeighbors)
        return;
    const all = collectHexOffsetsWithinSteps(start, RANGE, getNeighbors, ijKey);
    gridUI.addHighlightLayer?.(highlightLayerId);
    gridUI.clearHighlightLayer?.(highlightLayerId);
    for (const o of all) {
        const tl = grid.getTopLeftPoint(o);
        if (!tl || tl.x === undefined || tl.y === undefined)
            continue;
        gridUI.highlightPosition?.(highlightLayerId, { x: tl.x, y: tl.y, color, alpha });
    }
}
//# sourceMappingURL=hex-highlighting.js.map