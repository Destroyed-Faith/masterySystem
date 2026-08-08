import { describe, it, expect } from 'vitest';
import {
  calculateStones,
  calculateTotalStones,
  calculateHealthBarMax,
  initializeHealthBars,
  getCurrentPenalty,
  applyDamage,
  healDamage,
  restoreHealthBarsFrom,
  calculateStressBarMax,
  initializeStressBars,
  applyStress,
  calculateMaxSkillRank,
  calculateMaxPowerLevel,
  validateSkillValue,
} from '../src/utils/calculations';
import { MAX_POWER_LEVEL } from '../src/utils/constants';

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

  it('initializes 6 health bars with correct penalties', () => {
    const bars = initializeHealthBars(8);
    expect(bars).toHaveLength(6);
    expect(bars[0]).toEqual({ name: 'Healthy', max: 16, current: 16, penalty: 0 });
    expect(bars[1]).toEqual({ name: 'Bruised', max: 16, current: 16, penalty: -1 });
    expect(bars[2]).toEqual({ name: 'Injured', max: 16, current: 16, penalty: -2 });
    expect(bars[3]).toEqual({ name: 'Wounded', max: 16, current: 16, penalty: -4 });
    expect(bars[4]).toEqual({ name: 'Broken', max: 16, current: 16, penalty: -5 });
    expect(bars[5]).toEqual({ name: 'Incapacitated', max: 1, current: 1, penalty: -6 });
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

  it('returns 0 from Healthy when it is the first bar with any damage', () => {
    const bars = initializeHealthBars(8);
    bars[0].current = 0; // Healthy depleted
    bars[1].current = 0; // Bruised depleted
    bars[2].current = 10; // Injured partially damaged
    // First "broken" bar in index order is 0 (0 < max) → its penalty is 0.
    expect(getCurrentPenalty(bars, 0)).toBe(0);
  });

  it('returns -2 when first damaged bar in order is Injured (Healthy and Bruised full)', () => {
    const bars = initializeHealthBars(8);
    bars[0].current = 16;
    bars[1].current = 16;
    bars[2].current = 8;
    expect(getCurrentPenalty(bars, 0)).toBe(-2);
  });

  it('applies damage from a later start index (legacy) before inner pools', () => {
    const bars = initializeHealthBars(8);
    // Start at "Wounded" bar (3): 1 point comes off that pool first
    const idx = applyDamage(bars, 3, 1);
    expect(bars[0].current).toBe(16);
    expect(bars[1].current).toBe(16);
    expect(bars[2].current).toBe(16);
    expect(bars[3].current).toBe(15);
    expect(idx).toBe(3);
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

  it('GM restore from Bruised tops Bruised through Incapacitated, leaves Healthy', () => {
    const bars = initializeHealthBars(8);
    bars[0].current = 4;
    bars[1].current = 2;
    bars[2].current = 0;
    bars[5].current = 0;
    const currentBar = restoreHealthBarsFrom(bars, 1);
    expect(bars[0].current).toBe(4); // Healthy untouched
    expect(bars[1].current).toBe(16);
    expect(bars[2].current).toBe(16);
    expect(bars[5].current).toBe(1); // Incapacitated max = 1
    expect(currentBar).toBe(0); // Healthy still damaged → active bar
  });

  it('GM restore from Healthy tops every bar', () => {
    const bars = initializeHealthBars(8);
    for (const b of bars) b.current = 0;
    const currentBar = restoreHealthBarsFrom(bars, 0);
    expect(bars.every((b) => b.current === b.max)).toBe(true);
    expect(currentBar).toBe(0);
  });

  describe('percentage-of-pool penalty (with pool argument)', () => {
    const brokenAt = (index: number) => {
      const bars = initializeHealthBars(8);
      for (let i = 0; i < index; i++) bars[i].current = bars[i].max; // keep full
      bars[index].current = bars[index].max - 1; // first broken bar
      return bars;
    };

    it('Injured (−20%) on a pool of 8 → −1 die (floor 1.6)', () => {
      // Matches the worked example: Agility 16 halved to 8, Injured = −1.
      expect(getCurrentPenalty(brokenAt(2), 0, 8)).toBe(-1);
    });

    it('Wounded (−40%) on a pool of 8 → −3 dice (floor 3.2)', () => {
      expect(getCurrentPenalty(brokenAt(3), 0, 8)).toBe(-3);
    });

    it('Broken (−50%) on a pool of 8 → −4 dice', () => {
      expect(getCurrentPenalty(brokenAt(4), 0, 8)).toBe(-4);
    });

    it('Bruised (−10%) on a small pool of 8 floors to 0', () => {
      expect(getCurrentPenalty(brokenAt(1), 0, 8)).toBe(0);
    });

    it('Bruised (−10%) on a pool of 20 → −2 dice', () => {
      expect(getCurrentPenalty(brokenAt(1), 0, 20)).toBe(-2);
    });

    it('Healthy bar broken → no penalty regardless of pool', () => {
      expect(getCurrentPenalty(brokenAt(0), 0, 20)).toBe(0);
    });
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

describe('Skill Calculations (MR × 4 cap)', () => {
  it('returns MR × 4 for each Mastery Rank', () => {
    expect(calculateMaxSkillRank(1)).toBe(4);
    expect(calculateMaxSkillRank(2)).toBe(8);
    expect(calculateMaxSkillRank(3)).toBe(12);
    expect(calculateMaxSkillRank(4)).toBe(16);
    expect(calculateMaxSkillRank(8)).toBe(32);
  });

  it('validates skill value against the MR × 4 cap', () => {
    expect(validateSkillValue(8, 2)).toBe(8);
    expect(validateSkillValue(9, 2)).toBe(8);
    expect(validateSkillValue(12, 3)).toBe(12);
    expect(validateSkillValue(13, 3)).toBe(12);
    expect(validateSkillValue(50, 8)).toBe(32);
  });
});

describe('Power Level Cap by Mastery Rank (new spec)', () => {
  it('caps at 4 for MR1-MR2', () => {
    expect(calculateMaxPowerLevel(1)).toBe(4);
    expect(calculateMaxPowerLevel(2)).toBe(4);
  });

  it('caps at 8 for MR3', () => {
    expect(calculateMaxPowerLevel(3)).toBe(8);
  });

  it('caps at 12 for MR4', () => {
    expect(calculateMaxPowerLevel(4)).toBe(12);
  });

  it('caps at 16 for MR5+', () => {
    expect(calculateMaxPowerLevel(5)).toBe(MAX_POWER_LEVEL);
    expect(calculateMaxPowerLevel(6)).toBe(MAX_POWER_LEVEL);
    expect(calculateMaxPowerLevel(7)).toBe(MAX_POWER_LEVEL);
    expect(calculateMaxPowerLevel(8)).toBe(MAX_POWER_LEVEL);
    expect(MAX_POWER_LEVEL).toBe(16);
  });
});
