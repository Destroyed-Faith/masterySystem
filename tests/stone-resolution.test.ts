/**
 * Stone assignment is planning until Confirm. Automatic powers fire once.
 * Healing and Stress Healing wait for a target and cannot overwrite each other.
 */

import { describe, expect, it } from 'vitest';
import { STONE_POWERS } from '../src/stones/stone-powers';
import { shouldSettleStoneWave } from '../src/stones/stone-payment-rules';
import {
  applyHealingToCurrentBar,
  applyStressHealingToBars,
  effectsFromAllocation,
  enqueueStoneResolutions,
  healingChatContent,
  healingRankProfile,
  hpRestoredFromRoll,
  legalStoneTargets,
  markStoneResolutionResolved,
  pendingStoneResolutions,
  simulateConfirmAssignment,
  splitCommitEffects,
  stoneResolutionKind,
  stressHealingChatContent,
  stressHealingRankProfile,
  readHealthSnapshot,
  resolveHealthActor,
  resolveHealingSelection,
  resolveStressHealingSelection,
  type AssignmentSimulation,
  type StoneTargetCandidate,
} from '../src/stones/stone-resolution';

function freshAssignment(): AssignmentSimulation {
  return { locked: false, fired: [], queue: null };
}

const selfAndAllies: StoneTargetCandidate[] = [
  { id: 'self', name: 'Caster', self: true, distanceM: 0 },
  { id: 'near', name: 'Near Ally', self: false, distanceM: 1.5 },
  { id: 'far', name: 'Far Ally', self: false, distanceM: 9 },
  { id: 'unknown', name: 'Off Map', self: false, distanceM: null },
];

describe('Stone resolution — allocation does not execute', () => {
  it('placing stones produces no effects', () => {
    expect(effectsFromAllocation()).toEqual([]);
  });

  it('stones can still be changed before confirmation', () => {
    const planned = [
      { powerId: 'resolve.healing', tier: 1 },
      { powerId: 'wits.initiativeBoost', tier: 2 },
    ];
    const revised = planned.filter((row) => row.powerId !== 'wits.initiativeBoost');
    revised.push({ powerId: 'resolve.stressHealing', tier: 3 });
    expect(effectsFromAllocation()).toEqual([]);
    expect(revised.map((row) => row.powerId)).toEqual(['resolve.healing', 'resolve.stressHealing']);
  });

  it('Healing and Stress Healing apply() do not roll or heal by themselves', async () => {
    const actor = {
      name: 'Caster',
      system: {
        health: { current: 4, bars: [{ current: 4, max: 20 }], currentBar: 0 },
        stress: { bars: [{ current: 2, max: 10 }], currentBar: 0 },
      },
    };
    await STONE_POWERS['resolve.healing'].apply({
      actor: actor as any,
      combatant: {} as any,
      tier: 4,
      cost: 8,
    });
    await STONE_POWERS['resolve.stressHealing'].apply({
      actor: actor as any,
      combatant: {} as any,
      tier: 4,
      cost: 8,
    });
    expect(actor.system.health.bars[0].current).toBe(4);
    expect(actor.system.stress.bars[0].current).toBe(2);
  });
});

describe('Stone resolution — confirm locks and fires automatic powers once', () => {
  it('classifies passive, automatic, and interactive powers from their definitions', () => {
    expect(stoneResolutionKind('resolve.damageReduction')).toBe('passive');
    expect(stoneResolutionKind('wits.initiativeBoost')).toBe('automatic');
    expect(stoneResolutionKind('generic.extraAttack')).toBe('automatic');
    expect(stoneResolutionKind('agility.slip')).toBe('automatic');
    expect(stoneResolutionKind('resolve.healing')).toBe('interactive');
    expect(stoneResolutionKind('resolve.stressHealing')).toBe('interactive');
    expect(stoneResolutionKind('influence.regeneration')).toBe('interactive');
  });

  it('confirm locks the assignment and runs Initiative Boost exactly once', () => {
    const fired: string[] = [];
    const powers = [
      { powerId: 'wits.initiativeBoost', tier: 2 },
      { powerId: 'generic.extraAttack', tier: 1 },
      { powerId: 'resolve.healing', tier: 3 },
    ];
    const committed = simulateConfirmAssignment(freshAssignment(), {
      combatId: 'combat-1',
      round: 2,
      powers,
      onAutomatic: (power) => fired.push(power.powerId),
    });
    expect(committed.locked).toBe(true);
    expect(fired).toEqual(['wits.initiativeBoost', 'generic.extraAttack']);
    expect(pendingStoneResolutions(committed.queue).map((ticket) => ticket.powerId)).toEqual([
      'resolve.healing',
    ]);

    const again = simulateConfirmAssignment(committed, {
      combatId: 'combat-1',
      round: 2,
      powers,
      onAutomatic: (power) => fired.push(power.powerId),
    });
    expect(again.locked).toBe(true);
    expect(fired).toEqual(['wits.initiativeBoost', 'generic.extraAttack']);
    expect(again.queue?.tickets).toHaveLength(1);
  });

  it('a paid receipt refuses a second charge of the same wave', () => {
    expect(
      shouldSettleStoneWave({
        reviewMode: true,
        paidAccKeys: ['resolve.healing:resolve:0'],
        accKey: 'resolve.healing:resolve:0',
        currentUses: 0,
        usesInKey: 0,
      }),
    ).toBe(false);
  });

  it('reopening a finished queue does not execute anything', () => {
    let calls = 0;
    const state = simulateConfirmAssignment(freshAssignment(), {
      combatId: 'combat-1',
      round: 1,
      powers: [{ powerId: 'generic.extraMovement', tier: 1 }],
      onAutomatic: () => {
        calls += 1;
      },
    });
    expect(calls).toBe(1);
    expect(state.locked).toBe(true);
    expect(pendingStoneResolutions(state.queue)).toEqual([]);
    const reopened = simulateConfirmAssignment(state, {
      combatId: 'combat-1',
      round: 1,
      powers: [{ powerId: 'generic.extraMovement', tier: 1 }],
      onAutomatic: () => {
        calls += 1;
      },
    });
    expect(calls).toBe(1);
    expect(reopened.fired).toEqual(state.fired);
  });
});

describe('Stone resolution — Healing and Stress Healing', () => {
  it('uses each power’s own dice and the same published ranges', () => {
    expect(healingRankProfile(1)).toEqual({ dice: 4, rangeM: 2 });
    expect(healingRankProfile(4)).toEqual({ dice: 16, rangeM: 16 });
    expect(stressHealingRankProfile(1)).toEqual({ dice: 1, rangeM: 2 });
    expect(stressHealingRankProfile(4)).toEqual({ dice: 4, rangeM: 16 });
    expect(splitCommitEffects([
      { powerId: 'resolve.healing', tier: 2 },
      { powerId: 'resolve.stressHealing', tier: 1 },
      { powerId: 'wits.initiativeBoost', tier: 1 },
    ]).interactive.map((row) => row.powerId)).toEqual(['resolve.healing', 'resolve.stressHealing']);
  });

  it('offers only self and allies inside the Healing range', () => {
    const legal = legalStoneTargets(selfAndAllies, healingRankProfile(1).rangeM);
    expect(legal.map((row) => row.id)).toEqual(['self', 'near']);
  });

  it('opens Healing after confirm, applies it to the chosen actor, and caps the current bar', async () => {
    const state = simulateConfirmAssignment(freshAssignment(), {
      combatId: 'combat-1',
      round: 1,
      powers: [{ powerId: 'resolve.healing', tier: 2 }],
      onAutomatic: () => undefined,
    });
    const ticket = pendingStoneResolutions(state.queue)[0];
    expect(ticket?.powerId).toBe('resolve.healing');

    const health = {
      self: { bars: [{ current: 20, max: 20 }], currentBar: 0 },
      near: { bars: [{ current: 8, max: 20 }], currentBar: 0 },
    };
    const chats: string[] = [];
    const seen: string[][] = [];
    const result = await resolveHealingSelection({
      sourceName: 'Caster',
      tier: ticket.tier,
      candidates: selfAndAllies,
      choose: async (legal) => {
        seen.push(legal.map((row) => row.id));
        return 'near';
      },
      roll: async (formula) => {
        expect(formula).toBe('8d8');
        return 21;
      },
      healthOf: (id) => health[id as 'near'],
      writeHealth: (id, next) => {
        health[id as 'near'] = next;
      },
      chat: (content) => {
        chats.push(content);
      },
    });

    expect(seen).toEqual([['self', 'near']]);
    expect(result).toMatchObject({ ok: true, targetId: 'near', restored: 12 });
    expect(health.near.bars[0].current).toBe(20);
    expect(health.self.bars[0].current).toBe(20);
    expect(chats[0]).toContain('Caster');
    expect(chats[0]).toContain('Healing');
    expect(chats[0]).toContain('Near Ally');
    expect(chats[0]).toContain('8d8');
    expect(chats[0]).toContain('12 HP restored');
    expect(hpRestoredFromRoll(8, 20, 21)).toBe(12);
  });

  it('refuses an out-of-range Healing target and does not write HP', async () => {
    const health = { far: { bars: [{ current: 1, max: 20 }], currentBar: 0 } };
    let writes = 0;
    const result = await resolveHealingSelection({
      sourceName: 'Caster',
      tier: 1,
      candidates: selfAndAllies,
      choose: async () => 'far',
      roll: async () => 10,
      healthOf: (id) => health[id as 'far'],
      writeHealth: () => {
        writes += 1;
      },
      chat: () => undefined,
    });
    expect(result.ok).toBe(false);
    expect(writes).toBe(0);
    expect(health.far.bars[0].current).toBe(1);
  });

  it('reads wounded bars when current and max are not copied by object spread', () => {
    const bar: Record<string, unknown> = {};
    Object.defineProperty(bar, 'current', { enumerable: false, value: 4 });
    Object.defineProperty(bar, 'max', { enumerable: false, value: 20 });
    const health = readHealthSnapshot({ bars: [bar], currentBar: 0 });
    expect(health?.bars[0]).toMatchObject({ current: 4, max: 20 });
    const applied = applyHealingToCurrentBar(health!, 22);
    expect(applied.restored).toBe(16);
    expect(applied.bars[0].current).toBe(20);
    expect({ ...bar }).not.toHaveProperty('current');
  });

  it('reads stress bars stored as a numeric object and fills real headroom', () => {
    const track = readHealthSnapshot({
      bars: { 0: { current: 2, max: 8 }, 1: { current: 8, max: 8 } },
      currentBar: 0,
    });
    expect(track?.bars).toHaveLength(2);
    const applied = applyStressHealingToBars(track!.bars, track!.currentBar, 7);
    expect(applied.restored).toBe(6);
    expect(applied.bars[0].current).toBe(8);
  });

  it('heals the combat token, not the full world actor that shares its id', () => {
    const world = { id: 'oda', isToken: false, system: { health: { bars: [{ current: 20, max: 20 }], currentBar: 0 } } };
    const token = { id: 'oda', isToken: true, system: { health: { bars: [{ current: 3, max: 20 }], currentBar: 0 } } };
    const resolved = resolveHealthActor('oda', world, [{ actorId: 'oda', actor: token }], world, {
      actorId: 'oda',
      actor: token,
    });
    expect(resolved).toBe(token);
    const applied = applyHealingToCurrentBar(readHealthSnapshot(resolved.system.health)!, 22);
    expect(applied.restored).toBe(17);
    expect(world.system.health.bars[0].current).toBe(20);
  });

  it('resolves Stress Healing with its own pool and range, then continues', async () => {
    const stress = {
      ally: {
        bars: [
          { current: 10, max: 10 },
          { current: 3, max: 10 },
        ],
        currentBar: 1,
      },
    };
    const chats: string[] = [];
    const result = await resolveStressHealingSelection({
      sourceName: 'Caster',
      tier: 2,
      candidates: [
        { id: 'self', name: 'Caster', self: true, distanceM: 0 },
        { id: 'ally', name: 'Ally', self: false, distanceM: 3 },
        { id: 'far', name: 'Far', self: false, distanceM: 5 },
      ],
      choose: async (legal) => {
        expect(legal.map((row) => row.id)).toEqual(['self', 'ally']);
        return 'ally';
      },
      roll: async (formula) => {
        expect(formula).toBe('2d8');
        return 9;
      },
      stressOf: (id) => stress[id as 'ally'],
      writeStress: (id, next) => {
        stress[id as 'ally'] = next;
      },
      chat: (content) => {
        chats.push(content);
      },
    });
    expect(result).toMatchObject({ ok: true, targetId: 'ally', restored: 7 });
    expect(stress.ally.bars[1].current).toBe(10);
    expect(chats[0]).toContain('Stress Healing');
    expect(chats[0]).toContain('Ally');
    expect(chats[0]).toContain('7 Stress removed');
    expect(stressHealingRankProfile(2).rangeM).toBe(4);
  });
});

describe('Stone resolution — queue identity', () => {
  it('runs interactive powers sequentially and keeps automatic powers out of the queue', async () => {
    let state = simulateConfirmAssignment(freshAssignment(), {
      combatId: 'c',
      round: 3,
      powers: [
        { powerId: 'generic.extraAttack', tier: 1 },
        { powerId: 'resolve.healing', tier: 2 },
        { powerId: 'resolve.stressHealing', tier: 1 },
      ],
      onAutomatic: () => undefined,
    });
    const order: string[] = [];
    while (pendingStoneResolutions(state.queue).length) {
      const ticket = pendingStoneResolutions(state.queue)[0];
      order.push(ticket.powerId);
      state = {
        ...state,
        queue: markStoneResolutionResolved(state.queue!, ticket.id),
      };
    }
    expect(order).toEqual(['resolve.healing', 'resolve.stressHealing']);
    expect(state.fired).toEqual(['generic.extraAttack:1']);
  });

  it('does not duplicate costs or tickets when the same confirm is saved twice', () => {
    const first = enqueueStoneResolutions(null, 'c', 1, [
      { powerId: 'resolve.healing', tier: 2 },
      { powerId: 'wits.initiativeBoost', tier: 1 },
    ]);
    const second = enqueueStoneResolutions(first, 'c', 1, [
      { powerId: 'resolve.healing', tier: 2 },
      { powerId: 'resolve.stressHealing', tier: 1 },
    ]);
    expect(second.tickets.map((ticket) => ticket.id)).toEqual([
      'c:1:resolve.healing:2',
      'c:1:resolve.stressHealing:1',
    ]);
    expect(first.tickets).toHaveLength(1);
  });

  it('resolving one ticket cannot overwrite the others', () => {
    const queue = enqueueStoneResolutions(null, 'c', 4, [
      { powerId: 'resolve.healing', tier: 1 },
      { powerId: 'resolve.stressHealing', tier: 4 },
      { powerId: 'influence.regeneration', tier: 2 },
    ]);
    const healed = markStoneResolutionResolved(queue, queue.tickets[0].id);
    expect(healed.tickets[0].status).toBe('resolved');
    expect(healed.tickets[1]).toMatchObject({
      powerId: 'resolve.stressHealing',
      tier: 4,
      status: 'pending',
    });
    expect(healed.tickets[2]).toMatchObject({
      powerId: 'influence.regeneration',
      tier: 2,
      status: 'pending',
    });
    expect(queue.tickets[0].status).toBe('pending');
  });

  it('states the rolled total and the HP that actually landed', () => {
    const text = healingChatContent({
      sourceName: 'Caster',
      targetName: 'Ally',
      dice: 4,
      rolled: 21,
      restored: 12,
    });
    expect(text).toContain('21');
    expect(text).toContain('12 HP restored');
    const full = applyHealingToCurrentBar(
      { bars: [{ current: 0, max: 30 }], currentBar: 0 },
      21,
    );
    expect(full.restored).toBe(21);
    expect(stressHealingChatContent({
      sourceName: 'Caster',
      targetName: 'Ally',
      dice: 4,
      rolled: 21,
      restored: 12,
      rangeM: 16,
    })).toContain('12 Stress removed');
  });
});
