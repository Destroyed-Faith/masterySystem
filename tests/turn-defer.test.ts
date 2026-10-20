import { describe, expect, it } from 'vitest';
import {
  buildDeferredRoundOrder,
  shouldRunTurnStartEffects,
} from '../src/combat/turn-defer.js';

describe('Turn Defer ordering', () => {
  it('places deferred combatants after non-deferred remaining', () => {
    const turnIds = ['a', 'b', 'c', 'd'];
    const order = buildDeferredRoundOrder(turnIds, ['b', 'd'], ['a']);
    // a completed, then non-deferred remaining (c), then deferred (b, d) in relative order
    expect(order).toEqual(['a', 'c', 'b', 'd']);
  });

  it('preserves relative initiative order among deferred', () => {
    const turnIds = ['high', 'mid', 'low'];
    const order = buildDeferredRoundOrder(turnIds, ['high', 'low'], []);
    expect(order).toEqual(['mid', 'high', 'low']);
  });
});

describe('Turn start effects gate', () => {
  it('skips SoT when already started', () => {
    const combat = {
      getFlag: (_ns: string, key: string) =>
        key === 'turnStartedCombatantIds' ? ['hero'] : [],
    };
    expect(shouldRunTurnStartEffects(combat, 'hero')).toBe(false);
    expect(shouldRunTurnStartEffects(combat, 'other')).toBe(true);
  });
});
