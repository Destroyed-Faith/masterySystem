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

vi.mock('../src/combat/threat-zone.js', () => ({
  currentMeleeReachMeters: (actor: any) =>
    Number.isFinite(Number(actor?.__meleeReachM)) ? Number(actor.__meleeReachM) : 2,
}));

vi.mock('../src/utils/unarmed-fallback.js', () => ({
  resolveEquippedWeaponForAttackType: (_items: any[], attackType: string, actor: any) => {
    if (attackType !== 'ranged') return null;
    return actor?.__rangedWeapon ?? null;
  },
}));

vi.mock('../src/utils/artifact-rules.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils/artifact-rules.js')>();
  return {
    ...actual,
    parseArtifactWeaponRangeMeters: (raw: unknown) => {
      const n = Number(String(raw ?? '').replace(/[^\d.]/g, ''));
      return Number.isFinite(n) && n > 0 ? n : null;
    },
  };
});

import {
  actorCanReachWithBasicAttack,
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

  it('hides armor-axis, evade, and counterattack on a miss', () => {
    const armor = {
      system: { templateId: 'reaction-armor' },
      mechanics: { armor: 4 },
    };
    const evade = { basicReaction: 'evade', id: 'basic-reaction-evade', mechanics: { evade: 4 } };
    const counter = { basicReaction: 'counterattack', id: 'basic-reaction-counterattack' };
    const miss = { ...hitCtx, hit: false };
    expect(evaluateReactionEligibility(armor, miss).shown).toBe(false);
    expect(evaluateReactionEligibility(evade, miss).shown).toBe(false);
    expect(evaluateReactionEligibility(counter, miss).shown).toBe(false);
    expect(evaluateReactionEligibility(armor, hitCtx).shown).toBe(true);
    expect(evaluateReactionEligibility(evade, hitCtx).shown).toBe(true);
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
    const reflection = { system: { templateId: 'reaction-parry-reflection', subfamily: 'parry' } };
    expect(isCleanseReaction(cleanse)).toBe(true);
    expect(isOverloadReaction(overload)).toBe(true);
    expect(isParryFollowUpReaction(riposte)).toBe(true);
    expect(evaluateReactionEligibility(cleanse, hitCtx).shown).toBe(false);
    expect(evaluateReactionEligibility(overload, hitCtx).shown).toBe(false);
    expect(evaluateReactionEligibility(riposte, hitCtx).shown).toBe(false);
    expect(
      evaluateReactionEligibility(riposte, {
        ...hitCtx,
        hasParryThisHit: true,
        attackType: 'melee',
      }).shown,
    ).toBe(true);
    expect(
      evaluateReactionEligibility(riposte, {
        ...hitCtx,
        hasParryThisHit: true,
        attackType: 'ranged',
      }).shown,
    ).toBe(false);
    expect(
      evaluateReactionEligibility(reflection, {
        ...hitCtx,
        hasParryThisHit: true,
        isAoE: true,
      }).shown,
    ).toBe(false);
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

  it('hides Counterattack when the reactor cannot reach the attacker', () => {
    const counter = { basicReaction: 'counterattack', id: 'basic-reaction-counterattack' };
    expect(
      evaluateReactionEligibility(counter, {
        ...hitCtx,
        rangeToAttackerM: 8,
        canReachAttackerWithBasicAttack: false,
      }).shown,
    ).toBe(false);
    expect(
      evaluateReactionEligibility(counter, {
        ...hitCtx,
        rangeToAttackerM: 8,
        canReachAttackerWithBasicAttack: true,
      }).shown,
    ).toBe(true);
    // Unknown reach → keep available (theater of the mind / missing tokens).
    expect(
      evaluateReactionEligibility(counter, {
        ...hitCtx,
        canReachAttackerWithBasicAttack: null,
      }).shown,
    ).toBe(true);
  });

  it('actorCanReachWithBasicAttack: melee reach or equipped ranged weapon', () => {
    const meleeOnly = { __meleeReachM: 2, items: [] };
    expect(actorCanReachWithBasicAttack(meleeOnly, 1)).toBe(true);
    expect(actorCanReachWithBasicAttack(meleeOnly, 6)).toBe(false);

    const withBow = {
      __meleeReachM: 2,
      items: [],
      __rangedWeapon: { system: { weaponType: 'ranged', range: '24m' } },
    };
    expect(actorCanReachWithBasicAttack(withBow, 12)).toBe(true);
    expect(actorCanReachWithBasicAttack(withBow, 40)).toBe(false);
    expect(actorCanReachWithBasicAttack(meleeOnly, null)).toBeNull();
  });

  it('classifies armor-axis and ghost-slip helpers', () => {
    expect(isArmorAxisReaction({ basicReaction: 'guard' })).toBe(true);
    expect(
      isGhostSlipReaction({
        mechanics: { phasing: { reactionSingleHit: true } },
      }),
    ).toBe(true);
  });

  it('keeps ally powers out of defender phase; Threatened window rejects hit-trigger reactions', () => {
    const ally = { system: { templateId: 'reaction-ally-armor' }, mechanics: { armor: 3 } };
    const oa = { id: 'basic-reaction-opportunity-attack', basicReaction: 'counterattack' };
    const counter = { id: 'basic-reaction-counterattack', basicReaction: 'counterattack' };
    const guard = { id: 'basic-reaction-guard', basicReaction: 'guard', mechanics: { armor: 4 } };
    expect(evaluateReactionEligibility(ally, hitCtx).shown).toBe(false);
    expect(
      evaluateReactionEligibility(ally, { ...hitCtx, phase: 'allies', allyDistanceM: 3 }).shown,
    ).toBe(true);
    // Threatened Ranged opens at DECLARATION (PG 9725): the reactor was not
    // hit/targeted — Counterattack, Guard, and Counter Damage are illegal.
    expect(evaluateReactionEligibility(oa, { ...hitCtx, phase: 'others' }).shown).toBe(false);
    expect(evaluateReactionEligibility(counter, { ...hitCtx, phase: 'others' }).shown).toBe(false);
    expect(evaluateReactionEligibility(guard, { ...hitCtx, phase: 'others' }).shown).toBe(false);
    expect(
      evaluateReactionEligibility(
        { system: { templateId: 'reaction-counter-damage' }, mechanics: { damageRider: { flat: '+2d8' } } },
        { ...hitCtx, phase: 'others', hit: false, rangeToAttackerM: 2 },
      ).shown,
    ).toBe(false);
    // A custom reaction without a hit/target trigger stays legal at declaration.
    expect(
      evaluateReactionEligibility(
        { system: { templateId: 'custom-war-cry', trigger: 'When an enemy in your melee reach acts' }, mechanics: {} },
        { ...hitCtx, phase: 'others', hit: false },
      ).shown,
    ).toBe(true);
  });
});
