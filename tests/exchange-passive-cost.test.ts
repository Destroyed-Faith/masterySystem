import { describe, expect, it } from 'vitest';
import {
  calculateStoneCost,
  getGenericStonePowerUsageCount,
  incrementGenericStonePowerUsage,
  stonePowerCostPersistsForCombat,
} from '../src/combat/action-economy.js';
import { STONE_POWERS } from '../src/stones/stone-powers.js';

function actorWithUsage(): Actor {
  const stoneUsage: Record<string, number> = {};
  return {
    id: 'a1',
    getFlag: (_scope: string, key: string) => (key === 'stoneUsage' ? { ...stoneUsage } : null),
    setFlag: async (_scope: string, key: string, value: unknown) => {
      if (key === 'stoneUsage' && value && typeof value === 'object') {
        Object.assign(stoneUsage, value as Record<string, number>);
      }
    },
  } as unknown as Actor;
}

describe('Exchange Passive cost is cumulative per combat', () => {
  it('is the only general power that keeps doubling across rounds', () => {
    expect(stonePowerCostPersistsForCombat('generic.exchangePassive')).toBe(true);
    expect(stonePowerCostPersistsForCombat('generic.extraMovement')).toBe(false);
    expect(STONE_POWERS['generic.exchangePassive']?.description).toMatch(/Exhausted, not Burned/);
  });

  it('first unlock costs 1, the next round costs 2, then 4', async () => {
    const actor = actorWithUsage();
    const combatR1 = { id: 'c1', round: 1, turn: 0 } as Combat;
    const combatR2 = { id: 'c1', round: 2, turn: 0 } as Combat;

    expect(getGenericStonePowerUsageCount(actor, 'generic.exchangePassive', combatR1)).toBe(0);
    expect(calculateStoneCost(0)).toBe(1);

    await incrementGenericStonePowerUsage(actor, 'generic.exchangePassive', combatR1);
    expect(getGenericStonePowerUsageCount(actor, 'generic.exchangePassive', combatR2)).toBe(1);
    expect(calculateStoneCost(1)).toBe(2);

    await incrementGenericStonePowerUsage(actor, 'generic.exchangePassive', combatR2);
    expect(getGenericStonePowerUsageCount(actor, 'generic.exchangePassive', combatR2)).toBe(2);
    expect(calculateStoneCost(2)).toBe(4);
  });

  it('does not carry the count into a different combat', async () => {
    const actor = actorWithUsage();
    await incrementGenericStonePowerUsage(actor, 'generic.exchangePassive', {
      id: 'c1',
      round: 1,
      turn: 0,
    } as Combat);
    expect(
      getGenericStonePowerUsageCount(actor, 'generic.exchangePassive', {
        id: 'c2',
        round: 1,
        turn: 0,
      } as Combat),
    ).toBe(0);
  });

  it('still resets Extra Movement each turn', async () => {
    const actor = actorWithUsage();
    await incrementGenericStonePowerUsage(actor, 'generic.extraMovement', {
      id: 'c1',
      round: 1,
      turn: 0,
    } as Combat);
    expect(
      getGenericStonePowerUsageCount(actor, 'generic.extraMovement', {
        id: 'c1',
        round: 2,
        turn: 0,
      } as Combat),
    ).toBe(0);
  });
});
