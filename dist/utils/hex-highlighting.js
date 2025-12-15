/**
 * Hex Highlighting Utilities
 * Uses BFS (Breadth-First Search) to find and highlight hex fields within range
 */
function normalizeOffset(o) {
    const cand = o?.offset ? o.offset : o;
    if (!cand)
        return null;
    const col = cand.col ?? cand.i ?? cand.x ?? cand.q;
    const row = cand.row ?? cand.j ?? cand.y ?? cand.r;
    if (typeof col !== "number" || typeof row !== "number")
        return null;
    return { col, row };
}
/**
 * Highlight hex fields within range using BFS algorithm
 * @param tokenId - The ID of the token to use as center
 * @param rangeUnits - Range in grid units (meters)
 * @param highlightLayerId - Unique ID for the highlight layer
 * @param color - Color for highlights (default: green)
 * @param alpha - Alpha transparency (default: 0.35)
 */
export function highlightHexesInRange(tokenId, rangeUnits, highlightLayerId, color = 0x00ff00, alpha = 0.35) {
    const token = canvas.tokens.get(tokenId);
    if (!token)
        return console.warn("MS | highlightHexesInRange: Token not found", tokenId);
    const grid = canvas.grid;
    const gridUI = canvas.interface?.grid;
    if (!grid || !gridUI)
        return console.warn("MS | highlightHexesInRange: grid/gridUI missing");
    const maxSteps = Math.floor(Number(rangeUnits));
    if (!Number.isFinite(maxSteps) || maxSteps < 0)
        return;
    // getOffset signature differs by Foundry versions; support both point and x/y.
    let startOffset;
    try {
        startOffset = grid.getOffset?.(token.center?.x, token.center?.y);
    }
    catch {
        // ignore
    }
    if (!startOffset) {
        try {
            startOffset = grid.getOffset?.(token.center);
        }
        catch {
            // ignore
        }
    }
    const startNorm = normalizeOffset(startOffset);
    console.log("MS | highlightHexesInRange start", {
        tokenId,
        tokenName: token.name,
        rangeUnits,
        gridType: grid.type,
        gridSize: grid.size,
        start: startOffset
    });
    if (!startNorm) {
        console.error("MS | highlightHexesInRange: getOffset did not return a usable offset", startOffset);
        return;
    }
    // Neighbor API (feature detect)
    const getNeighbors = typeof grid.getAdjacentOffsets === "function" ? (o) => grid.getAdjacentOffsets(o) :
        typeof grid.getNeighbors === "function" ? (o) => grid.getNeighbors(o) :
            null;
    if (!getNeighbors) {
        console.error("MS | highlightHexesInRange: No neighbor API on grid");
        return;
    }
    // BFS
    const key = (o) => `${o.col},${o.row}`;
    const visited = new Set([key(startNorm)]);
    let frontier = [startNorm];
    const all = [startNorm];
    for (let step = 1; step <= maxSteps; step++) {
        const next = [];
        for (const o of frontier) {
            const neighbors = getNeighbors(o) ?? [];
            for (const n of neighbors) {
                const cand = normalizeOffset(n);
                if (!cand)
                    continue;
                const k = key(cand);
                if (visited.has(k))
                    continue;
                visited.add(k);
                next.push(cand);
                all.push(cand);
            }
        }
        console.log(`MS | highlightHexesInRange step ${step}`, { added: next.length, frontier: next.length });
        frontier = next;
    }
    // Highlight layer
    const createdLayer = gridUI.addHighlightLayer?.(highlightLayerId);
    gridUI.clearHighlightLayer?.(highlightLayerId);
    const layer = createdLayer ??
        gridUI.highlightLayers?.[highlightLayerId] ??
        gridUI.getHighlightLayer?.(highlightLayerId) ??
        null;
    let highlighted = 0;
    let tlFail = 0;
    for (const o of all) {
        // Best effort: v13+ prefers layer.highlightPosition(col,row,{color,alpha})
        if (layer && typeof layer.highlightPosition === "function") {
            try {
                layer.highlightPosition(o.col, o.row, { color, alpha });
                highlighted++;
                continue;
            }
            catch {
                // fallthrough
            }
        }
        // Fallback: older API via gridUI.highlightPosition(layerId,{x,y,color,alpha})
        let tl = null;
        try {
            if (typeof grid.getTopLeftPoint === "function") {
                // Some versions accept (col,row), others accept offset-like objects
                tl = grid.getTopLeftPoint(o.col, o.row);
            }
        }
        catch {
            // fallthrough
        }
        if (!tl) {
            try {
                if (typeof grid.getTopLeftPoint === "function") {
                    tl = grid.getTopLeftPoint({ i: o.col, j: o.row });
                }
            }
            catch {
                // ignore
            }
        }
        if (!tl || tl.x === undefined || tl.y === undefined) {
            tlFail++;
            continue;
        }
        try {
            gridUI.highlightPosition?.(highlightLayerId, { x: tl.x, y: tl.y, color, alpha });
            highlighted++;
        }
        catch {
            // ignore
        }
    }
    console.log("MS | highlightHexesInRange complete", {
        tokenId,
        rangeUnits,
        totalHexes: all.length,
        highlighted,
        tlFail
    });
}
export function clearHexHighlight(highlightLayerId) {
    const gridUI = canvas.interface?.grid;
    gridUI?.clearHighlightLayer?.(highlightLayerId);
    const layer = gridUI?.highlightLayers?.[highlightLayerId] ??
        gridUI?.getHighlightLayer?.(highlightLayerId) ??
        null;
    if (layer && typeof layer.clear === "function") {
        try {
            layer.clear();
        }
        catch { /* ignore */ }
    }
}
//# sourceMappingURL=hex-highlighting.js.map