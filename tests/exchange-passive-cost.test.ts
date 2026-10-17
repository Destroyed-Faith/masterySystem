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

describe('Movement Enhancement does not keep a rising cost across rounds', () => {
  it('resets with the turn, like the other generic abilities', () => {
    expect(stonePowerCostPersistsForCombat('generic.movementEnhancement')).toBe(false);
    expect(stonePowerCostPersistsForCombat('generic.extraMovement')).toBe(false);
    expect(STONE_POWERS['generic.movementEnhancement']?.name).toBe('Movement Enhancement');
  });

  it('does not carry Movement Enhancement into the next round', async () => {
    const actor = actorWithUsage();
    const combatR1 = { id: 'c1', round: 1, turn: 0 } as Combat;
    const combatR2 = { id: 'c1', round: 2, turn: 0 } as Combat;
    expect(calculateStoneCost(0)).toBe(1);
    await incrementGenericStonePowerUsage(actor, 'generic.movementEnhancement', combatR1);
    expect(getGenericStonePowerUsageCount(actor, 'generic.movementEnhancement', combatR1)).toBe(1);
    expect(getGenericStonePowerUsageCount(actor, 'generic.movementEnhancement', combatR2)).toBe(0);
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
