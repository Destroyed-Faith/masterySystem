export interface GridRect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface EquipmentGridFlags {
    container?: string | null;
    band?: string | null;
    slot?: string | null;
    grid?: {
        x?: number;
        y?: number;
    } | null;
    consumableSlot?: unknown;
    weaponSetPrepared?: boolean;
    /** Legacy: equipped items no longer occupy the carry grid. */
    keepInventoryGrid?: boolean;
    /** PG "Item Rotation": rotated 90° — width × height becomes height × width. */
    rotated?: boolean;
}
export declare function readEquipmentFlags(item: any): EquipmentGridFlags;
/** Carried item that is not on the paperdoll, in a consumable slot, or a prepared weapon-set piece. */
export declare function isCarriedUnequippedItem(item: any): boolean;
/** True when the item currently occupies carry-grid cells (not equipped, stash, or a consumable slot). */
export declare function occupiesInventoryGrid(flags: EquipmentGridFlags | null | undefined, band?: string): boolean;
export declare function collectInventoryBandRects(items: Iterable<any>, band: string, opts?: {
    excludeItemId?: string;
    cols?: number;
    rows?: number;
}): GridRect[];
export declare function parseInventorySize(size: string | undefined): {
    w: number;
    h: number;
};
/**
 * Effective footprint of an item in the carry grid, honoring the PG
 * "Item Rotation" rule: a rotated item swaps width × height.
 */
export declare function itemInventorySize(item: any): {
    w: number;
    h: number;
};
export declare function rectsOverlap(a: GridRect, b: GridRect): boolean;
export declare function fitsInGrid(x: number, y: number, w: number, h: number, cols: number, rows: number): boolean;
export declare function findFirstFit(existingRects: GridRect[], w: number, h: number, cols: number, rows: number): {
    x: number;
    y: number;
} | null;
//# sourceMappingURL=inventory-grid.d.ts.map