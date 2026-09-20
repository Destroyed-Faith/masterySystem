import { describe, expect, it } from 'vitest';

import { breathConeMeters, isBreathWeaponName } from '../src/utils/breath-weapon.js';
import {
  absoluteNeighbor,
  bestConeEdgePair,
  wideningConeCells,
  type GridOffset,
} from '../src/utils/cone-template.js';

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

function relativeNeighbors(_cell: GridOffset): GridOffset[] {
  return AXIAL.map(([dq, dr]) => ({ i: dq, j: dr }));
}

function hexDist(a: GridOffset, b: GridOffset): number {
  const dq = a.i - b.i;
  const dr = a.j - b.j;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

describe('widening cone', () => {
  it('starts at the caster and fills the 60° slice 2, then 3, then 4, then 5', () => {
    const origin = { i: 0, j: 0 };
    const cells = wideningConeCells(origin, 0, 4, hexNeighbors);
    expect(cells).toHaveLength(14);
    expect(cells[0]).toEqual({ i: 1, j: 0 });
    expect(cells.some((cell) => cell.i === 0 && cell.j === 0)).toBe(false);
    const keys = new Set(cells.map((cell) => `${cell.i},${cell.j}`));
    expect(keys.size).toBe(14);
  });

  it('keeps both edges of the 60° slice, apex on the caster', () => {
    const origin = { i: 10, j: 8 };
    const cells = wideningConeCells(origin, 0, 4, hexNeighbors);
    expect(cells.every((cell) => hexDist(origin, cell) >= 1)).toBe(true);
    expect(cells.every((cell) => hexDist(origin, cell) <= 4)).toBe(true);
    expect(cells.some((cell) => cell.i === 11 && cell.j === 8)).toBe(true);
    expect(cells.some((cell) => cell.i === 11 && cell.j === 7)).toBe(true);
    expect(cells.some((cell) => cell.i === 0 && cell.j === 0)).toBe(false);
  });

  it('treats Foundry delta neighbors as steps from the caster, not map origin', () => {
    const origin = { i: 10, j: 8 };
    const fromAbsolute = wideningConeCells(origin, 0, 3, hexNeighbors);
    const fromRelative = wideningConeCells(origin, 0, 3, relativeNeighbors);
    expect(fromRelative.map((c) => `${c.i},${c.j}`).sort()).toEqual(
      fromAbsolute.map((c) => `${c.i},${c.j}`).sort(),
    );
    expect(absoluteNeighbor(origin, { i: 1, j: 0 })).toEqual({ i: 11, j: 8 });
  });

  it('stops at the printed length', () => {
    expect(wideningConeCells({ i: 0, j: 0 }, 0, 1, hexNeighbors)).toEqual([
      { i: 1, j: 0 },
      { i: 1, j: -1 },
    ]);
    expect(wideningConeCells({ i: 0, j: 0 }, 0, 6, hexNeighbors)).toHaveLength(27);
  });

  it('aims the slice at the hex vertex between two faces', () => {
    const centers = [
      { index: 0, x: 1, y: 0 },
      { index: 1, x: 0.5, y: 0.87 },
      { index: 2, x: -0.5, y: 0.87 },
      { index: 3, x: -1, y: 0 },
      { index: 4, x: -0.5, y: -0.87 },
      { index: 5, x: 0.5, y: -0.87 },
    ];
    const down = bestConeEdgePair(0, 1, centers);
    expect(new Set([down.first, down.second])).toEqual(new Set([1, 2]));
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
