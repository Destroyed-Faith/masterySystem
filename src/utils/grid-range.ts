/**
 * Mastery System powers use meters; Foundry scenes use grid.distance + grid.units (m, ft, …).
 * These helpers align highlight BFS steps and measurePath comparisons.
 */

/** Scene distance equivalent to `rangeMeters` (same units as canvas.grid.measurePath / grid.distance). */
export function metersToSceneDistance(rangeMeters: number): number {
  const grid: any = canvas.grid;
  const u = String(
    grid?.units ?? (canvas.scene as any)?.grid?.units ?? "m"
  ).toLowerCase();
  if (u === "ft" || u === "feet" || u === "foot") return rangeMeters / 0.3048;
  if (u === "yd" || u === "yards" || u === "yard") return rangeMeters / 0.9144;
  if (u === "mi" || u === "miles" || u === "mile") return rangeMeters / 1609.34;
  return rangeMeters;
}

/**
 * BFS step count for highlightHexesInRange: how many grid spaces (edges) match `rangeMeters`.
 */
export function gridStepsFromMeters(rangeMeters: number): number {
  const grid = canvas.grid;
  if (!grid || grid.type === CONST.GRID_TYPES.GRIDLESS) {
    return Math.max(1, Math.ceil(rangeMeters));
  }
  const perCell = Number(grid.distance) || 1;
  const sceneDist = metersToSceneDistance(rangeMeters);
  return Math.max(1, Math.ceil(sceneDist / perCell));
}

type IJ = { i: number; j: number };

function centerToIJ(grid: any, center: { x: number; y: number }): IJ | null {
  const raw = grid?.getOffset?.(center);
  if (raw?.i === undefined || raw?.j === undefined) return null;
  return { i: Number(raw.i), j: Number(raw.j) };
}

function neighborFn(grid: any): ((o: IJ) => any[]) | null {
  if (typeof grid.getAdjacentOffsets === "function") return (o: IJ) => grid.getAdjacentOffsets(o) ?? [];
  if (typeof grid.getNeighbors === "function") return (o: IJ) => grid.getNeighbors(o) ?? [];
  return null;
}

function neighborToIJ(n: any): IJ | null {
  if (n?.i !== undefined && n?.j !== undefined) return { i: Number(n.i), j: Number(n.j) };
  if (n?.offset?.i !== undefined && n?.offset?.j !== undefined) {
    return { i: Number(n.offset.i), j: Number(n.offset.j) };
  }
  return null;
}

/**
 * Fewest grid-adjacency steps between two canvas points (e.g. token centers), capped at `maxSteps`.
 * Matches the BFS model used by hex highlights so targeting cannot disagree with the painted range.
 */
export function gridStepsBetweenCenters(
  from: { x: number; y: number },
  to: { x: number; y: number },
  maxSteps: number
): number | null {
  const grid: any = canvas.grid;
  if (!grid || grid.type === CONST.GRID_TYPES.GRIDLESS) return null;
  const gn = neighborFn(grid);
  if (!gn) return null;
  const start = centerToIJ(grid, from);
  const goal = centerToIJ(grid, to);
  if (!start || !goal) return null;
  const key = (o: IJ) => `${o.i},${o.j}`;
  if (start.i === goal.i && start.j === goal.j) return 0;
  const visited = new Set<string>([key(start)]);
  let frontier: IJ[] = [start];
  const cap = Math.max(0, Math.floor(maxSteps));
  for (let step = 1; step <= cap; step++) {
    const next: IJ[] = [];
    for (const o of frontier) {
      for (const n of gn(o)) {
        const cand = neighborToIJ(n);
        if (!cand) continue;
        const k = key(cand);
        if (visited.has(k)) continue;
        if (cand.i === goal.i && cand.j === goal.j) return step;
        visited.add(k);
        next.push(cand);
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return null;
}

/** True if target is within `rangeMeters` by grid steps (same cap as range highlight) or scene path distance. */
export function isWithinRangeMeters(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rangeMeters: number
): boolean {
  const maxScene = metersToSceneDistance(rangeMeters);
  const dPath = measureSceneDistanceBetweenPoints(from, to);
  if (Number.isFinite(dPath) && dPath <= maxScene + 0.01) return true;
  const grid: any = canvas.grid;
  if (!grid || grid.type === CONST.GRID_TYPES.GRIDLESS) return false;
  const maxSteps = gridStepsFromMeters(rangeMeters);
  const steps = gridStepsBetweenCenters(from, to, maxSteps);
  return steps !== null && steps <= maxSteps;
}

/** Distance between two canvas points in scene grid units (for comparison to metersToSceneDistance). */
export function measureSceneDistanceBetweenPoints(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const grid: any = canvas.grid;
  const perCell = Number(grid?.distance) || 1;

  if (grid?.measurePath) {
    try {
      const path = grid.measurePath([a, b], {});
      if (path != null) {
        const dist = path.distance;
        if (typeof dist === "number" && Number.isFinite(dist) && dist >= 0) {
          return dist;
        }
        const tot = path.total;
        if (typeof tot === "number" && Number.isFinite(tot) && tot >= 0) {
          return tot;
        }
        const spaces = path.spaces;
        if (typeof spaces === "number" && Number.isFinite(spaces) && spaces >= 0) {
          return spaces * perCell;
        }
        if (Array.isArray(path) && path.length > 0) {
          const first = path[0] as any;
          if (typeof first === "number" && Number.isFinite(first)) return first;
          if (first && typeof first.distance === "number" && Number.isFinite(first.distance)) {
            return first.distance;
          }
        }
      }
    } catch {
      // fall through
    }
  }
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distPx = Math.hypot(dx, dy);
  const gridSize = grid?.size ?? 100;
  const gridUnits = distPx / gridSize;
  return gridUnits * perCell;
}
