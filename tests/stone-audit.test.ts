import { describe, expect, it } from 'vitest';
import { buildStoneAuditReport, summonBoundSustainedByAttr } from '../src/stones/stone-audit.js';
import { buildReadyStonePoolsObject } from '../src/stones/stone-pool-sync.js';

describe('stone audit', () => {
  it('reports track vs pool mismatch', () => {
    const actor = {
      name: 'Test',
      type: 'character',
      system: {
        progression: {
          v099Stones: true,
          lifetimeXp: 150,
          stoneSlotOrder: [
            'might',
            'might',
            'might',
            'intellect',
            'intellect',
            'intellect',
            'vitality',
            'vitality',
            'resolve',
          ],
          stoneAssignments: { might: 3, intellect: 2, vitality: 2, resolve: 1 },
        },
        attributes: {
          might: { value: 8 },
          intellect: { value: 8 },
          vitality: { value: 4 },
          resolve: { value: 4 },
        },
        stonePools: {
          might: { max: 3, current: 3, sealed: 0, burned: 0, sustained: 0 },
          intellect: { max: 2, current: 2, sealed: 0, burned: 0, sustained: 0 },
          vitality: { max: 2, current: 2, sealed: 0, burned: 0, sustained: 0 },
          resolve: { max: 1, current: 1, sealed: 0, burned: 0, sustained: 0 },
        },
        points: { xp: 0, xpFree: 150 },
        skills: {},
        xp: {},
      },
      items: [],
      summonBonds: [],
    };
    // Slot order wins over a lagging stoneAssignments map (2 vs 3 INT).
    const report = buildStoneAuditReport(actor);
    const intellect = report.pools.find((p) => p.key === 'intellect');
    expect(intellect?.assigned).toBe(3);
    expect(intellect?.max).toBe(3);
    expect(report.slots.filter((s) => s.attribute === 'intellect').length).toBe(3);
  });

  it('counts summon sustained holds', () => {
    const actor = {
      system: {
        summonBonds: [
          {
            id: 'b1',
            name: 'Wolf',
            stoneAttributes: ['might', 'might', 'agility'],
          },
        ],
        familiars: [],
      },
    };
    expect(summonBoundSustainedByAttr(actor)).toEqual({ might: 2, agility: 1 });
  });

  it('keeps summon sustained when building ready pools', () => {
    const system = {
      progression: { v099Stones: true, stoneAssignments: { might: 3 } },
      attributes: { might: { value: 8 } },
      stonePools: {
        might: { max: 3, current: 0, sealed: 1, burned: 0, sustained: 2 },
      },
    };
    const pools = buildReadyStonePoolsObject(system, null, system, { might: 2 });
    expect(pools.might).toEqual({
      max: 3,
      current: 1,
      sustained: 2,
      sealed: 0,
      burned: 0,
    });
  });
});
