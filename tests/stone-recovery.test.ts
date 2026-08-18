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

  it('lists only pools that can take a stone back', () => {
    const plan = planStoneRecovery(pools, {}, 2);
    expect(plan.rows.map((r) => r.key)).toEqual(['might']);
  });

  it('keeps a full pool listed while it holds allocated stones', () => {
    const plan = planStoneRecovery([pool('might', 2, 0)], { might: 2 }, 2);
    expect(plan.rows[0]).toMatchObject({ key: 'might', allocated: 2, canAdd: false, canRemove: true });
  });

  it('counts allocation and blocks the plus button once the points are gone', () => {
    const plan = planStoneRecovery(pools, { might: 2 }, 2);
    expect(plan.allocated).toBe(2);
    expect(plan.remaining).toBe(0);
    expect(plan.rows[0].canAdd).toBe(false);
    expect(plan.canFinish).toBe(true);
  });

  it('waits for the last point before it lets the player finish', () => {
    const plan = planStoneRecovery(pools, { might: 1 }, 2);
    expect(plan.remaining).toBe(1);
    expect(plan.canFinish).toBe(false);
  });

  it('lets the player finish when no pool has room for the rest', () => {
    const plan = planStoneRecovery([pool('might', 2, 1)], {}, 3);
    expect(plan.rows[0].space).toBe(1);
    expect(plan.canFinish).toBe(false);

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
