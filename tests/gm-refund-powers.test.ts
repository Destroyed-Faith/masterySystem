import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/power-catalog.js', () => ({
  powerIdentityKeyFromItem: (item: { id?: string; system?: { templateId?: string } }) =>
    String(item?.system?.templateId || item?.id || ''),
}));

import {
  getRoundState,
  listUsedPowersThisRound,
  markPowerUsedThisRound,
  refundUsedPowerThisRound,
  setRoundState,
  spendMovementPowerAction,
} from '../src/combat/action-economy.js';

function makeActor(id: string, items: any[] = []) {
  const flags: Record<string, any> = { 'mastery-system': {} };
  const byId = new Map(items.map((it) => [String(it.id), it]));
  return {
    id,
    name: id,
    type: 'character',
    items: {
      get: (itemId: string) => byId.get(String(itemId)),
      values: () => items.values(),
      [Symbol.iterator]: () => items[Symbol.iterator](),
    },
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      flags[scope] = flags[scope] || {};
      flags[scope][key] = value;
    },
    async unsetFlag(scope: string, key: string) {
      if (flags[scope]) delete flags[scope][key];
    },
    async update(data: Record<string, unknown>) {
      if (data['flags.mastery-system.-=roundState'] != null) {
        delete flags['mastery-system']?.roundState;
      }
    },
  };
}

describe('listUsedPowersThisRound / refundUsedPowerThisRound', () => {
  beforeEach(() => {
    (globalThis as any).Hooks = { callAll: vi.fn() };
    (globalThis as any).ui = { notifications: { warn: vi.fn(), info: vi.fn() } };
    (globalThis as any).canvas = { tokens: { placeables: [] } };
    (globalThis as any).game = {
      user: { isGM: true },
      combat: { id: 'c1', round: 1, turn: 0 },
      actors: { get: () => null },
    };
  });

  it('lists marked combat Powers and restores them', async () => {
    const power = {
      id: 'p1',
      type: 'power',
      name: 'Ignite Bolt',
      system: { templateId: 'active-ranged-ignite', category: 'active' },
    };
    const actor = makeActor('a1', [power]) as any;
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await markPowerUsedThisRound(actor, combat, 'p1');
    const listed = listUsedPowersThisRound(actor, combat);
    expect(listed).toHaveLength(1);
    expect(listed[0].name).toBe('Ignite Bolt');
    expect(listed[0].kind).toBe('combatPower');

    const ok = await refundUsedPowerThisRound(actor, combat, listed[0]);
    expect(ok).toBe(true);
    expect(listUsedPowersThisRound(actor, combat)).toHaveLength(0);
    expect(getRoundState(actor, combat).usedPowerIdsThisRound ?? []).toEqual([]);
  });

  it('lists and restores Movement Powers by template id', async () => {
    const power = {
      id: 'mp1',
      type: 'power',
      name: 'Sprint',
      system: { templateId: 'movement-sprint', category: 'movement' },
    };
    const actor = makeActor('a2', [power]) as any;
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    // Seed a round state with movement allowance so spend succeeds.
    await setRoundState(actor, {
      ...getRoundState(actor, combat),
      combatId: 'c1',
      round: 1,
      movementActions: { total: 1, used: 0 },
    });
    const spent = await spendMovementPowerAction(actor, combat, 'movement-sprint');
    expect(spent).toBe(true);
    const listed = listUsedPowersThisRound(actor, combat);
    expect(listed.some((e) => e.kind === 'movementPower' && e.name === 'Sprint')).toBe(true);
    const entry = listed.find((e) => e.kind === 'movementPower')!;
    expect(await refundUsedPowerThisRound(actor, combat, entry)).toBe(true);
    expect(getRoundState(actor, combat).usedMovementPowerIds ?? []).toEqual([]);
  });

  it('restores the Active Buff round lock', async () => {
    const actor = makeActor('a3') as any;
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await setRoundState(actor, {
      ...getRoundState(actor, combat),
      combatId: 'c1',
      round: 1,
      activeBuffUsedThisRound: true,
    });
    const listed = listUsedPowersThisRound(actor, combat);
    expect(listed.some((e) => e.kind === 'activeBuff')).toBe(true);
    expect(
      await refundUsedPowerThisRound(actor, combat, { key: 'activeBuff', kind: 'activeBuff' }),
    ).toBe(true);
    expect(getRoundState(actor, combat).activeBuffUsedThisRound).toBe(false);
  });
});
