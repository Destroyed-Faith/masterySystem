import { HEX_GRID_TYPES } from "./constants.mjs";

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {{ sizeX: number, sizeY: number, gridType: number }} grid
 * @returns {number} square pixels of one grid cell
 */
export function gridCellArea(grid) {
  const width = Math.max(1, Number(grid.sizeX) || 1);
  const height = Math.max(1, Number(grid.sizeY) || 1);
  const box = width * height;
  return HEX_GRID_TYPES.has(Number(grid.gridType)) ? box * 0.75 : box;
}

/**
 * PixiJS 8 mask operations for a Foundry polygon tree.
 * The root is a hole. Its children are filled shapes, their children are cutouts,
 * and children of a cutout are islands that are filled again.
 * @param {object|null|undefined} tree
 * @returns {{ op: "fill" | "cut", points: ArrayLike<number> }[]}
 */
export function regionMaskOperations(tree) {
  const operations = [];
  const visitSolids = (node) => {
    for (const solid of childNodes(node)) {
      const canFill = solid?.points?.length >= 6;
      if (!canFill) {
        visitSolids(solid);
        continue;
      }
      operations.push({ op: "fill", points: solid.points });
      for (const hole of childNodes(solid)) {
        if (hole?.points?.length >= 6) operations.push({ op: "cut", points: hole.points });
        visitSolids(hole);
      }
    }
  };
  visitSolids(tree);
  return operations;
}

function childNodes(node) {
  const children = node?.children;
  if (!children || typeof children[Symbol.iterator] !== "function") return [];
  return children;
}

/**
 * Contours from a Foundry PolygonTree, or a plain `{ points, children }` stand-in.
 * The root node has no points. Child rings include holes and islands.
 * @param {object|null|undefined} tree
 * @returns {ArrayLike<number>[]}
 */
export function collectPolygonTreeContours(tree) {
  if (!tree) return [];
  const contours = [];
  const push = (node) => {
    const points = node?.points;
    if (points && points.length >= 6) contours.push(points);
  };

  if (typeof tree[Symbol.iterator] === "function") {
    for (const node of tree) {
      if (node && node !== tree) push(node);
    }
  }

  if (!contours.length) {
    const walk = (node, isRoot) => {
      if (!node || typeof node !== "object") return;
      if (!isRoot) push(node);
      const children = node.children ?? [];
      for (const child of children) walk(child, false);
    };
    walk(tree, true);
  }

  return contours;
}

/** Even-odd containment of one simple ring. `points` is a flat [x, y, ...] list. */
export function pointInRing(x, y, points) {
  let inside = false;
  const count = points.length / 2;
  for (let i = 0, j = count - 1; i < count; j = i, i += 1) {
    const xi = points[i * 2];
    const yi = points[i * 2 + 1];
    const xj = points[j * 2];
    const yj = points[j * 2 + 1];
    const crosses = yi > y !== yj > y;
    if (!crosses) continue;
    const xHit = ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (x < xHit) inside = !inside;
  }
  return inside;
}

/**
 * Even-odd combination of nested rings. A hole ring toggles a point back to outside.
 * This is the same rule the mask fill uses.
 */
export function evenOddContains(x, y, contours) {
  let inside = false;
  for (const points of contours) {
    if (pointInRing(x, y, points)) inside = !inside;
  }
  return inside;
}
