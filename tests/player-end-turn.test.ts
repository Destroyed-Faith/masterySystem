import { describe, expect, it } from 'vitest';
import {
  isSingleTurnStep,
  isTurnAdvanceChange,
  playerMayWriteOwnTurnAdvance,
} from '../src/combat/player-end-turn.js';

describe('player own-turn advance', () => {
  it('accepts only turn/round fields', () => {
    expect(isTurnAdvanceChange({ turn: 2 })).toBe(true);
    expect(isTurnAdvanceChange({ turn: 0, round: 3 })).toBe(true);
    expect(isTurnAdvanceChange({ turn: 2, initiative: 12 })).toBe(false);
    expect(isTurnAdvanceChange({})).toBe(false);
  });

  it('allows one step, including wrapping the last combatant', () => {
    expect(isSingleTurnStep({ turn: 0, round: 1, turns: [1, 2, 3] }, { turn: 1 })).toBe(true);
    expect(isSingleTurnStep({ turn: 2, round: 1, turns: [1, 2, 3] }, { turn: 0, round: 2 })).toBe(true);
    expect(isSingleTurnStep({ turn: 0, round: 1, turns: [1, 2, 3] }, { turn: 0, round: 2 })).toBe(false);
  });

  it('lets the current player write that one step', () => {
    const combat = {
      turn: 0,
      round: 1,
      turns: [1, 2],
      combatant: { actor: { type: 'character', isOwner: true, id: 'pc' } },
    };
    const player = { isGM: false };
    expect(playerMayWriteOwnTurnAdvance(combat, player, { turn: 1 })).toBe(true);
    expect(playerMayWriteOwnTurnAdvance(combat, player, { turn: 0, round: 2 })).toBe(false);
    expect(playerMayWriteOwnTurnAdvance(combat, { isGM: true }, { turn: 1 })).toBe(false);
  });
});
