import { beforeEach, describe, expect, it } from 'vitest';
import {
  getRoundState,
  initializeCombatRoundState,
  setRoundState,
} from '../src/combat/action-economy.js';

interface MockActor {
  id: string;
  type: string;
  system: Record<string, unknown>;
  flags: Record<string, Record<string, unknown>>;
  getFlag: (scope: string, key: string) => unknown;
  setFlag: (scope: string, key: string, value: unknown) => Promise<void>;
  unsetFlag: (scope: string, key: string) => Promise<void>;
  update: (patch: Record<string, unknown>) => Promise<void>;
}

function mockActor(id: string): MockActor {
  const own: Record<string, unknown> = {};
  return {
    id,
    type: 'character',
    system: { attributes: { might: { value: 16 } }, stonePools: {} },
    flags: { 'mastery-system': own },
    getFlag: (_scope: string, key: string) => own[key],
    setFlag: async (_scope: string, key: string, value: unknown) => {
      own[key] = value;
    },
    unsetFlag: async (_scope: string, key: string) => {
      delete own[key];
    },
    update: async () => {},
  };
}

function setupGame(actors: MockActor[], round: number) {
  const byId = new Map(actors.map((a) => [a.id, a]));
  const combat = {
    id: 'cmb1',
    round,
    turn: 0,
    combatants: actors.map((actor) => ({ id: `c-${actor.id}`, actor, token: null })),
  };
  (globalThis as any).game = {
    combat,
    actors: { get: (id: string) => byId.get(id) },
    user: { isGM: true },
  };
  (globalThis as any).canvas = {};
  (globalThis as any).Hooks = { callAll: () => {} };
  return combat;
}

describe('round state across the prepare phase', () => {
  beforeEach(() => {
    delete (globalThis as any).game;
    delete (globalThis as any).canvas;
  });

  it('reads back stones bought while the encounter is still on round 0', async () => {
    const actor = mockActor('a1');
    const combat = setupGame([actor], 0);

    const prepared = getRoundState(actor as any, combat as any);
    prepared.attackActions.total += 2;
    prepared.stoneBonuses!.extraAttacks = 2;
    await setRoundState(actor as any, prepared);

    // Still in prepare (round 0): a second read must not hand out a fresh default,
    // otherwise a second purchase overwrites the first one.
    expect(getRoundState(actor as any, combat as any).attackActions.total).toBe(3);

    // Foundry advances the encounter to round 1 — same round for our purposes.
    combat.round = 1;
    const live = getRoundState(actor as any, combat as any);
    expect(live.attackActions.total).toBe(3);
    expect(live.stoneBonuses?.extraAttacks).toBe(2);
  });

  it('combat start keeps the prepared round-1 state instead of resetting it', async () => {
    const actor = mockActor('a1');
    const combat = setupGame([actor], 0);

    const prepared = getRoundState(actor as any, combat as any);
    prepared.attackActions.total += 1;
    prepared.stoneBonuses!.extraAttacks = 1;
    await setRoundState(actor as any, prepared);
    await actor.setFlag('mastery-system', 'stoneUsage', { 'generic.extraAttack:1:0': 1 });

    combat.round = 1;
    await initializeCombatRoundState(combat as any);

    expect(getRoundState(actor as any, combat as any).attackActions.total).toBe(2);
    expect(actor.getFlag('mastery-system', 'stoneUsage')).toEqual({
      'generic.extraAttack:1:0': 1,
    });
  });

  it('initializes actors that never went through the prepare phase', async () => {
    const actor = mockActor('a2');
    const combat = setupGame([actor], 1);

    await initializeCombatRoundState(combat as any);

    const state = getRoundState(actor as any, combat as any);
    expect(state.combatId).toBe('cmb1');
    expect(state.round).toBe(1);
    expect(actor.getFlag('mastery-system', 'stoneUsage')).toEqual({});
  });

  it('refills leftover empty pools when combat starts without a prepare spend', async () => {
    const actor = mockActor('a3');
    actor.system = {
      attributes: { might: { value: 16 } },
      stonePools: { might: { current: 0, max: 2, sustained: 0 } },
    };
    actor.update = async (patch) => {
      for (const [k, v] of Object.entries(patch)) {
        const parts = k.split('.');
        let obj: any = actor;
        for (let i = 0; i < parts.length - 1; i++) {
          if (obj[parts[i]] == null) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = v;
      }
    };
    const combat = setupGame([actor], 1);
    await initializeCombatRoundState(combat as any);
    expect((actor.system as any).stonePools.might.current).toBe(2);
  });
});
