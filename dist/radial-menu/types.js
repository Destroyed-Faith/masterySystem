/**
 * Types and Constants for Radial Menu
 */
/**
 * Inner segments configuration
 */
export const MS_INNER_SEGMENTS = [
    { id: 'movement', color: 0xffe066, label: 'Move' },
    { id: 'attack', color: 0xff6666, label: 'Atk' },
    { id: 'utility', color: 0x66aaff, label: 'Util' },
    { id: 'active-buff', color: 0xcc88ff, label: 'Buff' }
];
/**
 * Radial menu dimensions
 */
export const MS_INNER_RADIUS = 60;
export const MS_OUTER_RING_INNER = 80; // Inner radius of outer ring (where wedges start)
export const MS_OUTER_RING_OUTER = 140; // Outer radius of outer ring (where wedges end)
/**
 * Check if grid is enabled on the current scene
 * @returns true if grid is enabled and not gridless
 */
export function hasGridEnabled() {
    return canvas.grid !== null && canvas.grid !== undefined && canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS;
}
/**
 * Get the grid type of the current scene
 * @returns Grid type constant or null if no grid
 */
export function getGridType() {
    return canvas.grid?.type ?? null;
}
/**
 * Get grid type name as string
 * @returns Human-readable grid type name
 */
export function getGridTypeName() {
    const gridType = getGridType();
    if (gridType === null)
        return 'None';
    if (gridType === CONST.GRID_TYPES.GRIDLESS)
        return 'Gridless';
    if (gridType === CONST.GRID_TYPES.SQUARE)
        return 'Square';
    if (gridType === CONST.GRID_TYPES.HEXAGONAL)
        return 'Hexagonal';
    return `Unknown (${gridType})`;
}
//# sourceMappingURL=types.js.map