import { describe, it, expect } from 'vitest';
import { computeMarkFloorBonus, clampMarkSpend, listUsefulMarkSpends } from '../src/dice/mark-floor';

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

describe('listUsefulMarkSpends', () => {
  it('lists only spends that raise the total (player-guide example)', () => {
    // 1,1,1,2,5,7,8 — spend 1 does nothing; 2..8 each add more
    const rolls = [fakeRoll([1, 1, 1, 2, 5, 7, 8])];
    const useful = listUsefulMarkSpends(rolls, 8);
    expect(useful[0]).toEqual({ spend: 2, bonus: 3 });
    expect(useful.find((o) => o.spend === 5)).toEqual({ spend: 5, bonus: 15 });
    expect(useful.map((o) => o.spend)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(useful.every((o) => o.bonus > 0)).toBe(true);
  });

  it('skips spends that do not beat a cheaper option', () => {
    // Faces already 4 or 8 — Mark 1–4 gain nothing; 5 and 6 each raise
    const useful = listUsefulMarkSpends([fakeRoll([4, 4, 8])], 6);
    expect(useful).toEqual([
      { spend: 5, bonus: 2 },
      { spend: 6, bonus: 4 },
    ]);
  });

  it('returns empty when no die is below the available Mark', () => {
    expect(listUsefulMarkSpends([fakeRoll([8, 8])], 5)).toEqual([]);
    expect(listUsefulMarkSpends([fakeRoll([1, 2])], 0)).toEqual([]);
  });

  it('respects an existing Brutal Impact floor', () => {
    // Faces 1,2,8 already floored at 4 → only spends above 4 help
    const useful = listUsefulMarkSpends([fakeRoll([1, 2, 8])], 6, 4);
    expect(useful).toEqual([
      { spend: 5, bonus: 2 },
      { spend: 6, bonus: 4 },
    ]);
  });
});
