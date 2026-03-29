import { describe, it, expect } from 'vitest';
import { XP_COSTS } from '../src/utils/constants';

/**
 * Helper: get XP cost for raising an attribute from currentValue to currentValue+1
 */
function getAttributeXPCost(currentValue: number): number {
  for (const tier of XP_COSTS.ATTRIBUTE) {
    if (currentValue + 1 >= tier.min && currentValue + 1 <= tier.max) {
      return tier.cost;
    }
  }
  return 5; // GM discretion for 33+
}

/**
 * Helper: get XP cost for raising a skill to newRank
 */
function getSkillXPCost(newRank: number): number {
  return newRank * XP_COSTS.SKILL_PER_RANK;
}

/**
 * Helper: get XP cost for a power at a given level
 */
function getPowerLevelCost(level: number): number {
  if (level < 1 || level > 12) return 0;
  return XP_COSTS.POWER_LEVEL[level - 1];
}

describe('Attribute XP Costs', () => {
  it('costs 1 XP per point from 0 to 8', () => {
    for (let v = 0; v < 8; v++) {
      expect(getAttributeXPCost(v)).toBe(1);
    }
  });

  it('costs 2 XP per point from 9 to 16', () => {
    for (let v = 8; v < 16; v++) {
      expect(getAttributeXPCost(v)).toBe(2);
    }
  });

  it('costs 3 XP per point from 17 to 24', () => {
    for (let v = 16; v < 24; v++) {
      expect(getAttributeXPCost(v)).toBe(3);
    }
  });

  it('costs 4 XP per point from 25 to 32', () => {
    for (let v = 24; v < 32; v++) {
      expect(getAttributeXPCost(v)).toBe(4);
    }
  });

  it('total cost to raise from 2 (creation base at M2) to 8 is 6 XP', () => {
    let total = 0;
    for (let v = 2; v < 8; v++) {
      total += getAttributeXPCost(v);
    }
    expect(total).toBe(6); // 6 points * 1 XP each
  });
});

describe('Skill XP Costs', () => {
  it('costs newRank * SKILL_PER_RANK XP (1 → newRank XP)', () => {
    expect(getSkillXPCost(1)).toBe(1);
    expect(getSkillXPCost(2)).toBe(2);
    expect(getSkillXPCost(3)).toBe(3);
    expect(getSkillXPCost(4)).toBe(4);
    expect(getSkillXPCost(5)).toBe(5);
    expect(getSkillXPCost(8)).toBe(8);
    expect(getSkillXPCost(32)).toBe(32);
  });

  it('total cost to raise skill from 0 to 4 is 10 XP', () => {
    let total = 0;
    for (let r = 1; r <= 4; r++) {
      total += getSkillXPCost(r);
    }
    expect(total).toBe(1 + 2 + 3 + 4);
    expect(total).toBe(10);
  });
});

describe('Power Level XP Costs', () => {
  it('level 1 costs 2 XP', () => expect(getPowerLevelCost(1)).toBe(2));
  it('level 2 costs 4 XP', () => expect(getPowerLevelCost(2)).toBe(4));
  it('level 3 costs 8 XP', () => expect(getPowerLevelCost(3)).toBe(8));
  it('level 4 costs 16 XP', () => expect(getPowerLevelCost(4)).toBe(16));
  it('level 5 costs 24 XP', () => expect(getPowerLevelCost(5)).toBe(24));
  it('level 6 costs 32 XP', () => expect(getPowerLevelCost(6)).toBe(32));

  it('levels 7-12 all cost 40 XP', () => {
    for (let lvl = 7; lvl <= 12; lvl++) {
      expect(getPowerLevelCost(lvl)).toBe(40);
    }
  });

  it('total cost from level 1 to 6 is 86 XP', () => {
    let total = 0;
    for (let lvl = 1; lvl <= 6; lvl++) {
      total += getPowerLevelCost(lvl);
    }
    expect(total).toBe(2 + 4 + 8 + 16 + 24 + 32);
    expect(total).toBe(86);
  });

  it('total cost from level 1 to 12 is 326 XP', () => {
    let total = 0;
    for (let lvl = 1; lvl <= 12; lvl++) {
      total += getPowerLevelCost(lvl);
    }
    expect(total).toBe(86 + 6 * 40);
    expect(total).toBe(326);
  });
});
