/**
 * Playtest 2026-10-20 Passive catalogue integration tests.
 */
import { describe, expect, it } from 'vitest';
import {
  passiveArmorReductionForLevel,
  passiveDamageNegationReserveForLevel,
  phasingStyleCombatCharges,
  PASSIVE_ARMOR_CURVE,
  PASSIVE_TEMPLATES,
} from '../src/utils/powers/templates/passives.js';
import {
  damageNegationReserveForLevel,
  migrateDamageNegationRemaining,
} from '../src/combat/damage-negation.js';
import {
  passiveCriticalChargesForLevel,
  passiveMaximizationChargesForLevel,
  applyPassiveCriticalSpend,
} from '../src/combat/passive-combat-charges.js';
import {
  resolveCriticalAttackModifier,
  listAvailableCriticalSources,
  applyDeclaredCritSpend,
} from '../src/combat/critical-resolution.js';
import { maximizeDamageFormula } from '../src/stones/stone-combat-effects.js';
import { applyDefensiveMitigation } from '../src/combat/damage-mitigation.js';
import {
  getPassiveMechanicalCategories,
  passivesAreCategoryCompatible,
} from '../src/creation/tower-wizard/tower-wizard-passive-categories.js';

function template(id: string) {
  return PASSIVE_TEMPLATES.find((t) => t.templateId === id);
}

function levelText(id: string, level: number): string {
  const t = template(id);
  const row = t?.levels?.[String(level)] ?? (t?.levels as any)?.[level];
  return String(row?.effect?.text ?? '');
}

describe('Passive Damage Negation reserve (2 × PL)', () => {
  it('matches PL boundaries including former half values', () => {
    expect(passiveDamageNegationReserveForLevel(1)).toBe(2);
    expect(passiveDamageNegationReserveForLevel(3)).toBe(6);
    expect(passiveDamageNegationReserveForLevel(4)).toBe(8);
    expect(passiveDamageNegationReserveForLevel(8)).toBe(16);
    expect(passiveDamageNegationReserveForLevel(16)).toBe(32);
    expect(damageNegationReserveForLevel(4)).toBe(8);
    expect(damageNegationReserveForLevel(8)).toBe(16);
    expect(damageNegationReserveForLevel(16)).toBe(32);
  });

  it('migrates in-progress combat preserving spent points', () => {
    // Old PL4 max 16, 5 spent → remaining 11; new max 8 → remaining 3
    expect(
      migrateDamageNegationRemaining({ level: 4, remaining: 11 }),
    ).toBe(3);
    // Already on new formula with maxAtInit
    expect(
      migrateDamageNegationRemaining({ level: 4, remaining: 5, maxAtInit: 8 }),
    ).toBe(5);
  });

  it('lists all 16 catalogue levels as 2×PL', () => {
    for (let pl = 1; pl <= 16; pl++) {
      expect(passiveDamageNegationReserveForLevel(pl)).toBe(2 * pl);
    }
  });
});

describe('Passive: Armor Reduction', () => {
  it('uses the exact Passive: Armor curve', () => {
    expect(PASSIVE_ARMOR_CURVE).toEqual([1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21]);
    expect(passiveArmorReductionForLevel(4)).toBe(5);
    expect(passiveArmorReductionForLevel(8)).toBe(11);
    expect(passiveArmorReductionForLevel(16)).toBe(21);
  });

  it('is its own category and compatible with Passive: Damage', () => {
    expect(getPassiveMechanicalCategories('passive-armor-reduction')).toEqual(['armor-reduction']);
    expect(passivesAreCategoryCompatible('passive-killing-intent', 'passive-armor-reduction')).toBe(true);
    expect(passivesAreCategoryCompatible('passive-fortified-frame', 'passive-armor-reduction')).toBe(true);
  });

  it('never drives effective Armor below zero with combined reductions', () => {
    // Target Armor 12, Corrode 2 → 10 listed; Passive AR 5 + Stone 4 + Pen 3 = 12 → 0
    const armorAfterCorrode = Math.max(0, 12 - 2);
    const penetration = 5 + 4 + 3;
    const result = applyDefensiveMitigation({
      rawDamage: 40,
      count8s: 0,
      armorTotal: armorAfterCorrode,
      damageReductionPct: 0,
      armorPenetration: penetration,
    });
    expect(result.armorApplied).toBe(0);
    expect(result.mitigatedDamage).toBe(40);
  });

  it('registers in the catalogue with PL values', () => {
    expect(template('passive-armor-reduction')).toBeTruthy();
    expect(levelText('passive-armor-reduction', 4)).toMatch(/5 Armor/);
    expect(levelText('passive-armor-reduction', 8)).toMatch(/11 Armor/);
  });
});

describe('Passive: Critical', () => {
  it('is unavailable at PL 1–3 and follows Phasing milestones', () => {
    expect(phasingStyleCombatCharges(1)).toBe(0);
    expect(phasingStyleCombatCharges(3)).toBe(0);
    expect(phasingStyleCombatCharges(4)).toBe(1);
    expect(phasingStyleCombatCharges(7)).toBe(1);
    expect(phasingStyleCombatCharges(8)).toBe(2);
    expect(phasingStyleCombatCharges(14)).toBe(2);
    expect(phasingStyleCombatCharges(15)).toBe(3);
    expect(phasingStyleCombatCharges(16)).toBe(3);
    expect(passiveCriticalChargesForLevel(4)).toBe(1);
    expect(passiveCriticalChargesForLevel(8)).toBe(2);
    expect(passiveCriticalChargesForLevel(15)).toBe(3);
    expect(levelText('passive-critical', 1)).toMatch(/Unavailable/i);
    expect(levelText('passive-critical', 4)).toMatch(/1 free Critical/);
  });

  it('is a distinct category', () => {
    expect(getPassiveMechanicalCategories('passive-critical')).toEqual(['critical']);
  });

  it('lists as a separate Crit source and spends exactly one charge', () => {
    const sources = listAvailableCriticalSources({
      buffQuotaRemaining: 1,
      stoneCritCharges: 1,
      passiveCritCharges: 2,
    });
    expect(sources.map((s) => s.source)).toContain('passive-crit');
    const mod = resolveCriticalAttackModifier({
      buffQuotaRemaining: 1,
      stoneCritCharges: 1,
      passiveCritCharges: 2,
      declared: true,
      preferredSource: 'passive-crit',
    });
    expect(mod.applyCritical).toBe(true);
    expect(mod.consumeFrom).toBe('passive-crit');
    expect(mod.explodeFaces).toEqual([7, 8]);
    const state: any = { stoneBonuses: { critRaises: 1 }, criticalQuota: { roundKey: 'c:1', granted: 1, remaining: 1 } };
    expect(applyDeclaredCritSpend(state, mod)).toBe(true);
    expect(state.passiveCritPending).toBe(true);
    expect(state.stoneBonuses.critRaises).toBe(1); // stone not spent
    expect(applyPassiveCriticalSpend({ combatId: 'c', granted: 2, remaining: 2 })?.remaining).toBe(1);
  });

  it('does not amplify when multiple sources are available', () => {
    const mod = resolveCriticalAttackModifier({
      buffQuotaRemaining: 2,
      stoneCritCharges: 2,
      passiveCritCharges: 2,
      declared: true,
    });
    expect(mod.explodeFaces).toEqual([7, 8]);
    expect(mod.consumeFrom).toBe('active-buff'); // single default pick
  });
});

describe('Passive: Maximization', () => {
  it('matches Phasing milestones and is unavailable at PL 1–3', () => {
    expect(passiveMaximizationChargesForLevel(1)).toBe(0);
    expect(passiveMaximizationChargesForLevel(4)).toBe(1);
    expect(passiveMaximizationChargesForLevel(8)).toBe(2);
    expect(passiveMaximizationChargesForLevel(15)).toBe(3);
    expect(levelText('passive-maximization', 2)).toMatch(/Unavailable/i);
    expect(getPassiveMechanicalCategories('passive-maximization')).toEqual(['maximization']);
  });

  it('maximizes remaining dice after negation (artificial 8s)', () => {
    expect(maximizeDamageFormula('10d8')).toBe('80');
    // 10d8 − 4 negation → 6d8 → 48
    expect(maximizeDamageFormula('6d8')).toBe('48');
  });
});

describe('catalogue registration', () => {
  it('includes the three new technical Power identities', () => {
    expect(template('passive-armor-reduction')?.name).toBe('Passive: Armor Reduction');
    expect(template('passive-critical')?.name).toBe('Passive: Critical');
    expect(template('passive-maximization')?.name).toBe('Passive: Maximization');
  });
});
