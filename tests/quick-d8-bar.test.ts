import { describe, expect, it } from 'vitest';

import { quickD8Formula, resolveQuickD8Pool } from '../src/ui/quick-d8-bar.js';

describe('quickD8Formula', () => {
  it('builds Nd8 keep Mastery Rank, clamped to the dice rolled', () => {
    expect(quickD8Formula(6, 2)).toEqual({
      dice: 6,
      keep: 2,
      formula: '6d8k2',
      shortLabel: '6k2',
    });
    expect(quickD8Formula('12', '8')?.formula).toBe('12d8k8');
    expect(quickD8Formula('12', '8')?.shortLabel).toBe('12k8');
    expect(quickD8Formula(3, 8)?.formula).toBe('3d8k3');
  });

  it('rejects empty, zero, and three-digit counts', () => {
    expect(quickD8Formula('', 1)).toBeNull();
    expect(quickD8Formula(0, 1)).toBeNull();
    expect(quickD8Formula(100, 1)).toBeNull();
    expect(quickD8Formula(-2, 1)).toBeNull();
  });
});

describe('resolveQuickD8Pool', () => {
  it('rerolls an 8 and adds the new face until it is not an 8', () => {
    const faces = [8, 8, 3, 4];
    const rng = () => (faces.shift()! - 1) / 8;
    const pool = resolveQuickD8Pool(2, 1, rng);
    expect(pool.chains).toEqual([[8, 8, 3], [4]]);
    expect(pool.totals).toEqual([19, 4]);
    expect(pool.keptIndices).toEqual([0]);
    expect(pool.total).toBe(19);
  });
});