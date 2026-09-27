import { describe, expect, it } from 'vitest';

import { normalizePowerFavorites, POWER_FAVORITES_MAX } from '../src/ui/power-favorites.js';
import {
  clampBarCurrent,
  scarredCountFromBars,
} from '../src/ui/carousel-vitals-edit.js';

describe('power favorites', () => {
  it('dedupes and caps at six ids', () => {
    const ids = normalizePowerFavorites(['a', 'a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect(ids).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(ids).toHaveLength(POWER_FAVORITES_MAX);
  });
});

describe('carousel vitals edit helpers', () => {
  it('clamps current and counts scarred bars', () => {
    expect(clampBarCurrent(20, 16)).toBe(16);
    expect(clampBarCurrent(-3, 16)).toBe(0);
    expect(
      scarredCountFromBars([
        { current: 0, max: 16 },
        { current: 8, max: 16 },
      ]),
    ).toBe(1);
  });
});
