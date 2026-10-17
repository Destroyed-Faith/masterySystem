import { describe, expect, it } from 'vitest';
import { toggleScarOnHealthBar } from '../src/utils/calculations';

describe('GM scar toggle', () => {
  const bars = [
    { name: 'Healthy', current: 0, max: 20 },
    { name: 'Bruised', current: 4, max: 20 },
    { name: 'Injured', current: 20, max: 20 },
  ];

  it('scars one open bar and leaves the others', () => {
    const toggled = toggleScarOnHealthBar(bars, 1);
    expect(toggled.scarred).toBe(true);
    expect(toggled.bars[1].current).toBe(0);
    expect(toggled.bars[0].current).toBe(0);
    expect(toggled.bars[2].current).toBe(20);
    expect(toggled.currentBar).toBe(2);
  });

  it('fills a scarred bar back to maximum on the second press', () => {
    const scarred = toggleScarOnHealthBar(bars, 1);
    const healed = toggleScarOnHealthBar(scarred.bars, 1);
    expect(healed.scarred).toBe(false);
    expect(healed.bars[1].current).toBe(20);
    expect(healed.bars[0].current).toBe(0);
    expect(healed.currentBar).toBe(1);
  });
});
