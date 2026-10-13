import { describe, expect, it } from 'vitest';
import { planStoneRecovery } from '../src/stones/stone-recovery.js';
import { getRulesMasteryRank } from '../src/utils/mastery-rank-sync.js';

describe('Stone Recovery budget (Mastery Rank)', () => {
  it('rules MR from Lifetime XP is the recovery point budget', () => {
    const actor = {
      system: {
        mastery: { rank: 8 },
        progression: { lifetimeXp: 100 }, // MR 3
      },
    };
    expect(getRulesMasteryRank(actor)).toBe(3);
  });

  it('recovery space only exists when pools are spent below capacity', () => {
    const pools = [
      { key: 'might', max: 4, current: 4, sustained: 0 },
      { key: 'agility', max: 2, current: 0, sustained: 0 },
    ];
    const full = planStoneRecovery(pools, {}, 3);
    expect(full.rows.find((r) => r.key === 'might')?.space).toBe(0);
    expect(full.rows.find((r) => r.key === 'agility')?.space).toBe(2);
    expect(full.points).toBe(3);

    const empty = planStoneRecovery(
      [
        { key: 'might', max: 4, current: 4, sustained: 0 },
        { key: 'agility', max: 2, current: 2, sustained: 0 },
      ],
      {},
      3,
    );
    // Full pools stay listed so "−" can correct a wrongly-full pool; no "+" room.
    expect(empty.rows.every((r) => r.space === 0 && !r.canAdd && r.canRemove)).toBe(true);
    expect(empty.saturated).toBe(true);
    expect(empty.canFinish).toBe(true);
  });
});
