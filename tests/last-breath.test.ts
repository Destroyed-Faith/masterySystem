import { describe, expect, it } from 'vitest';
import {
  applyLastBreathBars,
  wouldDropToIncapacitated,
} from '../src/stones/last-breath';

describe('Last Breath bars', () => {
  it('detects an emptied Incapacitated bar', () => {
    const bars = [
      { name: 'Healthy', current: 0, max: 8 },
      { name: 'Wounded', current: 0, max: 8 },
      { name: 'Incapacitated', current: 0, max: 1 },
    ];
    expect(wouldDropToIncapacitated(bars)).toBe(true);
  });

  it('restores 1 Wounded box and later bars', () => {
    const bars = [
      { name: 'Healthy', current: 0, max: 8 },
      { name: 'Wounded', current: 0, max: 8 },
      { name: 'Broken', current: 0, max: 8 },
      { name: 'Incapacitated', current: 0, max: 1 },
    ];
    const idx = applyLastBreathBars(bars);
    expect(idx).toBe(1);
    expect(bars[1].current).toBe(1);
    expect(bars[2].current).toBe(8);
    expect(bars[3].current).toBe(1);
  });
});
