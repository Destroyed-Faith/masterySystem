import { describe, expect, it } from 'vitest';
import {
  lifetimeXpForStoneProgress,
  nextLifetimeXp,
  permanentStonesFromLifetimeXp,
  buildStoneProgressionSlots,
} from '../src/progression/v099-rules.js';

describe('lifetime XP unlocks stones regardless of spend', () => {
  it('150 lifetime XP unlocks the 140 milestone stone (9 permanent)', () => {
    expect(permanentStonesFromLifetimeXp(150)).toBe(9);
    const slots = buildStoneProgressionSlots(150, {}, undefined, 0, null, 'visible');
    const slot140 = slots.find((s) => s.label === '140');
    expect(slot140?.unlocked).toBe(true);
  });

  it('uses spent + unspent when progression.lifetimeXp is missing', () => {
    expect(
      lifetimeXpForStoneProgress({
        xp: { totalSpent: 40, freeSpent: 0 },
        points: { xp: 110, xpFree: 0 },
      }),
    ).toBe(150);
  });

  it('XP grant bootstraps lifetime from spent+unspent', () => {
    expect(
      nextLifetimeXp(
        {
          xp: { totalSpent: 0, freeSpent: 0, totalEarned: 150 },
          points: { xp: 150 },
        },
        20,
      ),
    ).toBe(170);
  });
});
