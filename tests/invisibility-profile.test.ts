import { describe, expect, it, vi } from 'vitest';
import {
  effectiveInvisibilityBonusForActor,
  isSenseBlockedForActor,
  resolveInvisibilityFromActor,
} from '../src/combat/invisibility-profile';

function mockActor(items: any[] = [], flagState: Record<string, unknown> = {}) {
  const flags: Record<string, unknown> = {
    'mastery-system:perceptionCombat': flagState,
  };
  return {
    id: 'a1',
    name: 'Sneak',
    items,
    effects: [],
    getFlag: vi.fn((scope: string, key: string) => flags[`${scope}:${key}`]),
    setFlag: vi.fn(async (scope: string, key: string, val: unknown) => {
      flags[`${scope}:${key}`] = val;
    }),
  };
}

describe('resolveInvisibilityFromActor', () => {
  it('reads Passive: Invisibility bonus and sense slots from catalog', () => {
    const item = {
      type: 'power',
      name: 'Passive: Invisibility',
      system: {
        category: 'passive',
        subfamily: 'invisibility',
        templateId: 'passive-invisibility',
        rank: 4,
      },
    };
    const profile = resolveInvisibilityFromActor(mockActor([item]));
    expect(profile.baseBonus).toBe(4);
    expect(profile.specialSenseSlots).toBe(1);
    expect(profile.blockedSenses).toContain('normalCombatAwareness');
    expect(profile.blockedSenses).toContain('darkvision');
    expect(profile.blockedSenses).toContain('lifeSense');
    expect(profile.active).toBe(true);
  });

  it('stacks Active Buff Invisibility with Passive', () => {
    const passive = {
      type: 'power',
      name: 'Passive: Invisibility',
      system: {
        category: 'passive',
        templateId: 'passive-invisibility',
        rank: 2,
      },
    };
    const buff = {
      type: 'power',
      name: 'Active Buff: Invisibility',
      system: {
        category: 'activeBuff',
        templateId: 'ab-invisibility',
        rank: 3,
      },
    };
    // Buff on actor as owned power still counts via template (also ActiveEffect path).
    const profile = resolveInvisibilityFromActor(mockActor([passive, buff]));
    expect(profile.baseBonus).toBe(2 + 3);
  });

  it('effective bonus uses live passive when flags are empty (bonus = Power Level)', () => {
    const item = {
      type: 'power',
      name: 'Passive: Invisibility',
      system: { templateId: 'passive-invisibility', category: 'passive', rank: 6 },
    };
    const actor = mockActor([item], {});
    expect(effectiveInvisibilityBonusForActor(actor)).toBe(6);
    expect(isSenseBlockedForActor(actor, 'normalCombatAwareness')).toBe(true);
    expect(isSenseBlockedForActor(actor, 'lifeSense')).toBe(true); // default slot fill at L6 = 1 sense
  });

  it('Incapacitated does not remove the Invisibility bonus', () => {
    const item = {
      type: 'power',
      name: 'Passive: Invisibility',
      system: { templateId: 'passive-invisibility', category: 'passive', rank: 6 },
    };
    const actor = mockActor([item], {}) as any;
    actor.system = {
      health: {
        currentBar: 5,
        bars: [
          { name: 'Healthy' },
          { name: 'Bruised' },
          { name: 'Injured' },
          { name: 'Wounded' },
          { name: 'Broken' },
          { name: 'Incapacitated' },
        ],
      },
    };
    expect(effectiveInvisibilityBonusForActor(actor)).toBe(6);
    expect(resolveInvisibilityFromActor(actor).active).toBe(true);
  });
});
