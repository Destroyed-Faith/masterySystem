/**
 * Hex Highlighting Utilities
 * Uses BFS (Breadth-First Search) to find and highlight hex fields within range
 */

type OffsetLike = {
  i?: number; j?: number;
  col?: number; row?: number;
  x?: number; y?: number;
  q?: number; r?: number;
  offset?: any;
};

function normalizeOffset(o: OffsetLike): { col: number; row: number } | null {
  const cand = (o as any)?.offset ? (o as any).offset : o;
  if (!cand) return null;

  const col =
    cand.col ?? cand.i ?? cand.x ?? cand.q;
  const row =
    cand.row ?? cand.j ?? cand.y ?? cand.r;

  if (typeof col !== "number" || typeof row !== "number") return null;
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
  
    const maxSteps = Math.floor(Number(rangeUnits));
    if (!Number.isFinite(maxSteps) || maxSteps < 0) return;

    // getOffset signature differs by Foundry versions; support both point and x/y.
    let startOffset: any;
    try {
      startOffset = (grid as any).getOffset?.(token.center?.x, token.center?.y);
    } catch {
      // ignore
    }
    if (!startOffset) {
      try {
        startOffset = (grid as any).getOffset?.(token.center);
      } catch {
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
    const getNeighbors =
      typeof (grid as any).getAdjacentOffsets === "function" ? (o: any) => (grid as any).getAdjacentOffsets(o) :
      typeof (grid as any).getNeighbors === "function"       ? (o: any) => (grid as any).getNeighbors(o) :
      null;
  
    if (!getNeighbors) {
      console.error("MS | highlightHexesInRange: No neighbor API on grid");
      return;
    }
  
    // BFS
    const key = (o: { col: number; row: number }) => `${o.col},${o.row}`;
    const visited = new Set<string>([key(startNorm)]);
    let frontier: Array<{ col: number; row: number }> = [startNorm];
    const all: Array<{ col: number; row: number }> = [startNorm];
  
    for (let step = 1; step <= maxSteps; step++) {
      const next: Array<{ col: number; row: number }> = [];
      for (const o of frontier) {
        const neighbors = getNeighbors(o) ?? [];
        for (const n of neighbors) {
          const cand = normalizeOffset(n as any);
  
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
    const createdLayer = (gridUI as any).addHighlightLayer?.(highlightLayerId);
    (gridUI as any).clearHighlightLayer?.(highlightLayerId);

    const layer =
      createdLayer ??
      (gridUI as any).highlightLayers?.[highlightLayerId] ??
      (gridUI as any).getHighlightLayer?.(highlightLayerId) ??
      null;

    let highlighted = 0;
    let tlFail = 0;
  
    for (const o of all) {
      // Best effort: v13+ prefers layer.highlightPosition(col,row,{color,alpha})
      if (layer && typeof (layer as any).highlightPosition === "function") {
        try {
          (layer as any).highlightPosition(o.col, o.row, { color, alpha });
          highlighted++;
          continue;
        } catch {
          // fallthrough
        }
      }

      // Fallback: older API via gridUI.highlightPosition(layerId,{x,y,color,alpha})
      let tl: any = null;
      try {
        if (typeof (grid as any).getTopLeftPoint === "function") {
          // Some versions accept (col,row), others accept offset-like objects
          tl = (grid as any).getTopLeftPoint(o.col, o.row);
        }
      } catch {
        // fallthrough
      }
      if (!tl) {
        try {
          if (typeof (grid as any).getTopLeftPoint === "function") {
            tl = (grid as any).getTopLeftPoint({ i: o.col, j: o.row });
          }
        } catch {
          // ignore
        }
      }
      if (!tl || tl.x === undefined || tl.y === undefined) {
        tlFail++;
        continue;
      }

      try {
        (gridUI as any).highlightPosition?.(highlightLayerId, { x: tl.x, y: tl.y, color, alpha });
        highlighted++;
      } catch {
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
  
  export function clearHexHighlight(highlightLayerId: string): void {
    const gridUI: any = canvas.interface?.grid;
    gridUI?.clearHighlightLayer?.(highlightLayerId);

    const layer =
      gridUI?.highlightLayers?.[highlightLayerId] ??
      gridUI?.getHighlightLayer?.(highlightLayerId) ??
      null;
    if (layer && typeof layer.clear === "function") {
      try { layer.clear(); } catch { /* ignore */ }
    }
  }
