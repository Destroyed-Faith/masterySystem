import { describe, it, expect } from 'vitest';
import {
  EXPLODE_VALUE,
  RAISE_INCREMENT,
  MAX_MASTERY_RANK,
  MAX_ATTRIBUTE,
  HEALTH_BARS_COUNT,
  HEALTH_PENALTIES,
  INITIATIVE_SHOP,
  CREATION,
  XP_COSTS,
  MR_ADVANCEMENT,
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
  it('max attribute allows high-tier progression (33+)', () => {
    expect(MAX_ATTRIBUTE).toBeGreaterThanOrEqual(32);
  });
});

describe('Combat Constants', () => {
  it('1 attack action per turn', () => {
    expect(ATTACK_ACTIONS_PER_TURN).toBe(1);
  });

  it('1 reaction per round', () => {
    expect(REACTIONS_PER_ROUND).toBe(1);
  });

  it('max mastery rank is 8', () => {
    expect(MAX_MASTERY_RANK).toBe(8);
  });

  it('4 health bars (Healthy, Bruised, Injured, Wounded)', () => {
    expect(HEALTH_BARS_COUNT).toBe(4);
  });

  it('health penalties are [0, -1, -2, -4]', () => {
    expect(HEALTH_PENALTIES).toEqual([0, -1, -2, -4]);
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

  it('16 skill points', () => {
    expect(CREATION.SKILL_POINTS).toBe(16);
  });

  it('max attribute at creation is 8', () => {
    expect(CREATION.MAX_ATTRIBUTE_AT_CREATION).toBe(8);
  });

  it('max skill at creation is 4', () => {
    expect(CREATION.MAX_SKILL_AT_CREATION).toBe(4);
  });

  it('max disadvantage points is 8', () => {
    expect(CREATION.MAX_DISADVANTAGE_POINTS).toBe(8);
  });
});

describe('XP Cost Tables (Player\'s Guide)', () => {
  it('attribute costs scale by tier', () => {
    expect(XP_COSTS.ATTRIBUTE[0]).toEqual({ min: 0, max: 8, cost: 1 });
    expect(XP_COSTS.ATTRIBUTE[1]).toEqual({ min: 9, max: 16, cost: 2 });
    expect(XP_COSTS.ATTRIBUTE[2]).toEqual({ min: 17, max: 24, cost: 3 });
    expect(XP_COSTS.ATTRIBUTE[3]).toEqual({ min: 25, max: 32, cost: 4 });
  });

  it('skill cost is new_rank * 2', () => {
    expect(XP_COSTS.SKILL_PER_RANK).toBe(2);
  });

  it('power level costs are correct', () => {
    expect(XP_COSTS.POWER_LEVEL[0]).toBe(2);  // Level 1
    expect(XP_COSTS.POWER_LEVEL[1]).toBe(4);  // Level 2
    expect(XP_COSTS.POWER_LEVEL[2]).toBe(8);  // Level 3
    expect(XP_COSTS.POWER_LEVEL[3]).toBe(16); // Level 4
    expect(XP_COSTS.POWER_LEVEL[4]).toBe(24); // Level 5
    expect(XP_COSTS.POWER_LEVEL[5]).toBe(32); // Level 6
    for (let i = 6; i < 12; i++) {
      expect(XP_COSTS.POWER_LEVEL[i]).toBe(40); // Levels 7-12
    }
  });

  it('new tree costs 1 XP', () => {
    expect(XP_COSTS.NEW_TREE).toBe(1);
  });

  it('artifact access costs 1 XP', () => {
    expect(XP_COSTS.ARTIFACT_ACCESS).toBe(1);
  });

  it('artifact level costs 8 XP', () => {
    expect(XP_COSTS.ARTIFACT_LEVEL).toBe(8);
  });
});

describe('Mastery Rank Advancement', () => {
  it('starts at M2 with 1 stone', () => {
    expect(MR_ADVANCEMENT[0]).toEqual({ stones: 1, mr: 2, tier: 'Adept' });
  });

  it('advances to M3 at 8 stones', () => {
    expect(MR_ADVANCEMENT[1]).toEqual({ stones: 8, mr: 3, tier: 'Expert' });
  });

  it('advances to M6 at 20 stones', () => {
    const legend = MR_ADVANCEMENT.find(a => a.mr === 6);
    expect(legend).toBeDefined();
    expect(legend!.stones).toBe(20);
    expect(legend!.tier).toBe('Legend');
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
});

describe('Echo Speeds', () => {
  it('human speed is 10m', () => expect(ECHO_SPEEDS.human).toBe(10));
  it('dwarf speed is 9m', () => expect(ECHO_SPEEDS.dwarf).toBe(9));
  it('halfling speed is 8m', () => expect(ECHO_SPEEDS.halfling).toBe(8));
  it('elf speed is 12m', () => expect(ECHO_SPEEDS.elf).toBe(12));
  it('titanborn speed is 12m', () => expect(ECHO_SPEEDS.titanborn).toBe(12));
});
