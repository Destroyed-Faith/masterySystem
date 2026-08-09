/**
 * Reaction trigger + spend-path flow tests.
 * Covers gates → Fully Parried → Riposte/Reflection eligibility,
 * plus Counter Damage / Ghost Slip / Temp HP / Interpose / Overload / Cleanse surfaces.
 */
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
  isInterposeReaction,
  isOverloadReaction,
  isParryFollowUpReaction,
} from '../src/combat/reaction-eligibility';
import { computeParryStrip } from '../src/combat/parry';
import {
  buildDamageFormula,
  buildReflectionFormula,
  buildRiposteFormula,
} from '../src/combat/parry';

/** Simulate the attack→reaction decision tree for a single power. */
function reactionShown(power: any, ctx: Parameters<typeof evaluateReactionEligibility>[1]): boolean {
  return evaluateReactionEligibility(power, ctx).shown;
}

describe('reaction flow — phase-1 gates', () => {
  const base = {
    phase: 'defender' as const,
    hit: true,
    hasPassiveDR: true,
    hasPassivePhasing: true,
    rangeToAttackerM: 1,
    attackType: 'melee' as const,
  };

  it('hides Armor / Counterattack / Counter Damage / Ghost Slip on miss', () => {
    const miss = { ...base, hit: false };
    expect(reactionShown({ system: { templateId: 'reaction-armor' }, mechanics: { armor: 4 } }, miss)).toBe(
      false,
    );
    expect(reactionShown({ basicReaction: 'counterattack', id: 'basic-reaction-counterattack' }, miss)).toBe(
      false,
    );
    expect(
      reactionShown(
        {
          system: { templateId: 'reaction-counter-damage', subfamily: 'counter' },
          mechanics: { damageRider: { flat: '+2d8' } },
        },
        miss,
      ),
    ).toBe(false);
    expect(
      reactionShown(
        {
          system: { templateId: 'reaction-phasing' },
          mechanics: { phasing: { reactionSingleHit: true } },
        },
        miss,
      ),
    ).toBe(false);
  });

  it('hides DR without Passive DR', () => {
    expect(
      reactionShown(
        {
          system: { templateId: 'reaction-damage-reduction' },
          mechanics: { damageReductionPct: 10 },
        },
        { ...base, hasPassiveDR: false },
      ),
    ).toBe(false);
    expect(
      reactionShown(
        {
          system: { templateId: 'reaction-damage-reduction' },
          mechanics: { damageReductionPct: 10 },
        },
        base,
      ),
    ).toBe(true);
  });

  it('shows Temp HP / Armor-axis / Counter Damage on hit within range', () => {
    expect(
      reactionShown(
        { system: { templateId: 'reaction-temp-hp' }, mechanics: { tempHP: '4' } },
        base,
      ),
    ).toBe(true);
    expect(isArmorAxisReaction({ basicReaction: 'guard' })).toBe(true);
    expect(
      reactionShown(
        {
          system: { templateId: 'reaction-counter-damage', subfamily: 'counter' },
          mechanics: { damageRider: { flat: '+2d8' } },
        },
        { ...base, rangeToAttackerM: 5 },
      ),
    ).toBe(false);
    expect(isCounterDamageReaction({ system: { templateId: 'reaction-counter-damage' } })).toBe(true);
  });

  it('keeps Cleanse / Overload off the attack window', () => {
    const cleanse = { system: { templateId: 'reaction-reactive-cleanse', subfamily: 'cleanse' } };
    const overload = {
      system: { templateId: 'reaction-reactive-overload', subfamily: 'absorption' },
    };
    expect(isCleanseReaction(cleanse)).toBe(true);
    expect(isOverloadReaction(overload)).toBe(true);
    expect(reactionShown(cleanse, base)).toBe(false);
    expect(reactionShown(overload, base)).toBe(false);
    expect(reactionShown(cleanse, { ...base, statusSurface: true })).toBe(true);
    expect(reactionShown(overload, { ...base, hpLost: true })).toBe(true);
  });

  it('shows Interpose only in allies phase within 2 m', () => {
    const interpose = { id: 'basic-reaction-interpose', basicReaction: 'interpose' };
    expect(isInterposeReaction(interpose)).toBe(true);
    expect(reactionShown(interpose, base)).toBe(false);
    expect(
      reactionShown(interpose, { ...base, phase: 'allies', allyDistanceM: 1 }),
    ).toBe(true);
    expect(
      reactionShown(interpose, { ...base, phase: 'allies', allyDistanceM: 5 }),
    ).toBe(false);
  });

  it('shows Ghost Slip only with Passive Phasing on a hit', () => {
    const ghost = {
      system: { templateId: 'reaction-phasing' },
      mechanics: { phasing: { reactionSingleHit: true } },
    };
    expect(isGhostSlipReaction(ghost)).toBe(true);
    expect(reactionShown(ghost, { ...base, hasPassivePhasing: false })).toBe(false);
    expect(reactionShown(ghost, base)).toBe(true);
  });
});

describe('reaction flow — Full Parry → Riposte / Reflection', () => {
  const riposte = {
    system: { templateId: 'reaction-riposte', subfamily: 'parry' },
    mechanics: { damageRider: { flat: '+2d8' } },
  };
  const reflection = {
    system: { templateId: 'reaction-parry-reflection', subfamily: 'parry' },
    mechanics: { damageRider: { flat: '+1d8' } },
  };

  it('Full Parry strip enables follow-ups on the defender window', () => {
    const strip = computeParryStrip(5, 5);
    expect(strip.fullyParried).toBe(true);

    const ctx = {
      phase: 'defender' as const,
      hit: false, // Fully Parried is not a hit
      hasParryThisHit: strip.fullyParried,
      attackType: 'melee' as const,
      isAoE: false,
      rangeToAttackerM: 1,
    };
    expect(isParryFollowUpReaction(riposte)).toBe(true);
    expect(reactionShown(riposte, ctx)).toBe(true);
    expect(reactionShown(reflection, ctx)).toBe(true);
    // Without the flag, still hidden even on a hit.
    expect(reactionShown(riposte, { ...ctx, hasParryThisHit: false, hit: true })).toBe(false);
  });

  it('hides Riposte on ranged Full Parry and Reflection on AoE', () => {
    const ctx = {
      phase: 'defender' as const,
      hit: false,
      hasParryThisHit: true,
      attackType: 'ranged' as const,
      isAoE: false,
    };
    expect(reactionShown(riposte, ctx)).toBe(false);
    expect(reactionShown(reflection, ctx)).toBe(true);
    expect(reactionShown(reflection, { ...ctx, attackType: 'melee', isAoE: true })).toBe(false);
  });

  it('keeps Riposte/Reflection off allies / OA phases', () => {
    const ctx = {
      phase: 'allies' as const,
      hit: false,
      hasParryThisHit: true,
      attackType: 'melee' as const,
    };
    expect(reactionShown(riposte, ctx)).toBe(false);
    expect(reactionShown(riposte, { ...ctx, phase: 'others' })).toBe(false);
  });

  it('spend formulas for Riposte / Reflection resolve to dice strings', () => {
    const defender = {
      items: [{ type: 'weapon', system: { equipped: true, damage: '2d8' } }],
    };
    const attacker = {
      items: [{ type: 'weapon', system: { equipped: true, damage: '4d8' } }],
    };
    expect(buildRiposteFormula(defender, '+2d8')).toBe('2d8+2d8');
    expect(buildReflectionFormula(0, attacker, '+1d8')).toBe('4d8+1d8');
    expect(buildReflectionFormula(9, attacker, '+1d8')).toBe('9+1d8');
    expect(buildDamageFormula('2d8', '+3d8')).toBe('2d8+3d8');
  });

  it('Counter Damage is not classified as a Parry follow-up', () => {
    const cd = {
      system: { templateId: 'reaction-counter-damage', subfamily: 'counter' },
      mechanics: { damageRider: { flat: '+2d8' } },
    };
    expect(isCounterDamageReaction(cd)).toBe(true);
    expect(isParryFollowUpReaction(cd)).toBe(false);
    expect(isCounterDamageReaction(riposte)).toBe(false);
  });
});
