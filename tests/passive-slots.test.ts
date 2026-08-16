import { describe, expect, it } from 'vitest';
import {
  getPassiveSlotCountForMasteryRank,
  getPassiveSlots,
  getPassiveSlotUnlockRank,
  MAX_PASSIVE_SLOTS,
  PASSIVE_SLOT_UNLOCK_RANKS,
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
