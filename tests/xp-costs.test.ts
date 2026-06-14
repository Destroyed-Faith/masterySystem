import { describe, it, expect } from 'vitest';
import {
  XP_COSTS,
  attributeBandCost,
  powerLevelCost,
  MAX_POWER_LEVEL,
} from '../src/utils/constants';

/** New spec: XP cost to raise an Attribute from currentValue to currentValue+1. */
function getAttributeXPCost(currentValue: number): number {
  return attributeBandCost(currentValue + 1);
}

/** New spec: Skills use the same banded table as Attributes. */
function getSkillXPCost(newRank: number): number {
  return attributeBandCost(newRank);
}

/** New spec: power level cost = 2 × newLevel for levels 1..16. */
function getPowerLevelCost(level: number): number {
  return powerLevelCost(level);
}

describe('Attribute XP Costs (new banded table to 80)', () => {
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

  it('costs scale through the upper bands all the way to 80', () => {
    for (let v = 32; v < 40; v++) expect(getAttributeXPCost(v)).toBe(5);
    for (let v = 40; v < 48; v++) expect(getAttributeXPCost(v)).toBe(6);
    for (let v = 48; v < 56; v++) expect(getAttributeXPCost(v)).toBe(7);
    for (let v = 56; v < 64; v++) expect(getAttributeXPCost(v)).toBe(8);
    for (let v = 64; v < 72; v++) expect(getAttributeXPCost(v)).toBe(9);
    for (let v = 72; v < 80; v++) expect(getAttributeXPCost(v)).toBe(10);
  });

  it('total cost to raise from 2 (creation base at MR2) to 8 is 6 XP', () => {
    let total = 0;
    for (let v = 2; v < 8; v++) {
      total += getAttributeXPCost(v);
    }
    expect(total).toBe(6);
  });

  it('total cost to raise from 0 to 80 is the band sum', () => {
    let total = 0;
    for (let v = 0; v < 80; v++) total += getAttributeXPCost(v);
    // 8 points in each of 10 bands, costs 1..10 → 8 × (1+2+...+10) = 8 × 55 = 440
    expect(total).toBe(8 * (1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10));
    expect(total).toBe(440);
  });
});

describe('Skill XP Costs (now share the attribute band)', () => {
  it('matches the attribute band cost for any rank', () => {
    for (let r = 1; r <= 80; r++) {
      expect(getSkillXPCost(r)).toBe(attributeBandCost(r));
    }
  });

  it('total cost to raise skill from 0 to 4 is 4 XP (all in band 1)', () => {
    let total = 0;
    for (let r = 1; r <= 4; r++) total += getSkillXPCost(r);
    expect(total).toBe(4);
  });

  it('XP_COSTS.SKILL aliases XP_COSTS.ATTRIBUTE', () => {
    expect(XP_COSTS.SKILL).toBe(XP_COSTS.ATTRIBUTE);
  });
});

describe('Power Level XP Costs (new spec: cost = level, cap 16)', () => {
  it('every level 1..16 costs its level', () => {
    for (let lvl = 1; lvl <= 16; lvl++) {
      expect(getPowerLevelCost(lvl)).toBe(lvl);
    }
  });

  it('level 1 costs 1 XP', () => expect(getPowerLevelCost(1)).toBe(1));
  it('level 8 costs 8 XP', () => expect(getPowerLevelCost(8)).toBe(8));
  it('level 12 costs 12 XP (old cap)', () => expect(getPowerLevelCost(12)).toBe(12));
  it('level 16 costs 16 XP (new cap)', () => expect(getPowerLevelCost(16)).toBe(16));

  it('returns 0 for level 0 or out-of-range', () => {
    expect(getPowerLevelCost(0)).toBe(0);
    expect(getPowerLevelCost(MAX_POWER_LEVEL + 1)).toBe(0);
    expect(getPowerLevelCost(99)).toBe(0);
  });

  it('total cost from level 1 to 6 is 21 XP', () => {
    let total = 0;
    for (let lvl = 1; lvl <= 6; lvl++) total += getPowerLevelCost(lvl);
    expect(total).toBe(1 + 2 + 3 + 4 + 5 + 6);
    expect(total).toBe(21);
  });

  it('total cost from level 1 to 12 is 78 XP', () => {
    let total = 0;
    for (let lvl = 1; lvl <= 12; lvl++) total += getPowerLevelCost(lvl);
    // 1+2+...+12 = 78
    expect(total).toBe(78);
  });

  it('total cost from level 1 to 16 is 136 XP', () => {
    let total = 0;
    for (let lvl = 1; lvl <= 16; lvl++) total += getPowerLevelCost(lvl);
    // 1+2+...+16 = 136
    expect(total).toBe(136);
  });
});

describe('Removed / retired XP constants', () => {
  it('XP_COSTS.NEW_TREE no longer exists', () => {
    expect((XP_COSTS as any).NEW_TREE).toBeUndefined();
  });

  it('XP_COSTS.ARTIFACT_ACCESS no longer exists', () => {
    expect((XP_COSTS as any).ARTIFACT_ACCESS).toBeUndefined();
  });

  it('XP_COSTS.SKILL_PER_RANK no longer exists (replaced by banded table)', () => {
    expect((XP_COSTS as any).SKILL_PER_RANK).toBeUndefined();
  });
});
