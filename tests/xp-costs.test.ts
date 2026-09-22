import { describe, it, expect } from 'vitest';
import {
  XP_COSTS,
  attributeBandCost,
  skillBandCost,
  powerLevelCost,
  MAX_POWER_LEVEL,
} from '../src/utils/constants';

/** Compressed Attribute cost to raise from currentValue to currentValue+1. */
function getAttributeXPCost(currentValue: number): number {
  return attributeBandCost(currentValue + 1);
}

/** Skills keep their own 1–32 band table. */
function getSkillXPCost(newRank: number): number {
  return skillBandCost(newRank);
}

/** New spec: power level cost = 2 × newLevel for levels 1..16. */
function getPowerLevelCost(level: number): number {
  return powerLevelCost(level);
}

describe('Attribute XP Costs (compressed 1–40 scale)', () => {
  it('costs 2 XP per point from 1 to 4', () => {
    for (let v = 0; v < 4; v++) expect(getAttributeXPCost(v)).toBe(2);
  });

  it('costs 4 XP per point from 5 to 8', () => {
    for (let v = 4; v < 8; v++) expect(getAttributeXPCost(v)).toBe(4);
  });

  it('ends at 20 XP for values 37 to 40 and does not price 41', () => {
    for (let v = 36; v < 40; v++) expect(getAttributeXPCost(v)).toBe(20);
    expect(getAttributeXPCost(40)).toBe(0);
  });

  it('total cost to raise from 2 to 4 is 4 XP', () => {
    expect(getAttributeXPCost(2) + getAttributeXPCost(3)).toBe(4);
  });
});

describe('Skill XP Costs (separate from Attributes)', () => {
  it('keeps the 1 XP band through rank 8', () => {
    for (let r = 1; r <= 8; r++) expect(getSkillXPCost(r)).toBe(1);
    expect(getSkillXPCost(9)).toBe(2);
    expect(getSkillXPCost(32)).toBe(4);
    expect(getSkillXPCost(9)).not.toBe(attributeBandCost(9));
  });

  it('total cost to raise skill from 0 to 4 is 4 XP', () => {
    let total = 0;
    for (let r = 1; r <= 4; r++) total += getSkillXPCost(r);
    expect(total).toBe(4);
  });

  it('does not alias the Attribute cost table', () => {
    expect(XP_COSTS.SKILL).not.toBe(XP_COSTS.ATTRIBUTE);
  });
});

describe('Power Level XP Costs (rulebook: cost = 2 × newLevel, cap 16)', () => {
  it('every level 1..16 costs twice its level', () => {
    for (let lvl = 1; lvl <= 16; lvl++) {
      expect(getPowerLevelCost(lvl)).toBe(2 * lvl);
    }
  });

  it('level 1 costs 2 XP', () => expect(getPowerLevelCost(1)).toBe(2));
  it('level 8 costs 16 XP', () => expect(getPowerLevelCost(8)).toBe(16));
  it('level 12 costs 24 XP', () => expect(getPowerLevelCost(12)).toBe(24));
  it('level 16 costs 32 XP (cap)', () => expect(getPowerLevelCost(16)).toBe(32));

  it('returns 0 for level 0 or out-of-range', () => {
    expect(getPowerLevelCost(0)).toBe(0);
    expect(getPowerLevelCost(MAX_POWER_LEVEL + 1)).toBe(0);
    expect(getPowerLevelCost(99)).toBe(0);
  });

  it('total cost from level 1 to 6 is 42 XP', () => {
    let total = 0;
    for (let lvl = 1; lvl <= 6; lvl++) total += getPowerLevelCost(lvl);
    expect(total).toBe(2 * (1 + 2 + 3 + 4 + 5 + 6));
    expect(total).toBe(42);
  });

  it('total cost from level 1 to 12 is 156 XP', () => {
    let total = 0;
    for (let lvl = 1; lvl <= 12; lvl++) total += getPowerLevelCost(lvl);
    // 2 × (1+2+...+12) = 156
    expect(total).toBe(156);
  });

  it('total cost from level 1 to 16 is 272 XP', () => {
    let total = 0;
    for (let lvl = 1; lvl <= 16; lvl++) total += getPowerLevelCost(lvl);
    // 2 × (1+2+...+16) = 272
    expect(total).toBe(272);
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
