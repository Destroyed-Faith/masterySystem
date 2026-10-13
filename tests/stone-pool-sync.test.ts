import { describe, expect, it } from 'vitest';
import {
  buildReadyStonePoolsObject,
  listStonePoolSyncActors,
  stonePoolReadyMax,
} from '../src/stones/stone-pool-sync.js';

describe('stonePoolReadyMax', () => {
  it('prefers v0.9.9 assignments over a stale max of 0', () => {
    expect(
      stonePoolReadyMax(
        {
          attributes: { vitality: { value: 10 } },
          progression: { v099Stones: true, stoneAssignments: { vitality: 2 } },
        },
        'vitality',
        { max: 0 },
      ),
    ).toBe(2);
  });

  it('does not keep a higher Attribute÷8 max in Lifetime mode', () => {
    expect(
      stonePoolReadyMax(
        {
          attributes: { might: { value: 40 } },
          progression: {
            v099Stones: true,
            stoneAssignments: { might: 2 },
            stoneSlotOrder: ['might', 'might'],
          },
        },
        'might',
        { max: 5 },
      ),
    ).toBe(2);
  });
});

describe('buildReadyStonePoolsObject', () => {
  it('clears Sealed and refills Ready', () => {
    const pools = buildReadyStonePoolsObject(
      {
        attributes: { vitality: { value: 16 } },
        stonePools: {
          vitality: { current: 0, max: 2, sealed: 2, burned: 0, sustained: 1 },
        },
      },
      null,
    );
    expect(pools.vitality).toEqual({
      max: 2,
      current: 2,
      sustained: 0,
      sealed: 0,
      burned: 0,
    });
  });

  it('keeps Word of Recall hold metres sealed', () => {
    const pools = buildReadyStonePoolsObject(
      {
        attributes: { vitality: { value: 16 } },
        stonePools: {
          vitality: { current: 0, max: 2, sealed: 2, burned: 0, sustained: 0 },
        },
      },
      { attrCounts: { vitality: 1 } },
    );
    expect(pools.vitality.sealed).toBe(1);
    expect(pools.vitality.current).toBe(1);
  });
});

describe('listStonePoolSyncActors', () => {
  it('dedupes the given character actor', () => {
    const actor = { id: 'a1', type: 'character', isToken: false };
    expect(listStonePoolSyncActors(actor)).toEqual([actor]);
  });
});
