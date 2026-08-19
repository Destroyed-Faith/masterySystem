import { describe, expect, it } from 'vitest';

import {
  collectInventoryBandRects,
  findFirstFit,
  fitsInGrid,
  occupiesInventoryGrid,
  parseInventorySize,
  rectsOverlap,
} from '../src/utils/inventory-grid.js';

function item(spec: {
  id: string;
  size?: string;
  container?: string;
  band?: string;
  slot?: string | null;
  grid?: { x: number; y: number } | null;
  consumableSlot?: number;
}) {
  return {
    id: spec.id,
    system: { inventorySize: spec.size },
    getFlag: (_ns: string, key: string) =>
      key === 'equipment'
        ? {
            container: spec.container ?? 'inventory',
            band: spec.band ?? 'not',
            slot: spec.slot ?? null,
            grid: spec.grid ?? null,
            consumableSlot: spec.consumableSlot,
          }
        : undefined,
  };
}

describe('inventory grid occupancy', () => {
  it('treats equipped and consumable-slot items as off the carry grid', () => {
    expect(occupiesInventoryGrid({ container: 'inventory', band: 'not', grid: { x: 1, y: 1 } })).toBe(true);
    expect(occupiesInventoryGrid({ container: 'inventory', band: 'not', slot: 'body', grid: { x: 1, y: 1 } })).toBe(false);
    expect(occupiesInventoryGrid({ container: 'inventory', band: 'not', weaponSetPrepared: true, grid: { x: 1, y: 1 } })).toBe(false);
    expect(occupiesInventoryGrid({ container: 'inventory', band: 'not', consumableSlot: 0, grid: { x: 2, y: 2 } })).toBe(false);
    expect(occupiesInventoryGrid({ container: 'stash', band: 'not', grid: { x: 1, y: 1 } })).toBe(false);
    expect(occupiesInventoryGrid({ container: 'inventory', band: 'heavy', grid: { x: 3, y: 4 } }, 'not')).toBe(false);
    expect(occupiesInventoryGrid({ container: 'inventory', band: 'heavy', grid: { x: 3, y: 4 } }, 'heavy')).toBe(true);
  });

  it('collects rects per band and ignores leftover equipped grids', () => {
    const items = [
      item({ id: 'apple', band: 'not', grid: { x: 1, y: 1 }, size: '1x1' }),
      item({ id: 'armor', band: 'not', slot: 'body', grid: { x: 2, y: 1 }, size: '2x3' }),
      item({ id: 'rock', band: 'heavy', grid: { x: 8, y: 9 }, size: '1x1' }),
    ];
    expect(collectInventoryBandRects(items, 'not')).toEqual([{ x: 1, y: 1, w: 1, h: 1 }]);
    expect(collectInventoryBandRects(items, 'heavy')).toEqual([{ x: 8, y: 9, w: 1, h: 1 }]);
    expect(collectInventoryBandRects(items, 'enc')).toEqual([]);
  });

  it('keeps 8-column band bounds so a 2-wide item cannot sit on column 8', () => {
    expect(fitsInGrid(8, 1, 2, 1, 8, 9)).toBe(false);
    expect(fitsInGrid(7, 1, 2, 1, 8, 9)).toBe(true);
    expect(fitsInGrid(8, 1, 1, 1, 8, 9)).toBe(true);
  });

  it('does not treat same-cell items in different bands as overlapping', () => {
    const a = { x: 1, y: 1, w: 1, h: 1 };
    const b = { x: 1, y: 1, w: 1, h: 1 };
    expect(rectsOverlap(a, b)).toBe(true);
    expect(collectInventoryBandRects([
      item({ id: 'a', band: 'not', grid: { x: 1, y: 1 } }),
      item({ id: 'b', band: 'heavy', grid: { x: 1, y: 1 } }),
    ], 'heavy')).toEqual([{ x: 1, y: 1, w: 1, h: 1 }]);
  });

  it('findFirstFit still packs never-placed items without using a 24-col grid', () => {
    const pos = findFirstFit([{ x: 1, y: 1, w: 1, h: 1 }], 1, 1, 8, 9);
    expect(pos).toEqual({ x: 2, y: 1 });
  });

  it('parseInventorySize reads WxH', () => {
    expect(parseInventorySize('2x3')).toEqual({ w: 2, h: 3 });
    expect(parseInventorySize(undefined)).toEqual({ w: 1, h: 1 });
  });
});
