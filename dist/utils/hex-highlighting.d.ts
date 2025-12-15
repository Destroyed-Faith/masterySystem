/**
 * Foundry V13 – Reliable Hex Range Highlight
 * - Uses grid.getOffset(token.center) => {i,j}
 * - BFS via grid.getAdjacentOffsets / grid.getNeighbors
 * - Draws via canvas.interface.grid.highlightPosition(layerId, {x,y,color,alpha})
 * - Uses grid.getTopLeftPoint(offsetObj) where offsetObj is {i,j}
 */
export declare function highlightHexesInRange(tokenId: string, rangeUnits: number, highlightLayerId: string, color?: number, alpha?: number): void;
export declare function clearHexHighlight(highlightLayerId: string): void;
//# sourceMappingURL=hex-highlighting.d.ts.map