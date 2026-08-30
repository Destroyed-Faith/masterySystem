import { describe, expect, it } from 'vitest';
import {
  applyHealthAndEncumbrancePenalties,
  applyEncumbranceToMovement,
  getActorInventoryLoadZone,
  loadZoneFromBands,
  movementPenaltyForLoad,
  LOAD_ZONE_LABEL,
} from '../src/utils/encumbrance.js';

function mockActor(items: Array<{ band?: string; container?: string; slot?: string; weaponSetPrepared?: boolean; keepInventoryGrid?: boolean }>, healthBars?: Array<{ current: number; max: number; penalty: number }>) {
  return {
    items: items.map((spec, i) => ({
      id: `item-${i}`,
      getFlag: (_ns: string, key: string) =>
        key === 'equipment'
          ? { container: spec.container ?? 'inventory', band: spec.band ?? 'not', slot: spec.slot, weaponSetPrepared: spec.weaponSetPrepared, keepInventoryGrid: spec.keepInventoryGrid }
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
    expect(getActorInventoryLoadZone(mockActor([{ band: 'heavy', slot: 'body' }]))).toBe('normal');
    expect(getActorInventoryLoadZone(mockActor([{ band: 'enc', slot: 'offhand', keepInventoryGrid: true }]))).toBe('normal');
    expect(getActorInventoryLoadZone(mockActor([{ band: 'heavy', weaponSetPrepared: true }]))).toBe('normal');
  });

  it('zone 3 is labeled Overloaded (PG load table)', () => {
    expect(LOAD_ZONE_LABEL.overloaded).toBe('Overloaded');
  });
});

describe('encumbrance movement penalty (PG: load affects Movement only)', () => {
  it('applies −4 m Encumbered / −6 m Overloaded, floored at 0', () => {
    expect(movementPenaltyForLoad('normal')).toBe(0);
    expect(movementPenaltyForLoad('encumbered')).toBe(-4);
    expect(movementPenaltyForLoad('overloaded')).toBe(-6);
    expect(applyEncumbranceToMovement(8, 'encumbered')).toBe(4);
    expect(applyEncumbranceToMovement(8, 'overloaded')).toBe(2);
    expect(applyEncumbranceToMovement(4, 'overloaded')).toBe(0);
  });

  it('no dice-pool penalty from load — only the Health penalty reduces the pool', () => {
    // Healthy scarred (empty) → Bruised is the active bar (−10%).
    const actor = mockActor([{ band: 'heavy' }], [
      { current: 0, max: 10, penalty: 0 },
      { current: 5, max: 10, penalty: -2 },
    ]);
    const result = applyHealthAndEncumbrancePenalties(20, actor);
    expect(result.loadZone).toBe('overloaded');
    expect(result.healthPenaltyDice).toBe(2);
    expect(result.numDice).toBe(18);
  });

  it('health penalty alone can floor the pool at 0', () => {
    // Four scarred bars → Broken is the active bar (−50%).
    const actor = mockActor([{ band: 'heavy' }], [
      { current: 0, max: 10, penalty: 0 },
      { current: 0, max: 10, penalty: 0 },
      { current: 0, max: 10, penalty: 0 },
      { current: 0, max: 10, penalty: 0 },
      { current: 3, max: 10, penalty: -10 },
    ]);
    const result = applyHealthAndEncumbrancePenalties(20, actor);
    expect(result.healthPenaltyDice).toBe(10);
    expect(result.numDice).toBe(10);
  });
});
