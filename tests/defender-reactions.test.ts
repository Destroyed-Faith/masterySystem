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
  getEligibleReactionPowers,
  isAllyReactionPower,
} from '../src/combat/defender-reactions.js';

describe('defender-reactions', () => {
  it('isAllyReactionPower detects Ally templates', () => {
    expect(isAllyReactionPower({ system: { templateId: 'reaction-ally-armor' } })).toBe(true);
    expect(isAllyReactionPower({ system: { templateId: 'reaction-evade' } })).toBe(false);
    expect(isAllyReactionPower({ name: 'Reaction: Ally Evade', system: {} })).toBe(true);
  });

  it('getEligibleReactionPowers returns reaction items and omits phasing.reactionSingleHit', () => {
    const combat = { id: 'c1' } as any;
    const defender = {
      items: [
        { id: 'r1', type: 'power', name: 'R1', system: { powerType: 'reaction', equipped: true } },
        { id: 'u1', type: 'power', name: 'U1', system: { powerType: 'utility', equipped: true } },
        { id: 'gs', type: 'power', name: 'Ghost Slip', system: { powerType: 'reaction', equipped: true } },
      ],
    } as any;

    const list = getEligibleReactionPowers(defender, combat);
    expect(list.map((x: any) => x.id).sort()).toEqual(['r1']);
  });
});
