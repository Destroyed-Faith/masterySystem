/**
 * Foundry V13 – Reliable Hex Range Highlight
 * - Uses grid.getOffset(token.center) => {i,j}
 * - BFS via grid.getAdjacentOffsets / grid.getNeighbors
 * - Draws via canvas.interface.grid.highlightPosition(layerId, {x,y,color,alpha})
 * - Uses grid.getTopLeftPoint(offsetObj) where offsetObj is {i,j}
 */
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
    const start = (startRaw?.i !== undefined && startRaw?.j !== undefined)
        ? { i: Number(startRaw.i), j: Number(startRaw.j) }
        : null;
    console.log("[MS][HL] start", {
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
    console.log("[MS][HL] total", { hexes: all.length });
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
    console.log("[MS][HL] done", { highlighted, tlFail });
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
    const start = startRaw?.i !== undefined && startRaw?.j !== undefined
        ? { i: Number(startRaw.i), j: Number(startRaw.j) }
        : null;
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
//# sourceMappingURL=hex-highlighting.js.map