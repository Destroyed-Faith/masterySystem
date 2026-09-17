/**
 * Pure pointer/commit rules for wall & opening drawing.
 * Kept canvas-free so unit tests can lock the click–click contract.
 */
import type { Point } from './types.js';
/** World-unit distance below which a pointerup is treated as a click, not a drag-commit. */
export declare const CLICK_CHAIN_EPS = 4;
export declare function clampOpeningWidth(hostLength: number, width: number, minWidth?: number): number;
export interface ChainDownResult {
    /** Start point after this down. Unchanged when a chain is already active. */
    drawStart: Point;
    /** True when this down placed the first point of a new chain. */
    placedStart: boolean;
}
/**
 * Click–click: first down places start; later downs must not overwrite it.
 */
export declare function resolveChainPointerDown(drawStart: Point | null, point: Point): ChainDownResult;
export type ChainUpResult = {
    action: 'hold-start';
    point: Point;
} | {
    action: 'commit';
    a: Point;
    b: Point;
    nextStart: Point;
};
/**
 * Short click keeps / refreshes the chain start. Longer travel commits and chains.
 */
export declare function resolveChainPointerUp(drawStart: Point, end: Point, eps?: number): ChainUpResult;
//# sourceMappingURL=draw-contract.d.ts.map