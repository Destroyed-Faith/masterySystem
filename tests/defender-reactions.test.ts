import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/combat/action-economy.js', () => ({
  getActionEconomyActor: (a: unknown) => a,
  getAvailableReactionActions: () => 1,
  getReactionActionsSummary: () => ({ used: 0, total: 1, remaining: 1 }),
  hasPowerBeenUsedThisRound: () => false,
  markPowerUsedThisRound: vi.fn(),
  spendReactionAction: vi.fn(async () => true),
}));

vi.mock('../src/utils/power-mechanics.js', () => ({
  resolvePowerMechanics: (item: any) => {
    if (item?.id === 'gs') return { phasing: { reactionSingleHit: true } };
    if (item?.id === 'ev-power' || item?.basicReaction === 'evade') return { evade: 2 };
    if (item?.id === 'guard-power' || item?.basicReaction === 'guard') return { armor: 2 };
    return { armor: 1 };
  },
  buildActorMechanicsBreakdown: () => ({
    damageReductionPct: { passive: [], buff: [], reaction: [] },
    totals: { damageReductionPct: 0 },
  }),
}));

vi.mock('../src/radial-menu/artifact-options.js', () => ({
  buildArtifactReactionOptions: () => [],
}));

import {
  dedupeOverlappingBasicReactions,
  getEligibleReactionPowers,
  isAllyReactionPower,
} from '../src/combat/defender-reactions.js';

describe('defender-reactions', () => {
  it('isAllyReactionPower detects Ally templates', () => {
    expect(isAllyReactionPower({ system: { templateId: 'reaction-ally-armor' } })).toBe(true);
    expect(isAllyReactionPower({ system: { templateId: 'reaction-evade' } })).toBe(false);
    expect(isAllyReactionPower({ name: 'Reaction: Ally Evade', system: {} })).toBe(true);
  });

  it('getEligibleReactionPowers returns reaction items, basic reactions, and omits phasing.reactionSingleHit', () => {
    const combat = { id: 'c1' } as any;
    const defender = {
      system: { mastery: { rank: 2 } },
      items: [
        { id: 'r1', type: 'power', name: 'R1', system: { powerType: 'reaction', equipped: true } },
        { id: 'u1', type: 'power', name: 'U1', system: { powerType: 'utility', equipped: true } },
        { id: 'gs', type: 'power', name: 'Ghost Slip', system: { powerType: 'reaction', equipped: true } },
      ],
    } as any;

    const list = getEligibleReactionPowers(defender, combat);
    expect(list.map((x: any) => x.id).sort()).toEqual([
      'basic-reaction-counterattack',
      'basic-reaction-evade',
      'basic-reaction-guard',
      'r1',
    ]);
  });

  it('dedupeOverlappingBasicReactions hides Basic Evade/Guard when a real power exists', () => {
    const powers = [
      {
        id: 'ev-power',
        name: 'Reaction: Evade',
        system: { templateId: 'reaction-evade', powerType: 'reaction' },
      },
      {
        id: 'guard-power',
        name: 'Reaction: Armor',
        system: { templateId: 'reaction-armor', powerType: 'reaction' },
      },
      { id: 'basic-reaction-evade', name: 'Evade', basicReaction: 'evade' },
      { id: 'basic-reaction-guard', name: 'Guard', basicReaction: 'guard' },
      { id: 'basic-reaction-counterattack', name: 'Counterattack', basicReaction: 'counterattack' },
    ];
    const deduped = dedupeOverlappingBasicReactions(powers);
    expect(deduped.map((p: any) => p.id).sort()).toEqual([
      'basic-reaction-counterattack',
      'ev-power',
      'guard-power',
    ]);
  });

  it('getEligibleReactionPowers omits Basic Evade when Reaction: Evade is equipped', () => {
    const combat = { id: 'c1' } as any;
    const defender = {
      system: { mastery: { rank: 2 } },
      items: [
        {
          id: 'ev-power',
          type: 'power',
          name: 'Reaction: Evade',
          system: { powerType: 'reaction', equipped: true, templateId: 'reaction-evade' },
        },
      ],
    } as any;

    const list = getEligibleReactionPowers(defender, combat);
    expect(list.map((x: any) => x.id).sort()).toEqual([
      'basic-reaction-counterattack',
      'basic-reaction-guard',
      'ev-power',
    ]);
  });
});
