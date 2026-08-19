export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EquipmentGridFlags {
  container?: string | null;
  band?: string | null;
  slot?: string | null;
  grid?: { x?: number; y?: number } | null;
  consumableSlot?: unknown;
  weaponSetPrepared?: boolean;
}

/** True when the item currently occupies carry-grid cells (not equipped, stash, or a consumable slot). */
export function occupiesInventoryGrid(
  flags: EquipmentGridFlags | null | undefined,
  band?: string
): boolean {
  if (!flags) return false;
  if (flags.weaponSetPrepared === true) return false;
  if (flags.container !== 'inventory') return false;
  if (flags.slot) return false;
  if (flags.consumableSlot != null && Number.isFinite(Number(flags.consumableSlot))) return false;
  const x = Number(flags.grid?.x || 0);
  const y = Number(flags.grid?.y || 0);
  if (x < 1 || y < 1) return false;
  if (band != null && (flags.band ?? 'not') !== band) return false;
  return true;
}

export function collectInventoryBandRects(
  items: Iterable<any>,
  band: string,
  opts: { excludeItemId?: string; cols?: number; rows?: number } = {}
): GridRect[] {
  const cols = opts.cols ?? 8;
  const rows = opts.rows ?? 9;
  const rects: GridRect[] = [];
  for (const item of items) {
    if (opts.excludeItemId && item?.id === opts.excludeItemId) continue;
    const flags =
      item?.getFlag?.('mastery-system', 'equipment') ||
      item?.flags?.['mastery-system']?.equipment ||
      {};
    if (!occupiesInventoryGrid(flags, band)) continue;
    const size = parseInventorySize(item?.system?.inventorySize);
    rects.push({
      x: Number(flags.grid.x),
      y: Number(flags.grid.y),
      w: Math.min(cols, size.w),
      h: Math.min(rows, size.h),
    });
  }
  return rects;
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

