/**
 * Batch 3 — C02 Instant Damage AoE shared pool, C04 Special-only zero damage,
 * C08 Maximization cannot bypass the Special-only gate.
 */
import { describe, expect, it } from 'vitest';
import {
  isInstantAoeFlags,
  isSpecialOnlyAttack,
  isSpecialOnlyTemplateId,
  martialWeaponDamageApplies,
  spellFocusDamageApplies,
} from '../src/combat/damage-transfer.js';
import {
  aoeCreatureHitCheck,
  toSharedAoeDamagePayload,
  withInstantAoeFlags,
} from '../src/combat/aoe-melee-resolution.js';
import { excludeAlliesFromAoePool } from '../src/combat/aoe-target-filter.js';
import { shouldSpendMaximizationAfterNegation } from '../src/combat/maximization-order.js';
import { ruinTickDamage } from '../src/combat/status-tick.js';
import {
  buildAvailableRaiseOptions,
  resolvePowerSnapshot,
  type PowerSnapshot,
} from '../src/combat/raise-resolution.js';
import { getTemplate } from '../src/utils/powers/index.js';
import { applyDefensiveMitigation } from '../src/combat/damage-mitigation.js';

const specialOnlySnap = (): PowerSnapshot => ({
  damageDice: 0,
  specials: [{ key: 'ruin', rank: 5 }],
  rangeM: null,
  aoeRadiusM: 3,
  durationSteps: 0,
  hasRange: false,
  hasAoe: true,
  hasDuration: false,
});

describe('Batch 3 C02 — Instant Damage AoE shared Damage Pool', () => {
  it('Martial Instant Damage AoE includes Weapon Damage on the shared pool', () => {
    const flags = withInstantAoeFlags({
      powerIsSpell: false,
      ignoreWeaponDamage: false,
      selectedPowerTemplateId: 'active-melee-weapon-aoe',
    });
    expect(isInstantAoeFlags(flags)).toBe(true);
    expect(isSpecialOnlyAttack(flags)).toBe(false);
    expect(martialWeaponDamageApplies(flags)).toBe(true);
    expect(spellFocusDamageApplies({ isSpell: false, ...flags })).toBe(false);
  });

  it('Spell Instant Damage AoE includes Spell Focus on the shared pool', () => {
    const flags = withInstantAoeFlags({
      powerIsSpell: true,
      ignoreWeaponDamage: true,
      selectedPowerTemplateId: 'active-ranged-weapon-aoe',
    });
    expect(martialWeaponDamageApplies({ ...flags, powerIsSpell: true })).toBe(false);
    expect(
      spellFocusDamageApplies({
        isSpell: true,
        isNpcAttackFlow: false,
        ...flags,
      }),
    ).toBe(true);
  });

  it('rolls one shared raw total for every hit target', () => {
    const shared = toSharedAoeDamagePayload({
      totalDamage: 18,
      count8s: 1,
      rollDetails: ['Weapon: 2d8', 'Power: 4d8'],
    });
    expect(shared).not.toBeNull();
    const perTarget = ['a', 'b', 'c'].map(() => ({ ...shared! }));
    expect(perTarget.map((p) => p.totalDamage)).toEqual([18, 18, 18]);
  });

  it('applies individual mitigation per target against the same raw total', () => {
    const raw = 20;
    const soft = applyDefensiveMitigation({
      rawDamage: raw,
      count8s: 0,
      armorTotal: 2,
      damageReductionPct: 0,
    });
    const hard = applyDefensiveMitigation({
      rawDamage: raw,
      count8s: 0,
      armorTotal: 8,
      damageReductionPct: 0,
    });
    expect(soft.mitigatedDamage).toBe(18);
    expect(hard.mitigatedDamage).toBe(12);
    expect(soft.mitigatedDamage).not.toBe(hard.mitigatedDamage);
  });

  it('excludes allies from normal Instant AoE pools', () => {
    const attacker = { actor: { id: 'pc1', type: 'character' } };
    const tokens: Record<string, any> = {
      ally: { actor: { id: 'pc2', type: 'character' } },
      foe: { actor: { id: 'n1', type: 'npc' }, document: { disposition: -1 } },
    };
    expect(excludeAlliesFromAoePool(attacker, ['ally', 'foe'], (id) => tokens[id])).toEqual(['foe']);
  });

  it('Melee AoE Attack PL6 effect text includes Weapon Damage + Power Dice', () => {
    const text: string = (getTemplate('active-melee-weapon-aoe')!.levels as any)['6'].effect.text;
    expect(text).toMatch(/Weapon Damage/i);
    expect(text).toContain('6d8 Power damage');
    expect(text).toMatch(/shared Damage Pool/i);
  });
});

describe('Batch 3 C04 — Special-only Attacks never deal direct damage', () => {
  it.each([
    'active-melee-instant-special-t3',
    'active-ranged-instant-special-t4',
    'active-melee-aoe-damage-t4',
    'active-ranged-aoe-damage-t5',
    'active-melee-aoe-targeted-special',
    'active-ranged-aoe-targeted-special',
  ])('template %s is Special-only', (id) => {
    expect(isSpecialOnlyTemplateId(id)).toBe(true);
    expect(isSpecialOnlyAttack({ selectedPowerTemplateId: id })).toBe(true);
    expect(martialWeaponDamageApplies({ selectedPowerTemplateId: id })).toBe(false);
    expect(spellFocusDamageApplies({ isSpell: true, selectedPowerTemplateId: id })).toBe(false);
  });

  it('Special-only Melee / Ranged single-target Instant Special templates block every damage axis', () => {
    for (const delivery of [
      { id: 'active-melee-instant-special-t4', attackType: 'melee', powerIsSpell: false },
      { id: 'active-ranged-instant-special-t4', attackType: 'ranged', powerIsSpell: false },
      { id: 'active-ranged-instant-special-t4', attackType: 'ranged', powerIsSpell: true },
    ] as const) {
      const flags = {
        selectedPowerTemplateId: delivery.id,
        ignoreWeaponDamage: true,
        attackType: delivery.attackType,
        powerIsSpell: delivery.powerIsSpell,
      };
      expect(isSpecialOnlyAttack(flags)).toBe(true);
      expect(martialWeaponDamageApplies(flags)).toBe(false);
      expect(spellFocusDamageApplies({ isSpell: delivery.powerIsSpell, ...flags })).toBe(false);
    }
  });

  it('Special-only Melee / Ranged AoE flags keep zero shared damage', () => {
    for (const id of ['active-melee-aoe-damage-t3', 'active-ranged-aoe-damage-t3']) {
      const flags = withInstantAoeFlags({ selectedPowerTemplateId: id });
      expect(flags.specialOnly).toBe(true);
      expect(flags.ignoreWeaponDamage).toBe(true);
      const shared = toSharedAoeDamagePayload({
        totalDamage: 0,
        specialsUsed: ['Ruin(5)'],
        rollDetails: ['Special-only Attack — no direct damage'],
      });
      expect(shared!.totalDamage).toBe(0);
      expect(shared!.specialsUsed).toEqual(['Ruin(5)']);
    }
  });

  it('Special-only Raises never invent Damage Raises', () => {
    const opts = buildAvailableRaiseOptions(specialOnlySnap(), false, { hasWeaponDamage: false });
    expect(opts.every((o) => o.effect === 'specialPlus')).toBe(true);
    const snap = resolvePowerSnapshot({
      base: specialOnlySnap(),
      declaredRaises: [{ effect: 'specialPlus', targetSpecialKey: 'ruin', slots: 1 }],
      outcome: 'full',
      masteryRank: 4,
      isSpell: false,
    });
    expect(snap.damageDice).toBe(0);
    expect(snap.specials[0]?.rank).toBe(9);
  });

  it('hit checks still work without a Damage Pool', () => {
    const hits = [10, 14, 20].map(
      (tn) => aoeCreatureHitCheck({ attackTotal: 14, normalTn: tn, declaredRaiseSlots: 0 }).hit,
    );
    expect(hits).toEqual([true, true, false]);
  });
});

describe('Batch 3 C08 — Maximization cannot bypass Special-only / zero pool', () => {
  it('refuses Maximization for Special-only even when wantMaximization is true', () => {
    expect(
      shouldSpendMaximizationAfterNegation({
        wantMaximization: true,
        remainingDice: 6,
        specialOnly: true,
      }),
    ).toBe(false);
  });

  it('refuses Maximization when no dice remain after Negation', () => {
    expect(
      shouldSpendMaximizationAfterNegation({
        wantMaximization: true,
        remainingDice: 0,
      }),
    ).toBe(false);
  });

  it('still allows Maximization on a normal remaining Damage Pool', () => {
    expect(
      shouldSpendMaximizationAfterNegation({
        wantMaximization: true,
        remainingDice: 4,
        specialOnly: false,
      }),
    ).toBe(true);
  });
});

describe('Batch 3 — Ruin tick after Special-only remains 4 × X', () => {
  it('Ruin(5) still ticks for 20', () => {
    expect(ruinTickDamage(5)).toBe(20);
  });
});
