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
  if (!token) {
    console.warn('Mastery System | highlightHexesInRange: Token not found', tokenId);
    return;
  }

  const grid = canvas.grid;
  const gridUI = canvas.interface?.grid;

  if (!grid || !gridUI) {
    console.warn('Mastery System | highlightHexesInRange: Grid or GridUI not available');
    return;
  }

  const center = token.center;
  const start = grid.getOffset(center) as any; // {i, j}

  if (start?.i === undefined || start?.j === undefined) {
    console.error('Mastery System | highlightHexesInRange: getOffset failed', start);
    return;
  }

  // Neighbor API (feature detect)
  const getNeighbors =
    typeof grid.getAdjacentOffsets === "function" ? (o: any) => grid.getAdjacentOffsets(o) :
    typeof (grid as any).getNeighbors === "function" ? (o: any) => (grid as any).getNeighbors(o) :
    null;

  if (!getNeighbors) {
    console.error('Mastery System | highlightHexesInRange: No neighbor API found on grid');
    return;
  }

  // BFS rings
  const key = (o: any) => `${o.i},${o.j}`;
  const visited = new Set([key(start)]);
  let frontier = [start];
  const all = [start];

  for (let step = 1; step <= rangeUnits; step++) {
    const next: any[] = [];

    for (const o of frontier) {
      const neighbors = getNeighbors(o) || [];
      for (const n of neighbors) {
        const cand = (n?.i !== undefined && n?.j !== undefined) ? n :
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

    frontier = next;
  }

  // Highlight layer (reliable)
  gridUI.addHighlightLayer?.(highlightLayerId);
  gridUI.clearHighlightLayer?.(highlightLayerId);

  let highlighted = 0;
  let tlFail = 0;

  for (const o of all) {
    const tl = grid.getTopLeftPoint(o); // pixel top-left for that hex
    if (!tl || tl.x === undefined || tl.y === undefined) {
      tlFail++;
      continue;
    }

    gridUI.highlightPosition?.(highlightLayerId, {
      x: tl.x,
      y: tl.y,
      color: color,
      alpha: alpha
    });

    highlighted++;
  }

  console.log('Mastery System | highlightHexesInRange: Complete', {
    tokenId,
    tokenName: token.name,
    rangeUnits,
    highlighted,
    tlFail,
    totalHexes: all.length
  });
}

/**
 * Clear a highlight layer
 * @param highlightLayerId - The ID of the highlight layer to clear
 */
export function clearHexHighlight(highlightLayerId: string): void {
  const gridUI = canvas.interface?.grid;
  if (gridUI) {
    gridUI.clearHighlightLayer?.(highlightLayerId);
  }
}

