import { describe, expect, it } from 'vitest';
import {
  lifetimeXpForStoneProgress,
  nextLifetimeXp,
  permanentStonesFromLifetimeXp,
  buildStoneProgressionSlots,
  effectiveStoneAssignments,
  isLifetimeStoneMode,
  resolvedStonePoolMax,
  systemWithStoneProgression,
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

  it('pool max follows Lifetime track, not Attribute ÷ 8', () => {
    const system = {
      progression: {
        v099Stones: true,
        stoneAssignments: { might: 1, vitality: 1 },
        stoneSlotOrder: [
          'might',
          'might',
          'might',
          'vitality',
          'vitality',
          'agility',
          'agility',
          'resolve',
          null,
        ],
      },
      attributes: {
        might: { value: 24 },
        vitality: { value: 10 },
        agility: { value: 10 },
        resolve: { value: 6 },
      },
    };
    expect(isLifetimeStoneMode(system)).toBe(true);
    expect(effectiveStoneAssignments(system)).toMatchObject({
      might: 3,
      vitality: 2,
      agility: 2,
      resolve: 1,
    });
    expect(resolvedStonePoolMax(system, 'might', 24)).toBe(3);
    expect(resolvedStonePoolMax(system, 'vitality', 10)).toBe(2);
    expect(resolvedStonePoolMax(system, 'resolve', 6)).toBe(1);
    expect(resolvedStonePoolMax(system, 'influence', 4)).toBe(0);
  });

  it('merges world progression onto a token system that still looks like ÷8', () => {
    const world = {
      progression: {
        v099Stones: true,
        stoneSlotOrder: ['might', 'might', 'vitality', 'vitality', 'resolve'],
        stoneAssignments: { might: 2, vitality: 2, resolve: 1 },
      },
    };
    const tokenOnly = {
      attributes: {
        might: { value: 24 },
        vitality: { value: 10 },
        resolve: { value: 6 },
      },
      stonePools: {
        might: { max: 3, current: 3 },
        vitality: { max: 1, current: 1 },
        resolve: { max: 0, current: 0 },
      },
    };
    expect(isLifetimeStoneMode(tokenOnly)).toBe(false);
    expect(resolvedStonePoolMax(tokenOnly, 'vitality', 10)).toBe(1);
    expect(resolvedStonePoolMax(tokenOnly, 'resolve', 6)).toBe(0);

    const merged = systemWithStoneProgression(tokenOnly, world);
    expect(isLifetimeStoneMode(merged)).toBe(true);
    expect(resolvedStonePoolMax(merged, 'might', 24)).toBe(2);
    expect(resolvedStonePoolMax(merged, 'vitality', 10)).toBe(2);
    expect(resolvedStonePoolMax(merged, 'resolve', 6)).toBe(1);
  });
});
