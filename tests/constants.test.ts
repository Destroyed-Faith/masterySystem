import { describe, it, expect } from 'vitest';
import {
  EXPLODE_VALUE,
  RAISE_INCREMENT,
  MAX_MASTERY_RANK,
  MAX_ATTRIBUTE,
  MAX_POWER_LEVEL,
  HEALTH_BARS_COUNT,
  HEALTH_PENALTIES,
  INITIATIVE_PER_COLORLESS_STONE,
  CREATION,
  XP_COSTS,
  attributeBandCost,
  powerLevelCost,
  artifactLevelXpCost,
  totalArtifactXpToLevel,
  MR_ADVANCEMENT,
  getDivineScale,
  ECHO_SPEEDS,
  ATTACK_ACTIONS_PER_TURN,
  REACTIONS_PER_ROUND,
} from '../src/utils/constants';

describe('Dice Constants (Player\'s Guide compliance)', () => {
  it('explode value is 8', () => {
    expect(EXPLODE_VALUE).toBe(8);
  });

  it('raise increment is 4 (every +4 over TN = 1 Raise)', () => {
    expect(RAISE_INCREMENT).toBe(4);
  });
});

describe('Attribute Constants', () => {
  it('caps the compressed scale at 40', () => {
    expect(MAX_ATTRIBUTE).toBe(40);
  });
});

describe('Combat Constants', () => {
  it('1 attack action per turn', () => {
    expect(ATTACK_ACTIONS_PER_TURN).toBe(1);
  });

  it('1 reaction per round', () => {
    expect(REACTIONS_PER_ROUND).toBe(1);
  });

  it('max mastery rank is 8 (Godlevel)', () => {
    expect(MAX_MASTERY_RANK).toBe(8);
  });

  it('6 health bars (Healthy, Bruised, Injured, Wounded, Broken, Incapacitated)', () => {
    expect(HEALTH_BARS_COUNT).toBe(6);
  });

  it('health penalties array has 6 entries', () => {
    expect(HEALTH_PENALTIES).toEqual([0, -1, -2, -4, -5, -6]);
  });
});

describe('Initiative Exchange (Player\'s Guide)', () => {
  it('one Temporary Colorless Stone costs 4 × Mastery Rank Initiative', () => {
    expect(INITIATIVE_PER_COLORLESS_STONE).toBe(4);
  });
});

describe('Character Creation Constants', () => {
  it('attribute distribution is 2×4, 2×3, 3×2', () => {
    expect(CREATION.ATTRIBUTE_DISTRIBUTION).toEqual([4, 4, 3, 3, 2, 2, 2]);
    expect(CREATION.ATTRIBUTE_ALLOWED_VALUES).toEqual([2, 3, 4]);
  });

  it('40 skill points', () => {
    expect(CREATION.SKILL_POINTS).toBe(40);
  });

  it('max attribute at creation is 4', () => {
    expect(CREATION.MAX_ATTRIBUTE_AT_CREATION).toBe(4);
  });

  it('max skill at creation is 4', () => {
    expect(CREATION.MAX_SKILL_AT_CREATION).toBe(4);
  });

  it('min disadvantage points at creation is 0 (canonical)', () => {
    expect(CREATION.MIN_DISADVANTAGE_POINTS).toBe(0);
  });

  it('max disadvantage points is 8', () => {
    expect(CREATION.MAX_DISADVANTAGE_POINTS).toBe(8);
  });
});

describe('XP Cost Tables (new spec)', () => {
  it('attribute band table covers the compressed 1..40 scale', () => {
    expect(XP_COSTS.ATTRIBUTE[0]).toEqual({ min: 1, max: 4, cost: 2 });
    expect(XP_COSTS.ATTRIBUTE[1]).toEqual({ min: 5, max: 8, cost: 4 });
    expect(XP_COSTS.ATTRIBUTE[9]).toEqual({ min: 37, max: 40, cost: 20 });
    expect(XP_COSTS.ATTRIBUTE).toHaveLength(10);
  });

  it('skills keep the 1..32 bands and do not alias attributes', () => {
    expect(XP_COSTS.SKILL).not.toBe(XP_COSTS.ATTRIBUTE);
    expect(XP_COSTS.SKILL[0]).toEqual({ min: 1, max: 8, cost: 1 });
    expect(XP_COSTS.SKILL[3]).toEqual({ min: 25, max: 32, cost: 4 });
  });

  it('attributeBandCost uses the compressed 4-wide doubled bands', () => {
    expect(attributeBandCost(1)).toBe(2);
    expect(attributeBandCost(4)).toBe(2);
    expect(attributeBandCost(5)).toBe(4);
    expect(attributeBandCost(8)).toBe(4);
    expect(attributeBandCost(9)).toBe(6);
    expect(attributeBandCost(40)).toBe(20);
    expect(attributeBandCost(41)).toBe(0);
  });

  it('power level cost array runs 2..32 (2 × level) for levels 1..16', () => {
    expect(XP_COSTS.POWER_LEVEL).toHaveLength(16);
    for (let i = 0; i < 16; i++) {
      expect(XP_COSTS.POWER_LEVEL[i]).toBe(2 * (i + 1));
    }
  });

  it('powerLevelCost returns 2 × level for levels 1..16, 0 otherwise', () => {
    expect(powerLevelCost(0)).toBe(0);
    expect(powerLevelCost(1)).toBe(2);
    expect(powerLevelCost(8)).toBe(16);
    expect(powerLevelCost(16)).toBe(32);
    expect(powerLevelCost(17)).toBe(0);
  });

  it('MAX_POWER_LEVEL is 16', () => {
    expect(MAX_POWER_LEVEL).toBe(16);
  });

  it('artifact level XP is banded by the new level reached', () => {
    expect(XP_COSTS.ARTIFACT_LEVEL).toBe(8); // deprecated L2/L3 alias
    expect(artifactLevelXpCost(1)).toBe(0);
    expect(artifactLevelXpCost(2)).toBe(8);
    expect(artifactLevelXpCost(3)).toBe(8);
    expect(artifactLevelXpCost(4)).toBe(16);
    expect(artifactLevelXpCost(5)).toBe(16);
    expect(artifactLevelXpCost(6)).toBe(16);
    expect(artifactLevelXpCost(7)).toBe(32);
    expect(artifactLevelXpCost(8)).toBe(32);
    expect(artifactLevelXpCost(9)).toBe(32);
    expect(artifactLevelXpCost(10)).toBe(64);
    expect(totalArtifactXpToLevel(10)).toBe(224);
  });

  it('retired tree / artifact-access constants are gone', () => {
    expect((XP_COSTS as any).NEW_TREE).toBeUndefined();
    expect((XP_COSTS as any).ARTIFACT_ACCESS).toBeUndefined();
    expect((XP_COSTS as any).SKILL_PER_RANK).toBeUndefined();
  });
});

describe('Mastery Rank Advancement (Lifetime XP)', () => {
  it('starts at MR2 with 0 XP and 2 Stones', () => {
    expect(MR_ADVANCEMENT[0]).toEqual({ lifetimeXp: 0, stones: 2, mr: 2, tier: 'Adept' });
  });

  it('advances to MR3 at 100 XP', () => {
    expect(MR_ADVANCEMENT[1]).toEqual({ lifetimeXp: 100, stones: 7, mr: 3, tier: 'Expert' });
  });

  it('advances to MR4 at 200 XP', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 4);
    expect(row).toEqual({ lifetimeXp: 200, stones: 12, mr: 4, tier: 'Master' });
  });

  it('advances to MR5 at 400 XP', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 5);
    expect(row).toEqual({ lifetimeXp: 400, stones: 22, mr: 5, tier: 'Grandmaster' });
  });

  it('advances to MR6 at 600 XP', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 6);
    expect(row).toEqual({ lifetimeXp: 600, stones: 32, mr: 6, tier: 'Legend' });
  });

  it('advances to MR7 at 800 XP', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 7);
    expect(row).toEqual({ lifetimeXp: 800, stones: 42, mr: 7, tier: 'Mythic' });
  });

  it('advances to MR8 at 1000 XP', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 8);
    expect(row).toEqual({ lifetimeXp: 1000, stones: 52, mr: 8, tier: 'Godlevel' });
  });
});

describe('Divine Scale (MR8 sub-tier)', () => {
  it('returns null below MR8 (52 stones / 1000 XP)', () => {
    expect(getDivineScale(0)).toBeNull();
    expect(getDivineScale(50)).toBeNull();
    expect(getDivineScale(51)).toBeNull();
  });

  it('Lesser God for 52-55 stones', () => {
    expect(getDivineScale(52)).toBe('Lesser God');
    expect(getDivineScale(55)).toBe('Lesser God');
  });

  it('True God for 56-63 stones', () => {
    expect(getDivineScale(56)).toBe('True God');
    expect(getDivineScale(63)).toBe('True God');
  });

  it('High God for 64-69 stones', () => {
    expect(getDivineScale(64)).toBe('High God');
    expect(getDivineScale(69)).toBe('High God');
  });

  it('Apex God for 70-111 stones and System Limit at 112', () => {
    expect(getDivineScale(70)).toBe('Apex God');
    expect(getDivineScale(111)).toBe('Apex God');
    expect(getDivineScale(112)).toBe('System Limit');
    expect(getDivineScale(120)).toBe('System Limit');
  });
});



describe('Echo Speeds', () => {
  it('human speed is 8m', () => expect(ECHO_SPEEDS.human).toBe(8));
  it('dwarf speed is 8m', () => expect(ECHO_SPEEDS.dwarf).toBe(8));
  it('halfling speed is 8m', () => expect(ECHO_SPEEDS.halfling).toBe(8));
  it('elorian speed is 8m', () => expect(ECHO_SPEEDS.elorian).toBe(8));
  it('titanborn speed is 8m', () => expect(ECHO_SPEEDS.titanborn).toBe(8));
});
