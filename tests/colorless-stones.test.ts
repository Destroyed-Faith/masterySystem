import { describe, expect, it } from 'vitest';
import {
  colorlessStoneInitiativeCost,
  convertInitiativeToColorlessPreview,
  initiativeBoostAmount,
  maxConvertibleColorlessStones,
} from '../src/stones/colorless-stones';

describe('Initiative Exchange → Colorless Stones', () => {
  it('costs 4 × Mastery Rank Initiative per stone', () => {
    expect(colorlessStoneInitiativeCost(2)).toBe(8);
    expect(colorlessStoneInitiativeCost(3)).toBe(12);
    expect(colorlessStoneInitiativeCost(8)).toBe(32);
  });

  it('converts only whole stones and never drops Initiative below 0', () => {
    expect(maxConvertibleColorlessStones(24, 3)).toBe(2);
    expect(convertInitiativeToColorlessPreview(24, 2, 3)).toEqual({
      stones: 2,
      initiativeCost: 24,
      remainingInitiative: 0,
    });
    expect(convertInitiativeToColorlessPreview(24, 9, 3).stones).toBe(2);
    expect(convertInitiativeToColorlessPreview(7, 1, 2).stones).toBe(0);
  });
});

describe('Initiative Boost amount', () => {
  it('is 1/2/4/8 × Mastery Rank', () => {
    expect(initiativeBoostAmount(1, 3)).toBe(3);
    expect(initiativeBoostAmount(2, 3)).toBe(6);
    expect(initiativeBoostAmount(3, 3)).toBe(12);
    expect(initiativeBoostAmount(4, 3)).toBe(24);
    expect(initiativeBoostAmount(5, 3)).toBe(48);
  });
});
