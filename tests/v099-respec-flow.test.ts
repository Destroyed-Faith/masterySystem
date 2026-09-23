import { describe, expect, it } from 'vitest';
import { buildStoneProgressionSlots } from '../src/progression/v099-rules.js';
import { planV099Respec } from '../src/progression/v099-respec.js';
import {
  describeStartingPackage,
  emptyStoneSlotOrder,
  migrationStoneSlotLabel,
  planFinalAttributes,
  releaseAllStoneSlots,
  releaseStoneSlot,
  stoneOrderActorUpdate,
  stonePlacementOptions,
  tallyStoneSlotOrder,
  unblockStonePoolsUpdate,
} from '../src/progression/v099-respec-flow.js';

const flat = (values: number[]) => ({
  might: values[0],
  agility: values[1],
  vitality: values[2],
  intellect: values[3],
  resolve: values[4],
  influence: values[5],
  wits: values[6],
});

describe('Starting package gate', () => {
  it('rejects four 4s and stays closed until the package is exact', () => {
    const status = describeStartingPackage(flat([4, 4, 4, 4, 4, 2, 2]));
    expect(status.valid).toBe(false);
    expect(status.fours).toBe(5);
    expect(status.summary).toContain('Current: 5×4');
  });

  it('accepts two 4s, two 3s and three 2s', () => {
    expect(describeStartingPackage(flat([4, 4, 3, 3, 2, 2, 2])).valid).toBe(true);
  });
});

describe('Final +/- against preserved Attribute XP', () => {
  const starting = flat([4, 4, 3, 3, 2, 2, 2]);

  it('shows the remaining XP and the cost of the next step', () => {
    const plan = planFinalAttributes(starting, { ...starting, might: 5 }, 66);
    expect(plan.spent).toBe(4);
    expect(plan.remaining).toBe(62);
    const might = plan.rows.find((row) => row.key === 'might');
    expect(might).toMatchObject({ value: 5, canDecrease: true, canIncrease: true, increaseCost: 4 });
    const agility = plan.rows.find((row) => row.key === 'agility');
    expect(agility?.canDecrease).toBe(false);
  });

  it('blocks + when the next step costs more than the XP left', () => {
    const plan = planFinalAttributes(starting, starting, 2);
    const might = plan.rows.find((row) => row.key === 'might');
    expect(might?.increaseCost).toBe(4);
    expect(might?.canIncrease).toBe(false);
    const intellect = plan.rows.find((row) => row.key === 'intellect');
    expect(intellect?.increaseCost).toBe(2);
    expect(intellect?.canIncrease).toBe(true);
  });
});

describe('Per-slot Stones', () => {
  it('gives 132 Lifetime XP two Start boxes and one box every 20 XP', () => {
    const order = emptyStoneSlotOrder(132);
    expect(order).toHaveLength(8);
    expect(order.map((_, index) => migrationStoneSlotLabel(index))).toEqual([
      'Start',
      'Start',
      '20',
      '40',
      '60',
      '80',
      '100',
      '120',
    ]);
  });

  it('keeps a clicked box on that box instead of sorting by Attribute', () => {
    const slots = buildStoneProgressionSlots(20, { might: 1, wits: 1 }, 20, 0, ['wits', null, 'might']);
    expect(slots[0].abbrev).toBe('WIT');
    expect(slots[1].assigned).toBe(false);
    expect(slots[2].abbrev).toBe('MIG');
  });

  it('combines two boxes into one Permanent Colorless Stone', () => {
    const order = ['might', 'colorless#0-2', 'colorless#0-2', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
    const tallied = tallyStoneSlotOrder(order);
    expect(tallied.ok).toBe(true);
    expect(tallied.colorless).toBe(1);
    expect(tallied.assignments.might).toBe(1);
    const open = ['might', null, null, null, null, null, null, null];
    expect(stonePlacementOptions(open, 2).colorless).toBe(true);
  });

  it('accepts the slot order in the migration plan', () => {
    const order = ['might', 'colorless#0-2', 'colorless#0-2', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
    const actor = {
      system: {
        mastery: { rank: 3 },
        progression: { earnedAttributeXp: 0, lifetimeXp: 120, v099Stones: false },
      },
      flags: { 'mastery-system': { needsV099Respec: true } },
    };
    const starting = flat([4, 4, 3, 3, 2, 2, 2]);
    const plan = planV099Respec(actor, {
      starting,
      attributes: starting,
      stones: {},
      stoneSlotOrder: order,
    });
    expect(plan.ok).toBe(true);
    expect(plan.permanentStones).toBe(8);
    expect(plan.permanentColorless).toBe(1);
    expect(plan.stones.might).toBe(1);
  });

  it('writes the clicked order and exhausts nothing already spent', () => {
    const update = stoneOrderActorUpdate(
      {
        progression: { stoneAssignments: { might: 1 }, permanentColorless: 0 },
        stonePools: { might: { current: 0, max: 1 } },
      },
      ['might', 'agility'],
    );
    expect(update['system.progression.stoneSlotOrder']).toEqual(['might', 'agility']);
    expect(update['system.progression.stoneAssignments.agility']).toBe(1);
    expect(update['system.stonePools.might.current']).toBeUndefined();
    expect(update['system.stonePools.agility.current']).toBe(1);
  });

  it('releases one box, and both boxes of a Colorless pair', () => {
    expect(releaseStoneSlot(['might', 'agility', null], 0)).toEqual([null, 'agility', null]);
    const pair = ['colorless#0-2', 'might', 'colorless#0-2'];
    expect(releaseStoneSlot(pair, 2)).toEqual([null, 'might', null]);
    expect(releaseAllStoneSlots(pair)).toEqual([null, null, null]);
  });

  it('clears pool locks when the last Stone leaves an Attribute', () => {
    const update = stoneOrderActorUpdate(
      {
        progression: { stoneAssignments: { might: 1 }, permanentColorless: 1 },
        stonePools: {
          might: { current: 0, max: 1, sustained: 1, sealed: 0, burned: 0 },
          colorless: { current: 0, max: 1, sealed: 1, burned: 0, sustained: 0 },
        },
      },
      [null, null],
    );
    expect(update['system.stonePools.might.max']).toBe(0);
    expect(update['system.stonePools.might.current']).toBe(0);
    expect(update['system.stonePools.might.sustained']).toBe(0);
    expect(update['system.progression.permanentColorless']).toBe(0);
    expect(update['system.stonePools.colorless.sealed']).toBe(0);
  });

  it('returns assigned pools to Ready without changing the assignment', () => {
    const update = unblockStonePoolsUpdate({
      stonePools: {
        might: { current: 1, max: 4, sustained: 1, sealed: 1, burned: 1 },
        colorless: { current: 0, max: 2, sustained: 0, sealed: 2, burned: 0 },
      },
    });
    expect(update['system.stonePools.might.current']).toBe(4);
    expect(update['system.stonePools.might.sealed']).toBe(0);
    expect(update['system.stonePools.might.burned']).toBe(0);
    expect(update['system.stonePools.colorless.current']).toBe(2);
    expect(update['system.stonePools.colorless.sealed']).toBe(0);
    expect(update['system.progression.stoneAssignments.might']).toBeUndefined();
  });
});
