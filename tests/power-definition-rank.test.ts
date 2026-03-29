import { describe, it, expect } from 'vitest';
import { getPowerDefinitionRank } from '../src/utils/power-definition-rank';

describe('getPowerDefinitionRank', () => {
  const mapLevels = { '1': {}, '2': {}, '3': {}, '4': {} };

  it('uses level when within defined ranks (object map)', () => {
    expect(getPowerDefinitionRank(1, mapLevels)).toBe(1);
    expect(getPowerDefinitionRank(3, mapLevels)).toBe(3);
    expect(getPowerDefinitionRank(4, mapLevels)).toBe(4);
  });

  it('caps at highest defined rank when power level is higher', () => {
    expect(getPowerDefinitionRank(8, mapLevels)).toBe(4);
    expect(getPowerDefinitionRank(12, mapLevels)).toBe(4);
  });

  it('supports array-shaped level definitions', () => {
    const arr = [{ level: 1 }, { level: 2 }, { level: 3 }];
    expect(getPowerDefinitionRank(2, arr)).toBe(2);
    expect(getPowerDefinitionRank(99, arr)).toBe(3);
  });

  it('defaults sensibly without levels', () => {
    expect(getPowerDefinitionRank(6, undefined)).toBe(4);
    expect(getPowerDefinitionRank(2, undefined)).toBe(2);
  });
});
