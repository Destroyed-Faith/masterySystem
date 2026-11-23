/**
 * Unit tests for `applyDefensiveMitigation` — the pure Armor → DR% helper that
 * sits at the heart of the damage pipeline:
 *
 *   1. Armor is subtracted first.
 *   2. Final damage after DR = ceil(Damage × (1 − DR / 100)).
 *   3. Damage reduced to 0 deals 0 (Core v0.9.9.6: no natural-8 minimum).
 *   4. Reaction-DR applies after continuous DR on the remaining damage (sequential
 *      percentages, each step using the Core remaining-damage ceil).
 *   5. The resulting `breakdownLine` reflects the actual sequence for chat
 *      logging (Raw → Armor → DR → result).
 */
import { describe, it, expect } from 'vitest';
import { applyDefensiveMitigation } from '../src/combat/damage-mitigation';

describe('applyDefensiveMitigation', () => {
  it('subtracts flat Armor before applying DR%', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 14,      armorTotal: 4,
      damageReductionPct: 20,
    });
    expect(result.rawDamage).toBe(14);
    expect(result.armorApplied).toBe(4);
    expect(result.drPercent).toBe(20);
    expect(result.mitigatedDamage).toBe(8);    expect(result.breakdownLine).toContain('Raw 14');
    expect(result.breakdownLine).toContain('Armor 4');
    expect(result.breakdownLine).toContain('DR 20%');
  });

  it('deals 0 when Armor and DR reduce the damage to 0, even with natural 8s rolled', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 3,
      armorTotal: 6,
      damageReductionPct: 30,
    });
    expect(result.mitigatedDamage).toBe(0);
    expect(result.breakdownLine).not.toMatch(/8s-min/);
    expect('min8sUsed' in result).toBe(false);
  });

  it('applies Reaction-DR after continuous DR on the remainder (sequential)', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 40,      armorTotal: 0,
      damageReductionPct: 30,
      reactionDrPct: 20,
    });
    // ceil(40 × 0.70) = 28 → ceil(28 × 0.80) = ceil(22.4) = 23
    expect(result.mitigatedDamage).toBe(23);
    expect(result.drPercent).toBe(43);
    expect(result.breakdownLine).toContain('DR 30%');
    expect(result.breakdownLine).toContain('Reaction DR 20%');
  });

  it('clamps each DR% input to 100 and applies sequential remaining-damage ceils', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 10,      armorTotal: 0,
      damageReductionPct: 80,
      reactionDrPct: 80,
    });
    // ceil(10 × 0.20) = 2 → ceil(2 × 0.20) = 1 (stacking order unchanged)
    expect(result.mitigatedDamage).toBe(1);
    expect(
      applyDefensiveMitigation({
        rawDamage: 10,        armorTotal: 0,
        damageReductionPct: 100,
      }).mitigatedDamage,
    ).toBe(0);
  });

  it('treats negative / NaN inputs as zero', () => {
    const result = applyDefensiveMitigation({
      rawDamage: -5 as unknown as number,      armorTotal: -2 as unknown as number,
      damageReductionPct: Number.NaN as unknown as number,
    });
    expect(result.rawDamage).toBe(0);
    expect(result.armorApplied).toBe(0);
    expect(result.drPercent).toBe(0);
    expect(result.mitigatedDamage).toBe(0);
  });

  it('keeps mitigated damage aligned with the breakdown line', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 20,      armorTotal: 5,
      damageReductionPct: 50,
    });
    // 20 − 5 = 15 → ceil(15 × 0.50) = 8
    expect(result.mitigatedDamage).toBe(8);
    expect(result.breakdownLine.endsWith('→ 8')).toBe(true);
    expect(result.breakdownLine).not.toContain('→ →');
  });

  it('shows Guard separately from sheet Armor in the breakdown', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 44,      armorTotal: 11,
      reactionArmorFlat: 8,
      damageReductionPct: 0,
    });
    expect(result.armorApplied).toBe(19);
    expect(result.reactionArmorApplied).toBe(8);
    expect(result.mitigatedDamage).toBe(25);
    expect(result.breakdownLine).toBe('Raw 44 → Armor 11 → Guard +8 → 25');
  });

  it('uses ceil on remaining damage (Core): 10 @ 25% → 8, 13 @ 30% → 10', () => {
    expect(
      applyDefensiveMitigation({
        rawDamage: 10,        armorTotal: 0,
        damageReductionPct: 25,
      }).mitigatedDamage,
    ).toBe(8);
    expect(
      applyDefensiveMitigation({
        rawDamage: 13,        armorTotal: 0,
        damageReductionPct: 30,
      }).mitigatedDamage,
    ).toBe(10);
    expect(
      applyDefensiveMitigation({
        rawDamage: 10,        armorTotal: 0,
        damageReductionPct: 0,
      }).mitigatedDamage,
    ).toBe(10);
    expect(
      applyDefensiveMitigation({
        rawDamage: 10,        armorTotal: 0,
        damageReductionPct: 50,
      }).mitigatedDamage,
    ).toBe(5);
    expect(
      applyDefensiveMitigation({
        rawDamage: 1,        armorTotal: 0,
        damageReductionPct: 25,
      }).mitigatedDamage,
    ).toBe(1);
    expect(
      applyDefensiveMitigation({
        rawDamage: 3,        armorTotal: 0,
        damageReductionPct: 50,
      }).mitigatedDamage,
    ).toBe(2);
    expect(
      applyDefensiveMitigation({
        rawDamage: 0,        armorTotal: 0,
        damageReductionPct: 50,
      }).mitigatedDamage,
    ).toBe(0);
  });

  it('applies Armor before the Core DR remaining-damage ceil', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 20,      armorTotal: 2,
      damageReductionPct: 10,
    });
    // 18 × 0.90 = 16.2 → ceil 17
    expect(result.mitigatedDamage).toBe(17);
  });
});
