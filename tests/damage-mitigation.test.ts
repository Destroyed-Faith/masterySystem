/**
 * Unit tests for `applyDefensiveMitigation` — the pure Armor → DR% → 8s-min
 * helper that sits at the heart of the damage pipeline. These tests cover
 * the five load-bearing behaviours from the plan:
 *
 *   1. Armor is subtracted first.
 *   2. DR% reduction amount is rounded up (defender-favorable).
 *   3. The 8s-minimum rule kicks in when reduced damage ≤ 0.
 *   4. Reaction-DR applies after continuous DR on the remaining damage (sequential
 *      percentages, each reduction ceil'd defender-favorably).
 *   5. The resulting `breakdownLine` reflects the actual sequence for chat
 *      logging (Raw → Armor → DR → 8s-min → result).
 */
import { describe, it, expect } from 'vitest';
import {
  applyDefensiveMitigation,
  countNaturalEights,
  countNaturalEightsInRoll,
} from '../src/combat/damage-mitigation';

describe('applyDefensiveMitigation', () => {
  it('subtracts flat Armor before applying DR%', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 14,
      count8s: 0,
      armorTotal: 4,
      damageReductionPct: 20,
    });
    expect(result.rawDamage).toBe(14);
    expect(result.armorApplied).toBe(4);
    expect(result.drPercent).toBe(20);
    expect(result.mitigatedDamage).toBe(8);
    expect(result.min8sUsed).toBe(false);
    expect(result.breakdownLine).toContain('Raw 14');
    expect(result.breakdownLine).toContain('Armor 4');
    expect(result.breakdownLine).toContain('DR 20%');
  });

  it('uses the 8s-minimum rule when post-mitigation damage drops to 0', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 3,
      count8s: 2,
      armorTotal: 6,
      damageReductionPct: 30,
    });
    expect(result.mitigatedDamage).toBe(2);
    expect(result.min8sUsed).toBe(true);
    expect(result.breakdownLine).toContain('8s-min 2');
  });

  it('does not invoke the 8s-minimum when no natural 8 was rolled', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 3,
      count8s: 0,
      armorTotal: 10,
      damageReductionPct: 50,
    });
    expect(result.mitigatedDamage).toBe(0);
    expect(result.min8sUsed).toBe(false);
  });

  it('applies Reaction-DR after continuous DR on the remainder (sequential)', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 40,
      count8s: 0,
      armorTotal: 0,
      damageReductionPct: 30,
      reactionDrPct: 20,
    });
    // 40 − 30% (12) = 28 → 20% of 28 = ceil(5.6) = 6 off → 22
    expect(result.mitigatedDamage).toBe(22);
    expect(result.drPercent).toBe(45);
    expect(result.breakdownLine).toContain('DR 30%');
    expect(result.breakdownLine).toContain('Reaction DR 20%');
  });

  it('clamps DR% values above 100', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 10,
      count8s: 0,
      armorTotal: 0,
      damageReductionPct: 80,
      reactionDrPct: 80,
    });
    expect(result.drPercent).toBe(100);
    expect(result.mitigatedDamage).toBe(0);
  });

  it('treats negative / NaN inputs as zero', () => {
    const result = applyDefensiveMitigation({
      rawDamage: -5 as unknown as number,
      count8s: Number.NaN as unknown as number,
      armorTotal: -2 as unknown as number,
      damageReductionPct: Number.NaN as unknown as number,
    });
    expect(result.rawDamage).toBe(0);
    expect(result.armorApplied).toBe(0);
    expect(result.drPercent).toBe(0);
    expect(result.mitigatedDamage).toBe(0);
  });

  it('keeps mitigated damage aligned with the breakdown line', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 20,
      count8s: 1,
      armorTotal: 5,
      damageReductionPct: 50,
    });
    // 20 − 5 = 15 → 50% reduction ceils to 8 off → 7 (8s-min not used; 7 > 0)
    expect(result.mitigatedDamage).toBe(7);
    expect(result.breakdownLine.endsWith('→ 7')).toBe(true);
  });

  it('favors defender on fractional DR% (e.g. 10% of 18 after armor)', () => {
    const result = applyDefensiveMitigation({
      rawDamage: 20,
      count8s: 0,
      armorTotal: 2,
      damageReductionPct: 10,
    });
    expect(result.mitigatedDamage).toBe(16);
  });
});

describe('countNaturalEights', () => {
  it('returns 0 for a null/empty roll', () => {
    expect(countNaturalEightsInRoll(null)).toBe(0);
    expect(countNaturalEightsInRoll({})).toBe(0);
  });

  it('counts every natural 8 across d8 terms, including explosion triggers', () => {
    const roll = {
      terms: [
        {
          faces: 8,
          results: [
            { result: 8, active: true },
            { result: 3, active: true },
            { result: 8, active: false },
            { result: 5, active: true },
          ],
        },
      ],
    };
    expect(countNaturalEightsInRoll(roll)).toBe(2);
  });

  it('ignores non-d8 dice and malformed rolls', () => {
    const roll = {
      terms: [
        { faces: 6, results: [{ result: 8 }] },
        { faces: 8, results: 'bogus' },
      ],
    };
    expect(countNaturalEightsInRoll(roll)).toBe(0);
  });

  it('sums natural 8s across multiple rolls', () => {
    const rolls = [
      { terms: [{ faces: 8, results: [{ result: 8 }, { result: 8 }] }] },
      { terms: [{ faces: 8, results: [{ result: 4 }, { result: 8 }] }] },
    ];
    expect(countNaturalEights(rolls)).toBe(3);
  });
});
