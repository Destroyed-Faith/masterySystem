export interface GridRect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export declare function parseInventorySize(size: string | undefined): {
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