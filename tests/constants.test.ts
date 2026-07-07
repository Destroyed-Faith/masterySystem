import { describe, it, expect } from 'vitest';
import {
  EXPLODE_VALUE,
  RAISE_INCREMENT,
  MAX_MASTERY_RANK,
  MAX_ATTRIBUTE,
  MAX_POWER_LEVEL,
  HEALTH_BARS_COUNT,
  HEALTH_PENALTIES,
  INITIATIVE_SHOP,
  CREATION,
  XP_COSTS,
  attributeBandCost,
  powerLevelCost,
  MR_ADVANCEMENT,
  getDivineScale,
  SAVING_THROWS,
  SAVE_DC_BY_MR,
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
  it('extends to 80 to cover the new MR2-MR8 progression band', () => {
    expect(MAX_ATTRIBUTE).toBe(80);
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

describe('Initiative Shop Costs (Player\'s Guide)', () => {
  it('movement costs 4 per +2m', () => {
    expect(INITIATIVE_SHOP.MOVEMENT.COST).toBe(4);
    expect(INITIATIVE_SHOP.MOVEMENT.INCREMENT).toBe(2);
  });

  it('initiative swap costs 8', () => {
    expect(INITIATIVE_SHOP.SWAP.COST).toBe(8);
  });

  it('extra reaction costs 12', () => {
    expect(INITIATIVE_SHOP.EXTRA_REACTION.COST).toBe(12);
  });

  it('remove stress costs 16', () => {
    expect(INITIATIVE_SHOP.REMOVE_STRESS.COST).toBe(16);
  });

  it('extra attack costs 20', () => {
    expect(INITIATIVE_SHOP.EXTRA_ATTACK.COST).toBe(20);
  });
});

describe('Character Creation Constants', () => {
  it('attribute distribution is 2×8, 2×6, 2×4, 1×2', () => {
    expect(CREATION.ATTRIBUTE_DISTRIBUTION).toEqual([8, 8, 6, 6, 4, 4, 2]);
    expect(CREATION.ATTRIBUTE_ALLOWED_VALUES).toEqual([2, 4, 6, 8]);
  });

  it('40 skill points', () => {
    expect(CREATION.SKILL_POINTS).toBe(40);
  });

  it('max attribute at creation is 8', () => {
    expect(CREATION.MAX_ATTRIBUTE_AT_CREATION).toBe(8);
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
  it('attribute band table covers values 1..80 with cost 1..10', () => {
    expect(XP_COSTS.ATTRIBUTE[0]).toEqual({ min: 1, max: 8, cost: 1 });
    expect(XP_COSTS.ATTRIBUTE[1]).toEqual({ min: 9, max: 16, cost: 2 });
    expect(XP_COSTS.ATTRIBUTE[2]).toEqual({ min: 17, max: 24, cost: 3 });
    expect(XP_COSTS.ATTRIBUTE[3]).toEqual({ min: 25, max: 32, cost: 4 });
    expect(XP_COSTS.ATTRIBUTE[9]).toEqual({ min: 73, max: 80, cost: 10 });
    expect(XP_COSTS.ATTRIBUTE).toHaveLength(10);
  });

  it('skills share the attribute band (SKILL aliases ATTRIBUTE)', () => {
    expect(XP_COSTS.SKILL).toBe(XP_COSTS.ATTRIBUTE);
  });

  it('attributeBandCost returns floor((v - 1) / 8) + 1', () => {
    expect(attributeBandCost(1)).toBe(1);
    expect(attributeBandCost(8)).toBe(1);
    expect(attributeBandCost(9)).toBe(2);
    expect(attributeBandCost(16)).toBe(2);
    expect(attributeBandCost(17)).toBe(3);
    expect(attributeBandCost(32)).toBe(4);
    expect(attributeBandCost(40)).toBe(5);
    expect(attributeBandCost(72)).toBe(9);
    expect(attributeBandCost(73)).toBe(10);
    expect(attributeBandCost(80)).toBe(10);
  });

  it('power level cost array runs 1..16 for levels 1..16', () => {
    expect(XP_COSTS.POWER_LEVEL).toHaveLength(16);
    for (let i = 0; i < 16; i++) {
      expect(XP_COSTS.POWER_LEVEL[i]).toBe(i + 1);
    }
  });

  it('powerLevelCost returns the level for levels 1..16, 0 otherwise', () => {
    expect(powerLevelCost(0)).toBe(0);
    expect(powerLevelCost(1)).toBe(1);
    expect(powerLevelCost(8)).toBe(8);
    expect(powerLevelCost(16)).toBe(16);
    expect(powerLevelCost(17)).toBe(0);
  });

  it('MAX_POWER_LEVEL is 16', () => {
    expect(MAX_POWER_LEVEL).toBe(16);
  });

  it('artifact level costs 8 XP per +1', () => {
    expect(XP_COSTS.ARTIFACT_LEVEL).toBe(8);
  });

  it('retired tree / artifact-access constants are gone', () => {
    expect((XP_COSTS as any).NEW_TREE).toBeUndefined();
    expect((XP_COSTS as any).ARTIFACT_ACCESS).toBeUndefined();
    expect((XP_COSTS as any).SKILL_PER_RANK).toBeUndefined();
  });
});

describe('Mastery Rank Advancement (MR2-MR8)', () => {
  it('starts at MR2 with 1 stone', () => {
    expect(MR_ADVANCEMENT[0]).toEqual({ stones: 1, mr: 2, tier: 'Adept' });
  });

  it('advances to MR3 at 8 stones', () => {
    expect(MR_ADVANCEMENT[1]).toEqual({ stones: 8, mr: 3, tier: 'Expert' });
  });

  it('advances to MR4 at 14 stones', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 4);
    expect(row).toEqual({ stones: 14, mr: 4, tier: 'Master' });
  });

  it('advances to MR5 at 21 stones', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 5);
    expect(row).toEqual({ stones: 21, mr: 5, tier: 'Grandmaster' });
  });

  it('advances to MR6 at 30 stones', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 6);
    expect(row).toEqual({ stones: 30, mr: 6, tier: 'Legend' });
  });

  it('advances to MR7 (Mythic) at 40 stones', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 7);
    expect(row).toEqual({ stones: 40, mr: 7, tier: 'Mythic' });
  });

  it('advances to MR8 (Godlevel) at 50 stones', () => {
    const row = MR_ADVANCEMENT.find(a => a.mr === 8);
    expect(row).toEqual({ stones: 50, mr: 8, tier: 'Godlevel' });
  });
});

describe('Divine Scale (MR8 sub-tier)', () => {
  it('returns null below 50 stones', () => {
    expect(getDivineScale(0)).toBeNull();
    expect(getDivineScale(49)).toBeNull();
  });

  it('Lesser God for 50-55 stones', () => {
    expect(getDivineScale(50)).toBe('Lesser God');
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

  it('Apex God for 70+ stones', () => {
    expect(getDivineScale(70)).toBe('Apex God');
    expect(getDivineScale(120)).toBe('Apex God');
  });
});

describe('Saving Throws', () => {
  it('Body saves use Might or Agility', () => {
    expect(SAVING_THROWS.body).toEqual(['might', 'agility']);
  });

  it('Mind saves use Intellect or Wits', () => {
    expect(SAVING_THROWS.mind).toEqual(['intellect', 'wits']);
  });

  it('Spirit saves use Resolve or Influence', () => {
    expect(SAVING_THROWS.spirit).toEqual(['resolve', 'influence']);
  });
});

describe('Save DC by Mastery Rank', () => {
  it('M1 DC = 8', () => expect(SAVE_DC_BY_MR[1]).toBe(8));
  it('M2 DC = 16', () => expect(SAVE_DC_BY_MR[2]).toBe(16));
  it('M3 DC = 24', () => expect(SAVE_DC_BY_MR[3]).toBe(24));
  it('M4 DC = 32', () => expect(SAVE_DC_BY_MR[4]).toBe(32));
  it('M5 DC = 40', () => expect(SAVE_DC_BY_MR[5]).toBe(40));
  it('M6 DC = 48', () => expect(SAVE_DC_BY_MR[6]).toBe(48));
  it('M7 DC = 56', () => expect(SAVE_DC_BY_MR[7]).toBe(56));
  it('M8 DC = 64', () => expect(SAVE_DC_BY_MR[8]).toBe(64));
});

describe('Echo Speeds', () => {
  it('human speed is 10m', () => expect(ECHO_SPEEDS.human).toBe(10));
  it('dwarf speed is 9m', () => expect(ECHO_SPEEDS.dwarf).toBe(9));
  it('halfling speed is 8m', () => expect(ECHO_SPEEDS.halfling).toBe(8));
  it('elorian speed is 12m', () => expect(ECHO_SPEEDS.elorian).toBe(12));
  it('titanborn speed is 12m', () => expect(ECHO_SPEEDS.titanborn).toBe(12));
});
