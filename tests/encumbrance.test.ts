import { describe, expect, it } from 'vitest';
import {
  applyHealthAndEncumbrancePenalties,
  dicePoolPenaltyFromLoadZone,
  getActorInventoryLoadZone,
  loadZoneFromBands,
} from '../src/utils/encumbrance.js';

function mockActor(items: Array<{ band?: string; container?: string }>, healthBars?: Array<{ current: number; max: number; penalty: number }>) {
  return {
    items: items.map((spec, i) => ({
      id: `item-${i}`,
      getFlag: (_ns: string, key: string) =>
        key === 'equipment'
          ? { container: spec.container ?? 'inventory', band: spec.band ?? 'not' }
          : undefined,
    })),
    system: {
      health: {
        bars: healthBars ?? [{ current: 10, max: 10, penalty: 0 }],
        currentBar: 0,
      },
    },
  };
}

describe('encumbrance load zones', () => {
  it('loadZoneFromBands picks the highest non-empty band', () => {
    expect(loadZoneFromBands({ normalCount: 5, encumberedCount: 0, overloadedCount: 0 })).toBe('normal');
    expect(loadZoneFromBands({ normalCount: 0, encumberedCount: 1, overloadedCount: 0 })).toBe('encumbered');
    expect(loadZoneFromBands({ normalCount: 3, encumberedCount: 1, overloadedCount: 0 })).toBe('encumbered');
    expect(loadZoneFromBands({ normalCount: 0, encumberedCount: 0, overloadedCount: 2 })).toBe('overloaded');
  });

  it('getActorInventoryLoadZone reads inventory band flags', () => {
    expect(getActorInventoryLoadZone(mockActor([{ band: 'not' }]))).toBe('normal');
    expect(getActorInventoryLoadZone(mockActor([{ band: 'enc' }]))).toBe('encumbered');
    expect(getActorInventoryLoadZone(mockActor([{ band: 'heavy' }]))).toBe('overloaded');
    expect(getActorInventoryLoadZone(mockActor([{ band: 'heavy' }, { band: 'enc' }]))).toBe('overloaded');
    expect(getActorInventoryLoadZone(mockActor([{ band: 'enc', container: 'stash' }]))).toBe('normal');
  });
});

describe('encumbrance dice pool penalties', () => {
  it('applies −20% for encumbered and −50% for heavy load (floored)', () => {
    expect(dicePoolPenaltyFromLoadZone('normal', 20)).toBe(0);
    expect(dicePoolPenaltyFromLoadZone('encumbered', 20)).toBe(4);
    expect(dicePoolPenaltyFromLoadZone('overloaded', 20)).toBe(10);
    expect(dicePoolPenaltyFromLoadZone('encumbered', 17)).toBe(3);
  });

  it('stacks additively with health penalties and can reach zero dice', () => {
    const actor = mockActor([{ band: 'heavy' }], [
      { current: 10, max: 10, penalty: 0 },
      { current: 5, max: 10, penalty: -2 },
    ]);
    const result = applyHealthAndEncumbrancePenalties(20, actor);
    expect(result.encumbrancePenaltyDice).toBe(10);
    expect(result.healthPenaltyDice).toBe(2);
    expect(result.numDice).toBe(8);
  });

  it('can zero the pool when penalties exceed the base pool', () => {
    const actor = mockActor([{ band: 'heavy' }], [
      { current: 10, max: 10, penalty: 0 },
      { current: 10, max: 10, penalty: 0 },
      { current: 10, max: 10, penalty: 0 },
      { current: 10, max: 10, penalty: 0 },
      { current: 3, max: 10, penalty: -10 },
    ]);
    const result = applyHealthAndEncumbrancePenalties(20, actor);
    expect(result.encumbrancePenaltyDice).toBe(10);
    expect(result.healthPenaltyDice).toBe(10);
    expect(result.numDice).toBe(0);
  });
});
