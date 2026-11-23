/**
 * Reaction: Absorption Surge (Reactions.md v0.9.9.6) — printed table, surfaces
 * and the post-Scar chat prompt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const economy = vi.hoisted(() => ({ remaining: 1, usedThisRound: false }));

vi.mock('../src/combat/action-economy.js', () => ({
  getActionEconomyActor: (a: any) => a,
  getReactionActionsSummary: () => ({ used: 0, total: 1, remaining: economy.remaining }),
  hasPowerBeenUsedThisRound: () => economy.usedThisRound,
  markPowerUsedThisRound: vi.fn(),
  spendReactionAction: vi.fn(async () => true),
}));

import { getTemplate } from '../src/utils/powers/templates/index';
import { ABSORPTION_SURGE_STONES } from '../src/utils/powers/templates/reaction';
import {
  evaluateReactionEligibility,
  isAbsorptionSurgeReaction,
  isOverloadReaction,
} from '../src/combat/reaction-eligibility';
import { absorptionSurgeStonesFor, maybeOfferAbsorptionSurgeChat } from '../src/combat/reaction-followups';

function surgeItem(level: number) {
  const tpl: any = getTemplate('reaction-absorption-surge');
  return {
    id: `surge-${level}`,
    name: 'Reaction: Absorption Surge',
    type: 'power',
    system: {
      powerType: 'reaction',
      templateId: 'reaction-absorption-surge',
      subfamily: 'absorption-surge',
      level,
      mechanics: tpl.levels[String(level)].mechanics,
    },
  };
}

function actor(items: any[]) {
  return { id: 'a1', name: 'Kael', type: 'npc', items };
}

describe('Reaction: Absorption Surge — printed table', () => {
  it('+1 … +8 Temporary Colorless Stones (two PL per step)', () => {
    expect(ABSORPTION_SURGE_STONES).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]);
    const tpl: any = getTemplate('reaction-absorption-surge');
    expect(tpl.name).toBe('Reaction: Absorption Surge');
    expect(tpl.levels['1'].type).toBe('Reaction, Absorption');
    expect(tpl.levels['1'].effect.text).toContain('+1 Temporary Colorless Stone**');
    expect(tpl.levels['16'].effect.text).toContain('+8 Temporary Colorless Stones**');
    expect(tpl.levels['5'].mechanics.absorptionSurgeStones).toBe(3);
  });

  it('reads the bonus from the item, falling back to the table by Power Level', () => {
    expect(absorptionSurgeStonesFor(surgeItem(7))).toBe(4);
    expect(absorptionSurgeStonesFor({ system: { templateId: 'reaction-absorption-surge', level: 11 } })).toBe(6);
  });
});

describe('Reaction: Absorption Surge — surfaces', () => {
  it('is its own Reaction, not Reactive Overload, and never on the attack Reaction card', () => {
    const item = surgeItem(4);
    expect(isAbsorptionSurgeReaction(item)).toBe(true);
    expect(isOverloadReaction(item)).toBe(false);
    const res = evaluateReactionEligibility(item, { phase: 'defender', hpLost: 12 } as any);
    expect(res.shown).toBe(false);
  });
});

describe('Reaction: Absorption Surge — chat prompt after an Absorption trigger', () => {
  const create = vi.fn();
  const combat = { id: 'c1', round: 2, started: true } as any;

  beforeEach(() => {
    economy.remaining = 1;
    economy.usedThisRound = false;
    create.mockReset();
    (globalThis as any).ChatMessage = { create, getSpeaker: () => ({}) };
    (globalThis as any).game = { user: { id: 'u1' } };
  });

  afterEach(() => {
    delete (globalThis as any).ChatMessage;
    delete (globalThis as any).game;
  });

  it('offers the printed bonus once per damage instance', async () => {
    await maybeOfferAbsorptionSurgeChat(actor([surgeItem(9)]) as any, combat);
    expect(create).toHaveBeenCalledTimes(1);
    const msg = create.mock.calls[0][0];
    expect(msg.flags['mastery-system']).toMatchObject({ type: 'absorptionSurgePrompt', stones: 5 });
    expect(msg.content).toContain('data-stones="5"');
  });

  it('is not offered without the Reaction, without a Reaction left, twice in a Round, or on self-inflicted damage', async () => {
    await maybeOfferAbsorptionSurgeChat(actor([]) as any, combat);
    economy.remaining = 0;
    await maybeOfferAbsorptionSurgeChat(actor([surgeItem(9)]) as any, combat);
    economy.remaining = 1;
    economy.usedThisRound = true;
    await maybeOfferAbsorptionSurgeChat(actor([surgeItem(9)]) as any, combat);
    economy.usedThisRound = false;
    const self = actor([surgeItem(9)]);
    await maybeOfferAbsorptionSurgeChat(self as any, combat, self as any);
    await maybeOfferAbsorptionSurgeChat(actor([surgeItem(9)]) as any, null);
    expect(create).not.toHaveBeenCalled();
  });
});
