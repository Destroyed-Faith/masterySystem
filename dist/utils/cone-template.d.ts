/**
 * 60° cone on a grid, apex on the caster.
 *
 * Two adjacent neighbor steps span one hex slice (the pizza wedge). The mouse
 * picks which slice; the figure stays the origin. Each ring is one cell
 * wider: 1, then 2, then 3, then 4, out to `length`.
 */
export interface GridOffset {
    i: number;
    j: number;
}
export type NeighborFn = (cell: GridOffset) => GridOffset[];
/** Foundry sometimes hands back deltas `{1,0}` instead of the neighbor hex. */
export declare function absoluteNeighbor(cell: GridOffset, raw: GridOffset): GridOffset;
export declare function wideningConeCells(origin: GridOffset, directionIndex: number, length: number, neighbors: NeighborFn, secondDirectionIndex?: number): GridOffset[];
/** Neighbor whose pixel center best matches the aim vector. */
export declare function bestDirectionIndex(aimX: number, aimY: number, centers: Array<{
    index: number;
    x: number;
    y: number;
}>): number;
/**
 * The 60° slice whose bisector (the hex vertex between two faces) best
 * matches the aim. Returns the two neighbor indices that form that slice.
 */
export declare function bestConeEdgePair(aimX: number, aimY: number, centers: Array<{
    index: number;
    x: number;
    y: number;
}>): {
    first: number;
    second: number;
};
//# sourceMappingURL=cone-template.d.ts.map