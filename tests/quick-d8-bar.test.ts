import { describe, expect, it } from 'vitest';

import { quickD8Formula } from '../src/ui/quick-d8-bar.js';

describe('quickD8Formula', () => {
  it('builds Nd8 keep Mastery Rank, clamped to the dice rolled', () => {
    expect(quickD8Formula(6, 2)).toEqual({ dice: 6, keep: 2, formula: '6d8kh2' });
    expect(quickD8Formula('12', '8')?.formula).toBe('12d8kh8');
    expect(quickD8Formula(3, 8)?.formula).toBe('3d8kh3');
  });

  it('rejects empty, zero, and three-digit counts', () => {
    expect(quickD8Formula('', 1)).toBeNull();
    expect(quickD8Formula(0, 1)).toBeNull();
    expect(quickD8Formula(100, 1)).toBeNull();
    expect(quickD8Formula(-2, 1)).toBeNull();
  });
});