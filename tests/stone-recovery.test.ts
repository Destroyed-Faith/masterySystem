import { describe, expect, it } from 'vitest';
import {
  clampStoneRecoveryAllocation,
  planStoneRecovery,
  stoneRecoverySpace,
} from '../src/stones/stone-recovery';

const pool = (key: string, max: number, current: number, sustained = 0) => ({
  key,
  max,
  current,
  sustained,
});

describe('recovery space', () => {
  it('is capacity minus sustain minus what is already there', () => {
    expect(stoneRecoverySpace(pool('might', 4, 1, 1))).toBe(2);
  });

  it('never goes negative', () => {
    expect(stoneRecoverySpace(pool('might', 2, 5))).toBe(0);
    expect(stoneRecoverySpace(pool('wits', 0, 0))).toBe(0);
  });
});

describe('recovery plan', () => {
  const pools = [pool('might', 4, 1), pool('agility', 3, 3), pool('wits', 0, 0)];

  it('lists every pool with capacity; a full pool shows +/− but both disabled', () => {
    const plan = planStoneRecovery(pools, {}, 2);
    expect(plan.rows.map((r) => r.key)).toEqual(['might', 'agility']);
    const full = plan.rows.find((r) => r.key === 'agility')!;
    expect(full).toMatchObject({ space: 0, current: 3, canAdd: false, canRemove: false });
  });

  it('− only undoes your own + (never below zero)', () => {
    const plan = planStoneRecovery([pool('might', 2, 0)], { might: 2 }, 2);
    expect(plan.rows[0]).toMatchObject({ key: 'might', allocated: 2, canAdd: false, canRemove: true });
    const zero = planStoneRecovery([pool('might', 2, 0)], {}, 2);
    expect(zero.rows[0]).toMatchObject({ allocated: 0, canAdd: true, canRemove: false });
  });

  it('a negative allocation is treated as zero (recovery never spends stones)', () => {
    const plan = planStoneRecovery([pool('might', 3, 3)], { might: -2 }, 3);
    expect(plan.rows[0]).toMatchObject({ allocated: 0, canAdd: false, canRemove: false });
    expect(plan.allocated).toBe(0);
    expect(plan.remaining).toBe(3);
    expect(clampStoneRecoveryAllocation([pool('might', 3, 3)], { might: -2 }, 3)).toEqual({});
  });

  it('counts allocation and blocks the plus button once the points are gone', () => {
    const plan = planStoneRecovery(pools, { might: 2 }, 2);
    expect(plan.allocated).toBe(2);
    expect(plan.remaining).toBe(0);
    expect(plan.rows[0].canAdd).toBe(false);
    expect(plan.canFinish).toBe(true);
  });

  it('lets the player finish with fewer stones than the Mastery Rank budget', () => {
    const plan = planStoneRecovery(pools, { might: 1 }, 2);
    expect(plan.remaining).toBe(1);
    expect(plan.canFinish).toBe(true);
  });

  it('lets the player finish with zero allocation (skip unused recovery)', () => {
    const plan = planStoneRecovery(pools, {}, 3);
    expect(plan.allocated).toBe(0);
    expect(plan.remaining).toBe(3);
    expect(plan.canFinish).toBe(true);
  });

  it('marks saturated when every open pool is filled (leftover points lost)', () => {
    const plan = planStoneRecovery([pool('might', 2, 1)], {}, 3);
    expect(plan.rows[0].space).toBe(1);
    expect(plan.canFinish).toBe(true);

    const filled = planStoneRecovery([pool('might', 2, 1)], { might: 1 }, 3);
    expect(filled.remaining).toBe(2);
    expect(filled.saturated).toBe(true);
    expect(filled.canFinish).toBe(true);
  });

  it('ignores an allocation that exceeds the space', () => {
    const plan = planStoneRecovery([pool('might', 2, 1)], { might: 9 }, 3);
    expect(plan.allocated).toBe(1);
  });
});

describe('shared Mastery Rank budget across Attribute and Colorless pools', () => {
  // MR4 example from the Core: 4 Attribute, 4 Colorless, or any mixture of 4.
  const mr4 = 4;
  const pools = [pool('might', 6, 2), pool('colorless', 5, 1)];

  it('allows 4 Attribute stones', () => {
    const plan = planStoneRecovery(pools, { might: 4 }, mr4);
    expect(plan.allocated).toBe(4);
    expect(plan.canFinish).toBe(true);
  });

  it('allows 4 Colorless stones', () => {
    const plan = planStoneRecovery(pools, { colorless: 4 }, mr4);
    expect(plan.allocated).toBe(4);
    expect(plan.canFinish).toBe(true);
  });

  it('allows 2 Attribute + 2 Colorless', () => {
    const plan = planStoneRecovery(pools, { might: 2, colorless: 2 }, mr4);
    expect(plan.allocated).toBe(4);
    expect(plan.remaining).toBe(0);
    expect(plan.canFinish).toBe(true);
  });

  it('Colorless regen grants no extra allowance beyond the Mastery Rank', () => {
    const plan = planStoneRecovery(pools, { might: 4, colorless: 4 }, mr4);
    expect(plan.remaining).toBe(0);
    expect(clampStoneRecoveryAllocation(pools, { might: 4, colorless: 4 }, mr4)).toEqual({
      might: 4,
    });
  });
});

describe('allocation clamp for the actor update', () => {
  it('trims per pool and to the available points', () => {
    const pools = [pool('might', 4, 0), pool('agility', 2, 1)];
    expect(clampStoneRecoveryAllocation(pools, { might: 9, agility: 2 }, 3)).toEqual({
      might: 3,
    });
  });

  it('drops pools without space', () => {
    const pools = [pool('might', 2, 2), pool('agility', 2, 0)];
    expect(clampStoneRecoveryAllocation(pools, { might: 1, agility: 1 }, 2)).toEqual({
      agility: 1,
    });
  });
});
