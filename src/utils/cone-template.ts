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

function keyOf(cell: GridOffset): string {
  return `${cell.i},${cell.j}`;
}

function cubeDist(a: GridOffset, b: GridOffset): number {
  const dq = a.i - b.i;
  const dr = a.j - b.j;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

function manhattan(a: GridOffset, b: GridOffset): number {
  return Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
}

/** Foundry sometimes hands back deltas `{1,0}` instead of the neighbor hex. */
export function absoluteNeighbor(cell: GridOffset, raw: GridOffset): GridOffset {
  if (cubeDist(cell, raw) === 1 || manhattan(cell, raw) === 1) return raw;
  const translated = { i: cell.i + raw.i, j: cell.j + raw.j };
  if (cubeDist(cell, translated) === 1 || manhattan(cell, translated) === 1) return translated;
  return raw;
}

function around(cell: GridOffset, neighbors: NeighborFn): GridOffset[] {
  return (neighbors(cell) || []).map((n) => absoluteNeighbor(cell, n));
}

function step(cell: GridOffset, direction: number, neighbors: NeighborFn): GridOffset | null {
  const list = around(cell, neighbors);
  if (direction < 0 || direction >= list.length) return null;
  return list[direction] ?? null;
}

function walk(
  origin: GridOffset,
  direction: number,
  steps: number,
  neighbors: NeighborFn,
): GridOffset | null {
  let cell = origin;
  for (let n = 0; n < steps; n++) {
    const next = step(cell, direction, neighbors);
    if (!next) return null;
    cell = next;
  }
  return cell;
}

export function wideningConeCells(
  origin: GridOffset,
  directionIndex: number,
  length: number,
  neighbors: NeighborFn,
  secondDirectionIndex?: number,
): GridOffset[] {
  const lengthN = Math.max(0, Math.floor(Number(length) || 0));
  if (lengthN <= 0) return [];
  const neighborCount = around(origin, neighbors).length;
  if (neighborCount < 3) return [];
  const dirA = Math.floor(directionIndex);
  if (dirA < 0 || dirA >= neighborCount) return [];
  const dirB = Number.isFinite(Number(secondDirectionIndex))
    ? Math.floor(Number(secondDirectionIndex))
    : (dirA + 1) % neighborCount;
  if (dirB < 0 || dirB >= neighborCount) return [];

  const cells: GridOffset[] = [];
  const seen = new Set<string>();
  const add = (cell: GridOffset | null | undefined): void => {
    if (!cell) return;
    if (cell.i === origin.i && cell.j === origin.j) return;
    const key = keyOf(cell);
    if (seen.has(key)) return;
    seen.add(key);
    cells.push(cell);
  };

  for (let depth = 1; depth <= lengthN; depth++) {
    for (let alongB = 0; alongB <= depth; alongB++) {
      const alongA = depth - alongB;
      const mid = walk(origin, dirA, alongA, neighbors);
      add(alongB === 0 ? mid : walk(mid ?? origin, dirB, alongB, neighbors));
    }
  }

  return cells;
}

/** Neighbor whose pixel center best matches the aim vector. */
export function bestDirectionIndex(
  aimX: number,
  aimY: number,
  centers: Array<{ index: number; x: number; y: number }>,
): number {
  let best = centers[0]?.index ?? 0;
  let bestDot = -Infinity;
  for (const center of centers) {
    const dot = center.x * aimX + center.y * aimY;
    if (dot > bestDot) {
      bestDot = dot;
      best = center.index;
    }
  }
  return best;
}

/**
 * The 60° slice whose bisector (the hex vertex between two faces) best
 * matches the aim. Returns the two neighbor indices that form that slice.
 */
export function bestConeEdgePair(
  aimX: number,
  aimY: number,
  centers: Array<{ index: number; x: number; y: number }>,
): { first: number; second: number } {
  if (!centers.length) return { first: 0, second: 1 };
  const sorted = [...centers].sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  let best = 0;
  let bestDot = -Infinity;
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]!;
    const b = sorted[(i + 1) % sorted.length]!;
    const dot = (a.x + b.x) * aimX + (a.y + b.y) * aimY;
    if (dot > bestDot) {
      bestDot = dot;
      best = i;
    }
  }
  return {
    first: sorted[best]!.index,
    second: sorted[(best + 1) % sorted.length]!.index,
  };
}
