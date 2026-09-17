/**
 * Pure pointer/commit rules for wall & opening drawing.
 * Kept canvas-free so unit tests can lock the click–click contract.
 */

import { DEFAULT_MIN_SEGMENT, DEFAULT_OPENING_WIDTH, clonePoint, distance } from './geometry.js';
import type { Point } from './types.js';

/** World-unit distance below which a pointerup is treated as a click, not a drag-commit. */
export const CLICK_CHAIN_EPS = 4;

export function clampOpeningWidth(
  hostLength: number,
  width: number,
  minWidth = DEFAULT_MIN_SEGMENT,
): number {
  if (!(hostLength > 0)) return Math.max(minWidth, DEFAULT_OPENING_WIDTH);
  const lo = Math.min(minWidth, hostLength);
  return Math.min(hostLength, Math.max(lo, width));
}

export interface ChainDownResult {
  /** Start point after this down. Unchanged when a chain is already active. */
  drawStart: Point;
  /** True when this down placed the first point of a new chain. */
  placedStart: boolean;
}

/**
 * Click–click: first down places start; later downs must not overwrite it.
 */
export function resolveChainPointerDown(drawStart: Point | null, point: Point): ChainDownResult {
  if (drawStart) return { drawStart, placedStart: false };
  return { drawStart: clonePoint(point), placedStart: true };
}

export type ChainUpResult =
  | { action: 'hold-start'; point: Point }
  | { action: 'commit'; a: Point; b: Point; nextStart: Point };

/**
 * Short click keeps / refreshes the chain start. Longer travel commits and chains.
 */
export function resolveChainPointerUp(
  drawStart: Point,
  end: Point,
  eps = CLICK_CHAIN_EPS,
): ChainUpResult {
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
