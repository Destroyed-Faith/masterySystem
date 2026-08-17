import { describe, expect, it } from 'vitest';
import { applyStoneRegenAllocation } from '../src/combat/action-economy.js';

describe('applyStoneRegenAllocation', () => {
  it('puts chosen stones back only into the selected pools', async () => {
    const updates: Record<string, number> = {};
    const actor = {
      type: 'npc',
      system: {
        stonePools: {
          might: { current: 0, max: 4, sustained: 0 },
          agility: { current: 1, max: 2, sustained: 0 },
          vitality: { current: 0, max: 3, sustained: 0 },
        },
      },
      update: async (u: Record<string, number>) => {
        Object.assign(updates, u);
      },
    };
    await applyStoneRegenAllocation(actor as unknown as Actor, { might: 2, agility: 1 });
    expect(updates['system.stonePools.might.current']).toBe(2);
    expect(updates['system.stonePools.agility.current']).toBe(2);
    expect(updates['system.stonePools.vitality.current']).toBeUndefined();
  });

  it('does not exceed pool max minus sustained', async () => {
    const updates: Record<string, number> = {};
    const actor = {
      type: 'npc',
      system: {
        stonePools: {
          might: { current: 1, max: 3, sustained: 1 },
        },
      },
      update: async (u: Record<string, number>) => {
        Object.assign(updates, u);
      },
    };
    await applyStoneRegenAllocation(actor as unknown as Actor, { might: 5 });
    expect(updates['system.stonePools.might.current']).toBe(2);
  });
});
