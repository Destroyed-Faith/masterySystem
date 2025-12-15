/**
 * Hex Highlighting Utilities
 * Uses BFS (Breadth-First Search) to find and highlight hex fields within range
 */

/**
 * Highlight hex fields within range using BFS algorithm
 * @param tokenId - The ID of the token to use as center
 * @param rangeUnits - Range in grid units (meters)
 * @param highlightLayerId - Unique ID for the highlight layer
 * @param color - Color for highlights (default: green)
 * @param alpha - Alpha transparency (default: 0.35)
 */
export function highlightHexesInRange(
    tokenId: string,
    rangeUnits: number,
    highlightLayerId: string,
    color: number = 0x00ff00,
    alpha: number = 0.35
  ): void {
    const token = canvas.tokens.get(tokenId);
    if (!token) return console.warn("MS | highlightHexesInRange: Token not found", tokenId);
  
    const grid = canvas.grid;
    const gridUI = canvas.interface?.grid;
    if (!grid || !gridUI) return console.warn("MS | highlightHexesInRange: grid/gridUI missing");
  
    // IMPORTANT: pass the point object
    const start = grid.getOffset(token.center) as any; // expected: {i,j} on hex
    const si = start?.i;
    const sj = start?.j;
  
    console.log("MS | highlightHexesInRange start", {
      tokenId,
      tokenName: token.name,
      rangeUnits,
      gridType: grid.type,
      gridSize: grid.size,
      start
    });
  
    if (si === undefined || sj === undefined) {
      console.error("MS | highlightHexesInRange: getOffset did not return {i,j}", start);
      return;
    }
  
    // Neighbor API (feature detect)
    const getNeighbors =
      typeof (grid as any).getAdjacentOffsets === "function" ? (o: any) => (grid as any).getAdjacentOffsets(o) :
      typeof (grid as any).getNeighbors === "function"       ? (o: any) => (grid as any).getNeighbors(o) :
      null;
  
    if (!getNeighbors) {
      console.error("MS | highlightHexesInRange: No neighbor API on grid");
      return;
    }
  
    // BFS
    const key = (o: any) => `${o.i},${o.j}`;
    const visited = new Set<string>([key(start)]);
    let frontier: any[] = [start];
    const all: any[] = [start];
  
    for (let step = 1; step <= rangeUnits; step++) {
      const next: any[] = [];
      for (const o of frontier) {
        const neighbors = getNeighbors(o) ?? [];
        for (const n of neighbors) {
          const cand =
            (n?.i !== undefined && n?.j !== undefined) ? n :
            (n?.offset?.i !== undefined && n?.offset?.j !== undefined) ? n.offset :
            null;
  
          if (!cand) continue;
  
          const k = key(cand);
          if (visited.has(k)) continue;
  
          visited.add(k);
          next.push(cand);
          all.push(cand);
        }
      }
      console.log(`MS | highlightHexesInRange step ${step}`, { added: next.length, frontier: next.length });
      frontier = next;
    }
  
    // Highlight layer
    gridUI.addHighlightLayer?.(highlightLayerId);
    gridUI.clearHighlightLayer?.(highlightLayerId);

    let highlighted = 0;
    let tlFail = 0;
  
    for (const o of all) {
      // IMPORTANT: pass offset object, not (col,row)
      const tl = grid.getTopLeftPoint(o);
      if (!tl || tl.x === undefined || tl.y === undefined) { tlFail++; continue; }
  
      gridUI.highlightPosition?.(highlightLayerId, { x: tl.x, y: tl.y, color, alpha });
      highlighted++;
    }
  
    console.log("MS | highlightHexesInRange complete", {
      tokenId,
      rangeUnits,
      totalHexes: all.length,
      highlighted,
      tlFail
    });
  }
  
  export function clearHexHighlight(highlightLayerId: string): void {
    canvas.interface?.grid?.clearHighlightLayer?.(highlightLayerId);
  }
