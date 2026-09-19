/**
 * Widening cone on a grid.
 *
 * The first cell is the one directly in front of the figure. Each step
 * further out is one cell wider: 1, then 2, then 3, then 4, up to `length`.
 * The extra cell alternates sides so the triangle stays in front instead of
 * shearing off to one side.
 */

export interface GridOffset {
  i: number;
  j: number;
}

function keyOf(cell: GridOffset): string {
  return `${cell.i},${cell.j}`;
}

function step(
  cell: GridOffset,
  direction: number,
  neighbors: (cell: GridOffset) => GridOffset[],
): GridOffset | null {
  const list = neighbors(cell);
  if (direction < 0 || direction >= list.length) return null;
  return list[direction] ?? null;
}

function walk(
  origin: GridOffset,
  direction: number,
  steps: number,
  neighbors: (cell: GridOffset) => GridOffset[],
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
  neighbors: (cell: GridOffset) => GridOffset[],
): GridOffset[] {
  const lengthN = Math.max(0, Math.floor(Number(length) || 0));
  if (lengthN <= 0) return [];
  const around = neighbors(origin);
  const neighborCount = around.length;
  if (neighborCount < 3) return [];
  const dir = Math.floor(directionIndex);
  if (dir < 0 || dir >= neighborCount) return [];
  // Hex (6): the row sits 120° off the facing, so width n stays on the ring.
  // Square and anything else: the next compass step is the row.
  const side = neighborCount === 6 ? (dir + 2) % neighborCount : (dir + 1) % neighborCount;

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
    let cell = walk(origin, dir, depth, neighbors);
    add(cell);
    for (let across = 1; across < depth; across++) {
      if (!cell) break;
      cell = step(cell, side, neighbors);
      add(cell);
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
