/**
 * Pure pointer/commit rules for wall & opening drawing.
 * Kept canvas-free so unit tests can lock the click–click contract.
 */
import { DEFAULT_MIN_SEGMENT, DEFAULT_OPENING_WIDTH, clonePoint, distance } from './geometry.js';
/** World-unit distance below which a pointerup is treated as a click, not a drag-commit. */
export const CLICK_CHAIN_EPS = 4;
export function clampOpeningWidth(hostLength, width, minWidth = DEFAULT_MIN_SEGMENT) {
    if (!(hostLength > 0))
        return Math.max(minWidth, DEFAULT_OPENING_WIDTH);
    const lo = Math.min(minWidth, hostLength);
    return Math.min(hostLength, Math.max(lo, width));
}
/**
 * Click–click: first down places start; later downs must not overwrite it.
 */
export function resolveChainPointerDown(drawStart, point) {
    if (drawStart)
        return { drawStart, placedStart: false };
    return { drawStart: clonePoint(point), placedStart: true };
}
/**
 * Short click keeps / refreshes the chain start. Longer travel commits and chains.
 */
export function resolveChainPointerUp(drawStart, end, eps = CLICK_CHAIN_EPS) {
    if (distance(drawStart, end) < eps) {
        return { action: 'hold-start', point: clonePoint(end) };
    }
    return {
        action: 'commit',
        a: clonePoint(drawStart),
        b: clonePoint(end),
        nextStart: clonePoint(end),
    };
}
//# sourceMappingURL=draw-contract.js.map