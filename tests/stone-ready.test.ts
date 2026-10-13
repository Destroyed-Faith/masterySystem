import { describe, expect, it } from 'vitest';
import { getAttrStoneReadyView, listAttrStoneReadyViews } from '../src/stones/stone-ready.js';
import { poolSpendableStones } from '../src/utils/artifact-actor-rules.js';

describe('stone-ready (Audit = Available)', () => {
  const base = {
    type: 'character',
    system: {
      progression: {
        v099Stones: true,
        stoneAssignments: {
          might: 3,
          agility: 1,
          vitality: 2,
          intellect: 0,
          resolve: 0,
          influence: 0,
          wits: 0,
        },
        stoneSlotOrder: ['might', 'might', 'might', 'agility', 'vitality', 'vitality'],
      },
      attributes: {
        might: { value: 3 },
        agility: { value: 2 },
        vitality: { value: 3 },
      },
      stonePools: {
        might: { max: 1, current: 0, sealed: 0, burned: 0, sustained: 0 },
        agility: { max: 0, current: 0, sealed: 0, burned: 0, sustained: 0 },
        vitality: { max: 1, current: 1, sealed: 0, burned: 0, sustained: 1 },
      },
    },
    items: [],
    summonBonds: [],
    familiars: [],
  };

  it('ignores Attribute÷8 and pool.current — Ready = Lifetime − holds', () => {
    const might = getAttrStoneReadyView(base, 'might');
    expect(might.assigned).toBe(3);
    expect(might.max).toBe(3);
    expect(might.readyExpected).toBe(3);
    expect(poolSpendableStones(base, 'might')).toBe(3);

    const vitality = getAttrStoneReadyView(base, 'vitality');
    expect(vitality.readyExpected).toBe(1); // 2 − sustained 1
  });

  it('matches poolSpendableStones for every attribute', () => {
    for (const view of listAttrStoneReadyViews(base)) {
      expect(poolSpendableStones(base, view.key)).toBe(view.readyExpected);
    }
  });

  it('subtracts summon holds even when sustained flag lags', () => {
    const actor = {
      ...base,
      system: {
        ...base.system,
        stonePools: {
          ...base.system.stonePools,
          might: { max: 3, current: 3, sealed: 0, burned: 0, sustained: 0 },
        },
        summonBonds: [
          { id: 'b1', name: 'Wolf', stoneAttributes: ['might', 'might'] },
        ],
      },
      summonBonds: [{ id: 'b1', name: 'Wolf', stoneAttributes: ['might', 'might'] }],
    };
    const might = getAttrStoneReadyView(actor, 'might');
    expect(might.summonBound).toBe(2);
    expect(might.readyExpected).toBe(1); // 3 − max(0, 2)
  });
});
