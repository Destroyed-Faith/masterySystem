import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/power-mechanics.js', () => ({
  resolvePowerMechanics: (item: any) => item?.mechanics ?? {},
  buildActorMechanicsBreakdown: () => ({
    damageReductionPct: { passive: [{ value: 10 }], buff: [], reaction: [] },
    totals: { damageReductionPct: 10 },
  }),
}));

vi.mock('../src/utils/mechanics-adjacency.js', () => ({
  getPrimaryTokenForActor: () => null,
}));

vi.mock('../src/combat/threatened-ranged.js', () => ({
  distanceBetweenTokensMeters: () => 1,
}));

import {
  evaluateReactionEligibility,
  isArmorAxisReaction,
  isCleanseReaction,
  isCounterDamageReaction,
  isGhostSlipReaction,
  isOverloadReaction,
  isParryFollowUpReaction,
} from '../src/combat/reaction-eligibility';

describe('reaction eligibility', () => {
  const hitCtx = {
    phase: 'defender' as const,
    hit: true,
    hasPassiveDR: true,
    hasPassivePhasing: true,
    rangeToAttackerM: 1,
  };

  it('hides armor-axis and counterattack on a miss', () => {
    const armor = {
      system: { templateId: 'reaction-armor' },
      mechanics: { armor: 4 },
    };
    const counter = { basicReaction: 'counterattack', id: 'basic-reaction-counterattack' };
    const miss = { ...hitCtx, hit: false };
    expect(evaluateReactionEligibility(armor, miss).shown).toBe(false);
    expect(evaluateReactionEligibility(counter, miss).shown).toBe(false);
    expect(evaluateReactionEligibility(armor, hitCtx).shown).toBe(true);
    expect(evaluateReactionEligibility(counter, hitCtx).shown).toBe(true);
  });

  it('hides DR without Passive DR and Ghost Slip without Passive Phasing', () => {
    const dr = {
      system: { templateId: 'reaction-damage-reduction' },
      mechanics: { damageReductionPct: 10 },
    };
    const ghost = {
      system: { templateId: 'reaction-phasing' },
      mechanics: { phasing: { reactionSingleHit: true } },
    };
    expect(evaluateReactionEligibility(dr, { ...hitCtx, hasPassiveDR: false }).shown).toBe(false);
    expect(evaluateReactionEligibility(ghost, { ...hitCtx, hasPassivePhasing: false }).shown).toBe(
      false,
    );
    expect(evaluateReactionEligibility(ghost, hitCtx).shown).toBe(true);
  });

  it('hides Cleanse / Overload / Parry follow-ups on the attack window', () => {
    const cleanse = { system: { templateId: 'reaction-reactive-cleanse', subfamily: 'cleanse' } };
    const overload = {
      system: { templateId: 'reaction-reactive-overload', subfamily: 'absorption' },
    };
    const riposte = { system: { templateId: 'reaction-riposte', subfamily: 'parry' } };
    expect(isCleanseReaction(cleanse)).toBe(true);
    expect(isOverloadReaction(overload)).toBe(true);
    expect(isParryFollowUpReaction(riposte)).toBe(true);
    expect(evaluateReactionEligibility(cleanse, hitCtx).shown).toBe(false);
    expect(evaluateReactionEligibility(overload, hitCtx).shown).toBe(false);
    expect(evaluateReactionEligibility(riposte, hitCtx).shown).toBe(false);
    expect(
      evaluateReactionEligibility(riposte, { ...hitCtx, hasParryThisHit: true }).shown,
    ).toBe(true);
  });

  it('gates counter damage by hit and 2 m range', () => {
    const cd = {
      system: { templateId: 'reaction-counter-damage', subfamily: 'counter' },
      mechanics: { damageRider: { flat: '+2d8' } },
    };
    expect(isCounterDamageReaction(cd)).toBe(true);
    expect(evaluateReactionEligibility(cd, { ...hitCtx, rangeToAttackerM: 5 }).shown).toBe(false);
    expect(evaluateReactionEligibility(cd, hitCtx).shown).toBe(true);
  });

  it('classifies armor-axis and ghost-slip helpers', () => {
    expect(isArmorAxisReaction({ basicReaction: 'guard' })).toBe(true);
    expect(
      isGhostSlipReaction({
        mechanics: { phasing: { reactionSingleHit: true } },
      }),
    ).toBe(true);
  });

  it('keeps ally powers out of defender phase and OA out of allies phase', () => {
    const ally = { system: { templateId: 'reaction-ally-armor' }, mechanics: { armor: 3 } };
    const oa = { id: 'basic-reaction-opportunity-attack', basicReaction: 'counterattack' };
    expect(evaluateReactionEligibility(ally, hitCtx).shown).toBe(false);
    expect(
      evaluateReactionEligibility(ally, { ...hitCtx, phase: 'allies', allyDistanceM: 3 }).shown,
    ).toBe(true);
    expect(evaluateReactionEligibility(oa, { ...hitCtx, phase: 'allies' }).shown).toBe(false);
    expect(evaluateReactionEligibility(oa, { ...hitCtx, phase: 'others' }).shown).toBe(true);
  });
});
