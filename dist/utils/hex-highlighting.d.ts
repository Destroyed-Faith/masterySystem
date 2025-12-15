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
export declare function highlightHexesInRange(tokenId: string, rangeUnits: number, highlightLayerId: string, color?: number, alpha?: number): void;
/**
 * Clear a highlight layer
 * @param highlightLayerId - The ID of the highlight layer to clear
 */
export declare function clearHexHighlight(highlightLayerId: string): void;
//# sourceMappingURL=hex-highlighting.d.ts.map