import { describe, expect, it } from 'vitest';
import {
  ensureDefaultPassiveSlots,
  getPassiveSlotCountForMasteryRank,
  getPassiveSlots,
  getPassiveSlotUnlockRank,
  MAX_PASSIVE_SLOTS,
  PASSIVE_SLOT_UNLOCK_RANKS,
  pickDefaultPassiveIds,
  unslotPassive,
} from '../src/powers/passives.js';

describe('passive slot unlocks', () => {
  it('defines four slots unlocked at MR 1, 2, 4, and 6', () => {
    expect(PASSIVE_SLOT_UNLOCK_RANKS).toEqual([1, 2, 4, 6]);
    expect(MAX_PASSIVE_SLOTS).toBe(4);
  });

  it('returns slot counts by mastery rank', () => {
    expect(getPassiveSlotCountForMasteryRank(1)).toBe(1);
    expect(getPassiveSlotCountForMasteryRank(2)).toBe(2);
    expect(getPassiveSlotCountForMasteryRank(3)).toBe(2);
    expect(getPassiveSlotCountForMasteryRank(4)).toBe(3);
    expect(getPassiveSlotCountForMasteryRank(5)).toBe(3);
    expect(getPassiveSlotCountForMasteryRank(6)).toBe(4);
    expect(getPassiveSlotCountForMasteryRank(8)).toBe(4);
  });

  it('maps slot indices to unlock ranks', () => {
    expect(getPassiveSlotUnlockRank(0)).toBe(1);
    expect(getPassiveSlotUnlockRank(1)).toBe(2);
    expect(getPassiveSlotUnlockRank(2)).toBe(4);
    expect(getPassiveSlotUnlockRank(3)).toBe(6);
    expect(getPassiveSlotUnlockRank(4)).toBeNull();
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
