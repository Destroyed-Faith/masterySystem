import { describe, expect, it } from 'vitest';
import {
  combatReadyRemaining,
  minLivePoolCurrent,
  readStoneCombatReady,
  snapshotStoneCombatReadyPools,
} from '../src/stones/stone-combat-ledger.js';
import { getAttrStoneReadyView } from '../src/stones/stone-ready.js';
import { poolSpendableStones } from '../src/utils/artifact-actor-rules.js';

function makeActor(pools: Record<string, { current: number; max?: number }>, flags?: any) {
  const stonePools: Record<string, any> = {};
  for (const [k, v] of Object.entries(pools)) {
    stonePools[k] = {
      max: v.max ?? 5,
      current: v.current,
      sealed: 0,
      burned: 0,
      sustained: 0,
    };
  }
  return {
    id: 'actor-1',
    type: 'character',
    isToken: false,
    system: {
      progression: {
        v099Stones: true,
        stoneAssignments: {
          might: 5,
          agility: 0,
          vitality: 0,
          intellect: 0,
          resolve: 0,
          influence: 0,
          wits: 0,
        },
        stoneSlotOrder: ['might', 'might', 'might', 'might', 'might'],
      },
      attributes: { might: { value: 5 } },
      stonePools,
    },
    items: [],
    summonBonds: [],
    familiars: [],
    flags: flags ? { 'mastery-system': flags } : {},
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
  };
}

describe('stone combat Ready ledger', () => {
  it('minLivePoolCurrent prefers the most depleted copy', () => {
    const spent = makeActor({ might: { current: 0, max: 5 } });
    const full = makeActor({ might: { current: 5, max: 5 } });
    // Simulate listStonePoolSyncActors by reading through spent when both are
    // considered — unit test the helper on a single actor with low current.
    expect(minLivePoolCurrent(spent, 'might')).toBe(0);
    expect(minLivePoolCurrent(full, 'might')).toBe(5);
  });

  it('combatReadyRemaining reads the actor flag for this combat', () => {
    const actor = makeActor(
      { might: { current: 5, max: 5 } },
      {
        stoneCombatReady: {
          combatId: 'c1',
          pools: { might: 2, agility: 0 },
        },
      },
    );
    const g = globalThis as any;
    const prev = g.game;
    g.game = { combat: { id: 'c1', started: true, round: 2 } };
    try {
      expect(readStoneCombatReady(actor, 'c1')?.pools.might).toBe(2);
      expect(combatReadyRemaining(actor, 'might', 'c1')).toBe(2);
      expect(getAttrStoneReadyView(actor, 'might').current).toBe(2);
      expect(poolSpendableStones(actor, 'might')).toBe(2);
    } finally {
      g.game = prev;
    }
  });

  it('snapshot captures live remaining pools', () => {
    const actor = makeActor({
      might: { current: 1, max: 5 },
      colorless: { current: 0, max: 2 },
    });
    const snap = snapshotStoneCombatReadyPools(actor);
    expect(snap.might).toBe(1);
    expect(snap.colorless).toBe(0);
  });

  it('without a ledger, Available uses the live (spent) current not Audit max', () => {
    const actor = makeActor({ might: { current: 1, max: 5 } });
    expect(poolSpendableStones(actor, 'might')).toBe(1);
  });

  it('ledger wins over a stale full pool.current on the same actor', () => {
    const actor = makeActor(
      { might: { current: 5, max: 5 } },
      {
        stoneCombatReady: {
          combatId: 'fight',
          pools: { might: 0 },
        },
      },
    );
    const g = globalThis as any;
    const prev = g.game;
    g.game = { combat: { id: 'fight', started: true, round: 2 } };
    try {
      expect(poolSpendableStones(actor, 'might')).toBe(0);
      expect(getAttrStoneReadyView(actor, 'might').current).toBe(0);
    } finally {
      g.game = prev;
    }
  });

  it('Round-2 style: spent 5, ledger keeps 0 until Recovery — not full Available', () => {
    const actor = makeActor(
      { might: { current: 5, max: 5 } },
      {
        stoneCombatReady: {
          combatId: 'fight',
          pools: { might: 0, agility: 0, vitality: 0, intellect: 0, resolve: 0, influence: 0, wits: 0, colorless: 0 },
        },
      },
    );
    const g = globalThis as any;
    const prev = g.game;
    g.game = { combat: { id: 'fight', started: true, round: 2 } };
    try {
      // Stale pool.current still says 5, but Available must follow the ledger.
      expect(actor.system.stonePools.might.current).toBe(5);
      expect(poolSpendableStones(actor, 'might')).toBe(0);
      expect(combatReadyRemaining(actor, 'might', 'fight')).toBe(0);
    } finally {
      g.game = prev;
    }
  });
});
