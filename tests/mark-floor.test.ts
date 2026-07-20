import { describe, it, expect } from 'vitest';
import { computeMarkFloorBonus, clampMarkSpend } from '../src/dice/mark-floor';

function fakeRoll(faces: number[]) {
  return {
    terms: [
      {
        results: faces.map((result) => ({ result, active: true })),
      },
    ],
  };
}

describe('computeMarkFloorBonus (Mark Damage Floor)', () => {
  it('returns 0 when spend is 0 (optional — do not use Mark)', () => {
    expect(computeMarkFloorBonus([fakeRoll([1, 2, 8])], 0)).toBe(0);
  });

  it('raises each die below the spend value (player-guide example)', () => {
    // Example: rolls 1,1,1,2,5,7,8 — spend 5 → 5,5,5,5,5,7,8 → bonus +4+4+4+3 = 15
    const rolls = [fakeRoll([1, 1, 1, 2, 5, 7, 8])];
    expect(computeMarkFloorBonus(rolls, 5)).toBe(15);
  });

  it('ignores inactive die results', () => {
    const roll = {
      terms: [
        {
          results: [
            { result: 1, active: true },
            { result: 1, active: false },
            { result: 8, active: true },
          ],
        },
      ],
    };
    expect(computeMarkFloorBonus([roll], 5)).toBe(4);
  });

  it('allows spend above d8 face (full Mark value)', () => {
    expect(computeMarkFloorBonus([fakeRoll([8, 8])], 12)).toBe(8);
  });
});

describe('clampMarkSpend', () => {
  it('clamps to available Mark and never goes negative', () => {
    expect(clampMarkSpend(12, 5)).toBe(5);
    expect(clampMarkSpend(12, 99)).toBe(12);
    expect(clampMarkSpend(12, 0)).toBe(0);
    expect(clampMarkSpend(12, -3)).toBe(0);
    expect(clampMarkSpend(0, 5)).toBe(0);
  });
});
