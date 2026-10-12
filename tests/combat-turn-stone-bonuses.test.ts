import { describe, expect, it } from 'vitest';
import {
  MASTERY_SKIP_TURN_BONUS_CLEAR,
  shouldClearTurnStoneBonuses,
} from '../src/combat/combat-update-options';

describe('shouldClearTurnStoneBonuses', () => {
  it('clears when spotlight actually moves to another combatant', () => {
    expect(
      shouldClearTurnStoneBonuses({
        prevSpotlightId: 'c-scurry',
        newSpotlightId: 'c-npc',
      }),
    ).toBe(true);
  });

  it('does not clear on initiative sync after Stone Powers', () => {
    expect(
      shouldClearTurnStoneBonuses({
        skipFlag: true,
        prevSpotlightId: 'c-scurry',
        newSpotlightId: 'c-first',
      }),
    ).toBe(false);
  });

  it('does not clear when round advances (prepare → R1 or R→R+1)', () => {
    expect(
      shouldClearTurnStoneBonuses({
        roundChanged: true,
        prevSpotlightId: 'c-last',
        newSpotlightId: 'c-first',
      }),
    ).toBe(false);
  });

  it('does not clear before any spotlight was recorded', () => {
    expect(
      shouldClearTurnStoneBonuses({
        newSpotlightId: 'c-first',
      }),
    ).toBe(false);
  });

  it('exports the Foundry update option key used by initiative sync', () => {
    expect(MASTERY_SKIP_TURN_BONUS_CLEAR).toBe('masterySkipTurnBonusClear');
  });
});
