import { describe, expect, it } from 'vitest';
import {
  getPassiveSlotCountForMasteryRank,
  getPassiveSlotUnlockRank,
  MAX_PASSIVE_SLOTS,
  PASSIVE_SLOT_UNLOCK_RANKS,
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
});
