import { describe, it, expect } from 'vitest';
import {
  calculateStones,
  calculateTotalStones,
  calculateHealthBarMax,
  initializeHealthBars,
  getCurrentPenalty,
  applyDamage,
  healDamage,
  calculateStressBarMax,
  initializeStressBars,
  applyStress,
  calculateMaxSkillRank,
  validateSkillValue,
} from '../src/utils/calculations';

describe('Stone Calculations', () => {
  it('calculates stones as floor(attribute/8)', () => {
    expect(calculateStones(0)).toBe(0);
    expect(calculateStones(1)).toBe(0);
    expect(calculateStones(7)).toBe(0);
    expect(calculateStones(8)).toBe(1);
    expect(calculateStones(9)).toBe(1);
    expect(calculateStones(15)).toBe(1);
    expect(calculateStones(16)).toBe(2);
    expect(calculateStones(24)).toBe(3);
    expect(calculateStones(32)).toBe(4);
    expect(calculateStones(80)).toBe(10);
  });

  it('calculates total stones from all attributes', () => {
    const attrs = {
      might: { value: 8, stones: 1 },
      agility: { value: 2, stones: 0 },
      vitality: { value: 8, stones: 1 },
      intellect: { value: 2, stones: 0 },
      resolve: { value: 2, stones: 0 },
      influence: { value: 2, stones: 0 },
      wits: { value: 6, stones: 0 },
    };
    expect(calculateTotalStones(attrs as any)).toBe(2);
  });

  it('handles zero attributes for total stones', () => {
    const attrs = {
      might: { value: 0, stones: 0 },
      agility: { value: 0, stones: 0 },
      vitality: { value: 0, stones: 0 },
      intellect: { value: 0, stones: 0 },
      resolve: { value: 0, stones: 0 },
      influence: { value: 0, stones: 0 },
      wits: { value: 0, stones: 0 },
    };
    expect(calculateTotalStones(attrs as any)).toBe(0);
  });
});

describe('Health Bar Calculations', () => {
  it('calculates health bar max as Vitality * 2', () => {
    expect(calculateHealthBarMax(2)).toBe(4);
    expect(calculateHealthBarMax(6)).toBe(12);
    expect(calculateHealthBarMax(8)).toBe(16);
    expect(calculateHealthBarMax(16)).toBe(32);
  });

  it('initializes 4 health bars with correct penalties', () => {
    const bars = initializeHealthBars(8);
    expect(bars).toHaveLength(4);
    expect(bars[0]).toEqual({ name: 'Healthy', max: 16, current: 16, penalty: 0 });
    expect(bars[1]).toEqual({ name: 'Bruised', max: 16, current: 16, penalty: -1 });
    expect(bars[2]).toEqual({ name: 'Injured', max: 16, current: 16, penalty: -2 });
    expect(bars[3]).toEqual({ name: 'Wounded', max: 16, current: 16, penalty: -4 });
  });

  it('returns 0 penalty when no bars are broken', () => {
    const bars = initializeHealthBars(8);
    expect(getCurrentPenalty(bars, 0)).toBe(0);
  });

  it('returns correct penalty when first bar is broken', () => {
    const bars = initializeHealthBars(8);
    bars[0].current = 10; // Healthy bar partially damaged
    expect(getCurrentPenalty(bars, 0)).toBe(0); // Healthy bar has penalty=0
  });

  it('returns -1 penalty when Bruised bar is the first broken', () => {
    const bars = initializeHealthBars(8);
    bars[0].current = 16; // Healthy full
    bars[1].current = 10; // Bruised partially damaged
    expect(getCurrentPenalty(bars, 1)).toBe(-1);
  });

  it('returns -2 penalty when Injured bar is the first broken', () => {
    const bars = initializeHealthBars(8);
    bars[0].current = 0; // Healthy depleted
    bars[1].current = 0; // Bruised depleted
    bars[2].current = 10; // Injured partially damaged
    expect(getCurrentPenalty(bars, 2)).toBe(0); // Healthy (index 0) has current=0 < max=16, penalty=0
  });

  it('applies damage with overflow between bars', () => {
    const bars = initializeHealthBars(8);
    const newBar = applyDamage(bars, 0, 20); // 20 damage, bar max is 16
    expect(bars[0].current).toBe(0); // Healthy fully depleted
    expect(bars[1].current).toBe(12); // 4 overflow into Bruised (16-4=12)
    expect(newBar).toBe(1);
  });

  it('applies damage that depletes multiple bars', () => {
    const bars = initializeHealthBars(4); // Each bar max = 8
    const newBar = applyDamage(bars, 0, 20); // 20 damage across 8+8+4
    expect(bars[0].current).toBe(0);
    expect(bars[1].current).toBe(0);
    expect(bars[2].current).toBe(4); // 20 - 8 - 8 = 4 overflow, 8-4=4 remaining
    expect(newBar).toBe(2);
  });

  it('heals only within current bar', () => {
    const bars = initializeHealthBars(8);
    bars[1].current = 5; // Bruised at 5/16
    healDamage(bars, 1, 100);
    expect(bars[1].current).toBe(16); // Capped at max
    expect(bars[0].current).toBe(16); // Healthy unchanged
  });
});

describe('Stress Bar Calculations', () => {
  it('calculates stress bar max as Resolve + Intellect', () => {
    expect(calculateStressBarMax(2, 2)).toBe(4);
    expect(calculateStressBarMax(8, 6)).toBe(14);
    expect(calculateStressBarMax(4, 8)).toBe(12);
  });

  it('initializes 4 stress bars with zero penalties', () => {
    const bars = initializeStressBars(4, 4);
    expect(bars).toHaveLength(4);
    expect(bars[0]).toEqual({ name: 'Healthy', max: 8, current: 8, penalty: 0 });
    expect(bars[1]).toEqual({ name: 'Stressed', max: 8, current: 8, penalty: 0 });
    expect(bars[2]).toEqual({ name: 'Not Well', max: 8, current: 8, penalty: 0 });
    expect(bars[3]).toEqual({ name: 'Breaking', max: 8, current: 8, penalty: 0 });
  });

  it('applies stress with overflow', () => {
    const bars = initializeStressBars(4, 4); // Each bar max = 8
    const newBar = applyStress(bars, 0, 10);
    expect(bars[0].current).toBe(0); // Depleted
    expect(bars[1].current).toBe(6); // 10 - 8 = 2 overflow, 8-2=6
    expect(newBar).toBe(1);
  });
});

describe('Skill Calculations', () => {
  it('calculates max skill rank as 4 * MR', () => {
    expect(calculateMaxSkillRank(1)).toBe(4);
    expect(calculateMaxSkillRank(2)).toBe(8);
    expect(calculateMaxSkillRank(3)).toBe(12);
    expect(calculateMaxSkillRank(4)).toBe(16);
    expect(calculateMaxSkillRank(8)).toBe(32);
  });

  it('validates skill value against MR cap', () => {
    expect(validateSkillValue(4, 1)).toBe(4); // At max
    expect(validateSkillValue(5, 1)).toBe(4); // Over max, clamped
    expect(validateSkillValue(8, 2)).toBe(8); // At max
    expect(validateSkillValue(10, 2)).toBe(8); // Over max, clamped
    expect(validateSkillValue(3, 2)).toBe(3); // Under max, unchanged
  });
});
