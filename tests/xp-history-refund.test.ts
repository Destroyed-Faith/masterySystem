import { describe, expect, it } from 'vitest';
import { attributeBandCost, powerLevelCost } from '../src/utils/constants.js';
import {
  canRefundHistoryRow,
  liveRefundXp,
  planHistoryRefund,
} from '../src/utils/xp-history-refund.js';

function attrActor(might: number, baseline = 8) {
  return {
    system: {
      attributes: { might: { value: might } },
      skills: { athletics: 4 },
      xp: { attributeBaselines: { might: baseline } },
    },
    items: {
      get: (id: string) => {
        if (id === 'p1') {
          return {
            id: 'p1',
            type: 'power',
            name: 'Fireball',
            system: { level: 5, minLevel: 2, category: 'active' },
          };
        }
        if (id === 'art1') {
          return { id: 'art1', type: 'artifact', name: 'Dragon Claws', system: { level: 3 } };
        }
        return undefined;
      },
      filter: (fn: (i: any) => boolean) =>
        [
          { id: 'art1', type: 'artifact', name: 'Dragon Claws', system: { level: 3 } },
        ].filter(fn),
    },
  };
}

describe('liveRefundXp', () => {
  it('sums live attribute band costs from current down to target', () => {
    expect(liveRefundXp('attribute', 12, 8)).toBe(
      attributeBandCost(12) + attributeBandCost(11) + attributeBandCost(10) + attributeBandCost(9),
    );
  });

  it('sums power level costs from current down to target', () => {
    expect(liveRefundXp('power', 5, 2)).toBe(powerLevelCost(5) + powerLevelCost(4) + powerLevelCost(3));
  });

  it('charges 8 XP per artifact level dropped', () => {
    expect(liveRefundXp('artifact', 3, 1)).toBe(16);
  });
});

describe('planHistoryRefund', () => {
  it('cascades Might 12 back to the clicked 8 → 9 step', () => {
    const plan = planHistoryRefund(attrActor(12, 8), {
      kind: 'spend',
      category: 'attribute',
      key: 'might',
      from: 8,
      to: 9,
      what: 'Might 8 → 9',
    });
    expect(plan.refundable).toBe(true);
    expect(plan.current).toBe(12);
    expect(plan.target).toBe(8);
    expect(plan.pending).toBe(-4);
    expect(plan.refundXp).toBe(liveRefundXp('attribute', 12, 8));
  });

  it('does not go below the attribute baseline', () => {
    const plan = planHistoryRefund(attrActor(12, 10), {
      kind: 'spend',
      category: 'attribute',
      key: 'might',
      from: 8,
      to: 9,
      what: 'Might 8 → 9',
    });
    expect(plan.refundable).toBe(true);
    expect(plan.target).toBe(10);
    expect(plan.pending).toBe(-2);
    expect(plan.refundXp).toBe(liveRefundXp('attribute', 12, 10));
  });

  it('is not refundable when the current value is already at or below from', () => {
    const row = {
      kind: 'spend' as const,
      category: 'attribute',
      key: 'might',
      from: 8,
      to: 9,
      what: 'Might 8 → 9',
    };
    expect(canRefundHistoryRow(attrActor(8, 8), row)).toBe(false);
    expect(planHistoryRefund(attrActor(8, 8), row).reason).toMatch(/no longer in effect/i);
  });

  it('plans a skill cascade with the banded table', () => {
    const plan = planHistoryRefund(attrActor(8), {
      kind: 'spend',
      category: 'skill',
      key: 'athletics',
      from: 2,
      to: 3,
      what: 'Athletics 2 → 3',
    });
    expect(plan.refundable).toBe(true);
    expect(plan.current).toBe(4);
    expect(plan.target).toBe(2);
    expect(plan.refundXp).toBe(liveRefundXp('skill', 4, 2));
  });

  it('plans a power cascade using power level costs', () => {
    const plan = planHistoryRefund(attrActor(8), {
      kind: 'spend',
      category: 'power',
      key: 'p1',
      from: 2,
      to: 3,
      what: 'Fireball 2 → 3',
    });
    expect(plan.refundable).toBe(true);
    expect(plan.current).toBe(5);
    expect(plan.target).toBe(2);
    expect(plan.refundXp).toBe(liveRefundXp('power', 5, 2));
  });

  it('rejects grants and refunds', () => {
    expect(
      canRefundHistoryRow(attrActor(12), {
        kind: 'grant',
        category: 'xp',
        key: '',
        from: undefined,
        to: undefined,
        what: 'Regular XP',
      }),
    ).toBe(false);
    expect(
      canRefundHistoryRow(attrActor(12), {
        kind: 'adjust',
        category: 'attribute',
        key: 'might',
        from: 12,
        to: 11,
        what: 'refund: Might 12 → 11',
      }),
    ).toBe(false);
  });
});
