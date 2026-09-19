import { describe, expect, it } from 'vitest';

import { breathConeMeters, isBreathWeaponName } from '../src/utils/breath-weapon.js';
import { wideningConeCells, type GridOffset } from '../src/utils/cone-template.js';

const AXIAL: Array<[number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

function hexNeighbors(cell: GridOffset): GridOffset[] {
  return AXIAL.map(([dq, dr]) => ({ i: cell.i + dq, j: cell.j + dr }));
}

describe('widening cone', () => {
  it('starts with the cell in front and widens 1, 2, 3, 4', () => {
    const origin = { i: 0, j: 0 };
    const cells = wideningConeCells(origin, 0, 4, hexNeighbors);
    expect(cells).toHaveLength(10);
    expect(cells[0]).toEqual({ i: 1, j: 0 });
    expect(cells.some((cell) => cell.i === 0 && cell.j === 0)).toBe(false);
    const keys = new Set(cells.map((cell) => `${cell.i},${cell.j}`));
    expect(keys.size).toBe(10);
  });

  it('stops at the printed length', () => {
    expect(wideningConeCells({ i: 0, j: 0 }, 0, 1, hexNeighbors)).toEqual([{ i: 1, j: 0 }]);
    expect(wideningConeCells({ i: 0, j: 0 }, 0, 6, hexNeighbors)).toHaveLength(21);
  });
});

describe('breath cone length', () => {
  it('follows the Dragon Head table', () => {
    expect(breathConeMeters(1)).toBe(6);
    expect(breathConeMeters(3)).toBe(6);
    expect(breathConeMeters(4)).toBe(10);
    expect(breathConeMeters(6)).toBe(10);
    expect(breathConeMeters(7)).toBe(14);
    expect(isBreathWeaponName('Breath Weapon II')).toBe(true);
    expect(isBreathWeaponName('Bite')).toBe(false);
  });
});
