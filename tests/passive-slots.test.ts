import { afterEach, describe, expect, it } from 'vitest';
import {
  canEditEncounterPassives,
  consumePendingPassiveSwap,
  ensureDefaultPassiveSlots,
  EXCHANGE_PASSIVE_SWAPS_FLAG,
  getAvailablePassives,
  getPassiveSlotCountForMasteryRank,
  getPassiveSlots,
  getPassiveSlotUnlockRank,
  getPendingPassiveSwaps,
  MAX_PASSIVE_SLOTS,
  PASSIVE_SLOT_UNLOCK_RANKS,
  pickDefaultPassiveIds,
  unslotPassive,
} from '../src/powers/passives.js';

describe('passive slot unlocks', () => {
  it('matches passives.md: unlocks at MR 1, 2, 3, 5, 7, 8', () => {
    expect(PASSIVE_SLOT_UNLOCK_RANKS).toEqual([1, 2, 3, 5, 7, 8]);
    expect(MAX_PASSIVE_SLOTS).toBe(6);
  });

  it('returns slot counts by mastery rank (Core table)', () => {
    expect(getPassiveSlotCountForMasteryRank(1)).toBe(1);
    expect(getPassiveSlotCountForMasteryRank(2)).toBe(2);
    expect(getPassiveSlotCountForMasteryRank(3)).toBe(3);
    expect(getPassiveSlotCountForMasteryRank(4)).toBe(3);
    expect(getPassiveSlotCountForMasteryRank(5)).toBe(4);
    expect(getPassiveSlotCountForMasteryRank(6)).toBe(4);
    expect(getPassiveSlotCountForMasteryRank(7)).toBe(5);
    expect(getPassiveSlotCountForMasteryRank(8)).toBe(6);
  });

  it('maps slot indices to unlock ranks', () => {
    expect(getPassiveSlotUnlockRank(0)).toBe(1);
    expect(getPassiveSlotUnlockRank(1)).toBe(2);
    expect(getPassiveSlotUnlockRank(2)).toBe(3);
    expect(getPassiveSlotUnlockRank(3)).toBe(5);
    expect(getPassiveSlotUnlockRank(4)).toBe(7);
    expect(getPassiveSlotUnlockRank(5)).toBe(8);
    expect(getPassiveSlotUnlockRank(6)).toBeNull();
  });

  it('treats empty passive objects as vacant slots', () => {
    const actor = {
      system: {
        mastery: { rank: 2 },
        passives: { slot0: { passive: {}, active: true } },
      },
    } as unknown as Actor;
    expect(getPassiveSlots(actor)[0]?.passive).toBeNull();
  });

  it('clears a slot with a Foundry delete key instead of nulling the object', async () => {
    const updates: Record<string, unknown>[] = [];
    const actor = {
      system: { passives: { slot0: { passive: { id: 'p1', name: 'Ward' }, active: true } } },
      update: async (payload: Record<string, unknown>) => {
        updates.push(payload);
      },
    } as unknown as Actor;
    await unslotPassive(actor, 0);
    expect(updates).toEqual([{ 'system.passives.-=slot0': null }]);
  });
});

function passiveItem(id: string, name = id): any {
  return { id, name, type: 'power', system: { powerType: 'passive', effect: `${name} effect` } };
}

function actorWithPassives(opts: {
  id?: string;
  rank?: number;
  items: any[];
  slotted?: Array<{ id: string; name: string }>;
}): Actor {
  const updates: Record<string, unknown>[] = [];
  const passives = Object.fromEntries(
    (opts.slotted ?? []).map((p, i) => [`slot${i}`, { passive: { id: p.id, name: p.name }, active: true }]),
  );
  const actor = {
    id: opts.id ?? 'actor-1',
    system: { mastery: { rank: opts.rank ?? 2 }, passives },
    items: opts.items,
    updates,
    update: async (payload: Record<string, unknown>) => {
      updates.push(payload);
      if (payload['system.passives']) {
        actor.system.passives = payload['system.passives'] as typeof passives;
      }
    },
  };
  return actor as unknown as Actor;
}

describe('getAvailablePassives', () => {
  afterEach(() => {
    delete (globalThis as any).game;
    delete (globalThis as any).canvas;
  });

  it('includes category=passive even when powerType is missing', () => {
    const actor = {
      items: [
        { id: 'a', name: 'A', type: 'power', system: { category: 'passive', effect: 'ok' } },
        { id: 'b', name: 'B', type: 'power', system: { powerType: 'passive', effect: 'ok' } },
        { id: 'c', name: 'C', type: 'power', system: { category: 'active' } },
      ],
    } as unknown as Actor;
    expect(getAvailablePassives(actor).map((p) => p.id).sort()).toEqual(['a', 'b']);
  });

  it('excludes artifact-only Empowerment/Extension from combat Available', () => {
    const actor = {
      items: [
        { id: 'dr', name: 'Damage Reduction', type: 'power', system: { category: 'passive', templateId: 'passive-damage-reduction' } },
        {
          id: 'ext',
          name: 'Damage Reduction Extension',
          type: 'power',
          system: { category: 'passive', templateId: 'extend-buff-damage-reduction', tags: ['artifact-only'] },
        },
      ],
    } as unknown as Actor;
    expect(getAvailablePassives(actor).map((p) => p.id)).toEqual(['dr']);
  });

  it('includes catalog templateId passive-* even when category defaults to active', () => {
    const actor = {
      items: [
        {
          id: 'gm',
          name: 'GM Passive',
          type: 'power',
          system: { category: 'active', powerType: 'active', templateId: 'passive-damage-negation' },
        },
      ],
    } as unknown as Actor;
    expect(getAvailablePassives(actor).map((p) => p.id)).toEqual(['gm']);
  });

  it('unions passives from an unlinked token actor and its world prototype', () => {
    const world = {
      id: 'Actor.world',
      uuid: 'Actor.world',
      isToken: false,
      items: [
        { id: 'w1', name: 'World Passive', type: 'power', system: { powerType: 'passive' } },
      ],
    };
    const tokenActor = {
      id: 'Actor.token',
      uuid: 'Scene.x.Token.y.Actor.token',
      isToken: true,
      token: { actorId: 'Actor.world', document: { actorId: 'Actor.world', actorLink: false } },
      items: [
        { id: 't1', name: 'Token Passive', type: 'power', system: { category: 'passive' } },
      ],
    };
    (globalThis as any).game = {
      actors: { get: (id: string) => (id === 'Actor.world' ? world : null) },
      combat: { combatants: [] },
    };
    (globalThis as any).canvas = { tokens: { placeables: [] } };
    const ids = getAvailablePassives(tokenActor as unknown as Actor)
      .map((p) => p.id)
      .sort();
    expect(ids).toEqual(['t1', 'w1']);
  });

  it('unions passives from combat unlinked token when reading the world actor', () => {
    const world = {
      id: 'Actor.world',
      uuid: 'Actor.world',
      isToken: false,
      items: [],
    };
    const tokenActor = {
      id: 'Actor.token',
      uuid: 'Scene.x.Token.y.Actor.token',
      isToken: true,
      token: { actorId: 'Actor.world', document: { actorId: 'Actor.world', actorLink: false } },
      items: [
        {
          id: 'gm',
          name: 'GM Grant',
          type: 'power',
          system: { category: 'passive', powerType: 'passive', templateId: 'passive-ward' },
        },
      ],
    };
    (globalThis as any).game = {
      actors: { get: (id: string) => (id === 'Actor.world' ? world : null) },
      combat: {
        combatants: [
          {
            actor: tokenActor,
            token: {
              actorId: 'Actor.world',
              actorLink: false,
              actor: tokenActor,
            },
          },
        ],
      },
    };
    (globalThis as any).canvas = { tokens: { placeables: [] } };
    expect(getAvailablePassives(world as unknown as Actor).map((p) => p.id)).toEqual(['gm']);
  });
});

describe('default passive picks', () => {
  it('slots every known passive when they fit the unlocked count', () => {
    expect(
      pickDefaultPassiveIds([{ id: 'ward' }, { id: 'stride' }], 2, 'actor-a'),
    ).toEqual(['stride', 'ward']);
  });

  it('picks exactly slotCount from a larger pool, deterministically per actor', () => {
    const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const first = pickDefaultPassiveIds(pool, 2, 'actor-seed');
    const second = pickDefaultPassiveIds(pool, 2, 'actor-seed');
    expect(first).toHaveLength(2);
    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(2);
  });

  it('fills empty slots once and leaves them alone on a later call', async () => {
    const actor = actorWithPassives({
      items: [passiveItem('ward', 'Ward'), passiveItem('stride', 'Stride')],
    });
    const first = await ensureDefaultPassiveSlots(actor);
    expect(first).toEqual(['stride', 'ward']);
    expect(getPassiveSlots(actor).map((s) => s.passive?.id)).toEqual(['stride', 'ward']);
    const second = await ensureDefaultPassiveSlots(actor);
    expect(second).toEqual(first);
  });

  it('keeps a manually slotted choice as the new default', async () => {
    const actor = actorWithPassives({
      items: [passiveItem('ward', 'Ward'), passiveItem('stride', 'Stride'), passiveItem('focus', 'Focus')],
      slotted: [{ id: 'focus', name: 'Focus' }],
    });
    const kept = await ensureDefaultPassiveSlots(actor);
    expect(kept).toEqual(['focus']);
    expect(getPassiveSlots(actor)[0]?.passive?.id).toBe('focus');
  });
});

describe('mid-combat passive edits', () => {
  function actorWithSwaps(n: number): Actor {
    let pending = n;
    return {
      getFlag: (_scope: string, key: string) =>
        key === EXCHANGE_PASSIVE_SWAPS_FLAG ? pending : null,
      setFlag: async (_scope: string, key: string, value: unknown) => {
        if (key === EXCHANGE_PASSIVE_SWAPS_FLAG) pending = Number(value) || 0;
      },
    } as unknown as Actor;
  }

  it('allows free edits in round 1 and locks afterwards unless Exchange Passive was paid', () => {
    const actor = actorWithSwaps(0);
    expect(canEditEncounterPassives({ round: 1 } as Combat, actor)).toBe(true);
    expect(canEditEncounterPassives({ round: 2 } as Combat, actor)).toBe(false);
    expect(canEditEncounterPassives({ round: 2 } as Combat, actorWithSwaps(1))).toBe(true);
  });

  it('allows edits again after the GM releases passives', () => {
    const actor = { id: 'a1', getFlag: () => null } as unknown as Actor;
    const combatant = {
      actor,
      getFlag: (_scope: string, key: string) =>
        key === 'encounterSetupStep' ? { combatId: 'c1', passivesGmOpen: true } : null,
    };
    const combat = {
      id: 'c1',
      round: 3,
      combatants: [combatant],
    };
    expect(canEditEncounterPassives(combat as unknown as Combat, actor)).toBe(true);
  });

  it('consumes one paid swap token at a time', async () => {
    const actor = actorWithSwaps(2);
    expect(getPendingPassiveSwaps(actor)).toBe(2);
    expect(await consumePendingPassiveSwap(actor)).toBe(1);
    expect(getPendingPassiveSwaps(actor)).toBe(1);
    expect(await consumePendingPassiveSwap(actor)).toBe(0);
    expect(getPendingPassiveSwaps(actor)).toBe(0);
    expect(canEditEncounterPassives({ round: 3 } as Combat, actor)).toBe(false);
  });
});
