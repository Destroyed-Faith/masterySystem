import type { Hint, HintKind, Point } from '../types.js';
import { newId } from '../geometry.js';

export function createHint(kind: HintKind, a: Point, b: Point): Hint {
  return { id: newId('hint'), kind, a, b };
}
