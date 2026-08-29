import { describe, expect, it } from 'vitest';
import {
  collectUnluckCharacters,
  tokensFromUnluckDice,
  unluckDiceSpec,
  unluckRankFromDetails,
} from '../src/system/unluck';

describe('unluck dice', () => {
  it('maps ranks to the Players Guide table', () => {
    expect(unluckDiceSpec(1)).toEqual({ formula: '1d8', divideBy: 2, label: '1d8 / 2' });
    expect(unluckDiceSpec(2)).toEqual({ formula: '1d8', divideBy: 1, label: '1d8' });
    expect(unluckDiceSpec(3)).toEqual({ formula: '2d8', divideBy: 1, label: '2d8' });
  });

  it('divides rank 1 by two', () => {
    expect(tokensFromUnluckDice(8, 2)).toBe(4);
    expect(tokensFromUnluckDice(5, 2)).toBe(2);
    expect(tokensFromUnluckDice(1, 2)).toBe(0);
  });

  it('keeps rank 2 and 3 as the raw dice total', () => {
    expect(tokensFromUnluckDice(7, 1)).toBe(7);
    expect(tokensFromUnluckDice(12, 1)).toBe(12);
  });
});

describe('unluck characters', () => {
  it('reads rank from disadvantage details', () => {
    expect(unluckRankFromDetails({ rank: '3' })).toBe(3);
    expect(unluckRankFromDetails({ rank: 2 })).toBe(2);
    expect(unluckRankFromDetails({})).toBe(1);
  });

  it('lists only characters who have Unluck', () => {
    const actors = [
      { id: 'a', type: 'character', name: 'Ada', system: { disadvantages: [{ id: 'unluck', details: { rank: '2' } }] } },
      { id: 'b', type: 'character', name: 'Ben', system: { disadvantages: [{ id: 'hunted', details: { rank: '1' } }] } },
      { id: 'c', type: 'npc', name: 'Goblin', system: { disadvantages: [{ id: 'unluck', details: { rank: '3' } }] } },
    ];
    expect(collectUnluckCharacters(actors)).toEqual([
      { actorId: 'a', name: 'Ada', rank: 2 },
    ]);
  });
});
