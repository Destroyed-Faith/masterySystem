import { beforeEach, describe, expect, it } from 'vitest';
import { applyStoneRegenAllocation } from '../src/combat/action-economy.js';
import {
  addInitiativeColorlessStones,
  getExhaustedInitiativeColorlessStones,
  getInitiativeColorlessStones,
  spendTempColorlessStones,
} from '../src/stones/colorless-stones.js';

function mockRegenActor(stonePools: Record<string, any>) {
  const own: Record<string, unknown> = {};
  const updates: Record<string, number> = {};
  const actor = {
    type: 'character',
    system: { stonePools },
    updates,
    getFlag: (_scope: string, key: string) => own[key],
    setFlag: async (_scope: string, key: string, value: unknown) => {
      own[key] = value;
    },
    unsetFlag: async (_scope: string, key: string) => {
      delete own[key];
    },
    update: async (u: Record<string, number>) => {
      Object.assign(updates, u);
      for (const [path, value] of Object.entries(u)) {
        const m = path.match(/^system\.stonePools\.(\w+)\.current$/);
        if (m && stonePools[m[1]]) stonePools[m[1]].current = value;
      }
    },
  };
  return actor;
}

describe('applyStoneRegenAllocation', () => {
  beforeEach(() => {
    (globalThis as any).game = { actors: { get: () => undefined }, combat: null };
    (globalThis as any).canvas = {};
  });

  it('puts chosen stones back only into the selected pools', async () => {
    const actor = mockRegenActor({
      might: { current: 0, max: 4, sustained: 0 },
      agility: { current: 1, max: 2, sustained: 0 },
      vitality: { current: 0, max: 3, sustained: 0 },
    });
    await applyStoneRegenAllocation(actor as unknown as Actor, { might: 2, agility: 1 });
    expect(actor.updates['system.stonePools.might.current']).toBe(2);
    expect(actor.updates['system.stonePools.agility.current']).toBe(2);
    expect(actor.updates['system.stonePools.vitality.current']).toBeUndefined();
  });

  it('does not restore Exhausted Permanent Colorless Stones from the shared budget', async () => {
    const actor = mockRegenActor({
      might: { current: 0, max: 4, sustained: 0 },
      colorless: { current: 0, max: 2, sustained: 0 },
    });
    await applyStoneRegenAllocation(actor as unknown as Actor, { colorless: 2 } as any);
    // v0.9.9.5: ordinary regeneration does not return Colorless Stones.
    expect(actor.updates['system.stonePools.colorless.current']).toBeUndefined();
  });

  it('restores Attribute Stones and leaves Colorless spent in the same allocation', async () => {
    const actor = mockRegenActor({
      might: { current: 0, max: 4, sustained: 0 },
      colorless: { current: 0, max: 2, sustained: 0 },
    });
    await applyStoneRegenAllocation(actor as unknown as Actor, {
      might: 2,
      colorless: 2,
    } as any);
    expect(actor.updates['system.stonePools.might.current']).toBe(2);
    expect(actor.updates['system.stonePools.colorless.current']).toBeUndefined();
  });

  it('does not return Exhausted Initiative Colorless Stones through ordinary regen', async () => {
    const actor = mockRegenActor({
      colorless: { current: 1, max: 2, sustained: 0 },
    });
    await addInitiativeColorlessStones(actor, 2);
    await spendTempColorlessStones(actor, 2);
    await applyStoneRegenAllocation(actor as unknown as Actor, { colorless: 3 } as any);
    expect(actor.updates['system.stonePools.colorless.current']).toBeUndefined();
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(2);
  });

  it('leaves Exhausted Initiative Colorless Stones spent when no Permanent pool exists', async () => {
    const actor = mockRegenActor({});
    await addInitiativeColorlessStones(actor, 2);
    await spendTempColorlessStones(actor, 1);
    await applyStoneRegenAllocation(actor as unknown as Actor, { colorless: 1 } as any);
    expect(getInitiativeColorlessStones(actor)).toBe(1);
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(1);
  });

  it('does not exceed pool max minus sustained', async () => {
    const actor = mockRegenActor({
      might: { current: 1, max: 3, sustained: 1 },
    });
    await applyStoneRegenAllocation(actor as unknown as Actor, { might: 5 });
    expect(actor.updates['system.stonePools.might.current']).toBe(2);
  });
});
