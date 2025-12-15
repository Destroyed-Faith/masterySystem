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
  const startOffset = grid.getOffset(center.x, center.y) as any;

  // Handle different offset formats (col/row, i/j, x/y, q/r)
  let startCol: number | undefined;
  let startRow: number | undefined;

  if (startOffset) {
    if (startOffset.col !== undefined && startOffset.row !== undefined) {
      startCol = startOffset.col;
      startRow = startOffset.row;
    } else if (startOffset.i !== undefined && startOffset.j !== undefined) {
      // Hexagonal grid format in v13
      startCol = startOffset.i;
      startRow = startOffset.j;
    } else if (startOffset.x !== undefined && startOffset.y !== undefined) {
      startCol = startOffset.x;
      startRow = startOffset.y;
    } else if (startOffset.q !== undefined && startOffset.r !== undefined) {
      startCol = startOffset.q;
      startRow = startOffset.r;
    }
  }

  if (startCol === undefined || startRow === undefined) {
    console.error('Mastery System | highlightHexesInRange: getOffset failed', startOffset);
    return;
  }

  const start: any = { col: startCol, row: startRow, i: startCol, j: startRow };

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
  const key = (o: any) => {
    const col = o.col ?? o.i ?? o.x ?? o.q ?? 0;
    const row = o.row ?? o.j ?? o.y ?? o.r ?? 0;
    return `${col},${row}`;
  };
  const visited = new Set([key(start)]);
  let frontier = [start];
  const all = [start];

  for (let step = 1; step <= rangeUnits; step++) {
    const next: any[] = [];

    for (const o of frontier) {
      const neighbors = getNeighbors(o) || [];
      for (const n of neighbors) {
        const cand = (n?.i !== undefined && n?.j !== undefined) ? n :
                     (n?.col !== undefined && n?.row !== undefined) ? n :
                     (n?.offset?.i !== undefined && n?.offset?.j !== undefined) ? n.offset :
                     (n?.offset?.col !== undefined && n?.offset?.row !== undefined) ? n.offset :
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
    // Extract col/row from various formats
    const col = o.col ?? o.i ?? o.x ?? o.q ?? 0;
    const row = o.row ?? o.j ?? o.y ?? o.r ?? 0;

    // getTopLeftPoint expects (col, row) as separate parameters in v13
    let tl: { x: number; y: number } | null = null;
    try {
      if (grid.getTopLeftPoint) {
        tl = grid.getTopLeftPoint(col, row);
      }
    } catch (error) {
      console.warn('Mastery System | highlightHexesInRange: getTopLeftPoint failed', { col, row, error });
    }

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
