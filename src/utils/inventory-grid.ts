export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function parseInventorySize(size: string | undefined): { w: number; h: number } {
  if (!size) {
    return { w: 1, h: 1 };
  }

  const match = size.toLowerCase().match(/(\d+)\s*x\s*(\d+)/);
  if (!match) {
    return { w: 1, h: 1 };
  }

  const w = Math.max(1, parseInt(match[1], 10) || 1);
  const h = Math.max(1, parseInt(match[2], 10) || 1);
  return { w, h };
}

export function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return !(
    a.x + a.w - 1 < b.x ||
    b.x + b.w - 1 < a.x ||
    a.y + a.h - 1 < b.y ||
    b.y + b.h - 1 < a.y
  );
}

export function fitsInGrid(
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number
): boolean {
  return x >= 1 && y >= 1 && x + w - 1 <= cols && y + h - 1 <= rows;
}

export function findFirstFit(
  existingRects: GridRect[],
  w: number,
  h: number,
  cols: number,
  rows: number
): { x: number; y: number } | null {
  for (let y = 1; y <= rows; y++) {
    for (let x = 1; x <= cols; x++) {
      if (!fitsInGrid(x, y, w, h, cols, rows)) continue;
      const candidate = { x, y, w, h };
      const overlaps = existingRects.some(rect => rectsOverlap(rect, candidate));
      if (!overlaps) {
        return { x, y };
      }
    }
  }

  return null;
}

