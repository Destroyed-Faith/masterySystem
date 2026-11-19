/**
 * Independent QA regressions for the 2026-11-19 playtest tactics:
 * All-Out Attack drawback/round scope, Attack Action Transfer, Shared Free Raises.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const g = globalThis as any;

beforeEach(() => {
  g.game = {
    combat: { id: 'c1', round: 1, turn: 0, combatants: [] },
    actors: { get: () => null },
    user: { id: 'gm', isGM: true },
  };
  g.canvas = {
    tokens: { placeables: [] },
    grid: { size: 100, measureDistance: () => 0 },
    scene: { grid: { distance: 1.5 } },
  };
  g.Hooks = { callAll: () => undefined };
});

afterEach(() => {
  delete g.game;
});

import {
  ALL_OUT_ARMOR_MIN,
  declareAllOutAttack,
  grantRegularAttackActionTransfer,
  resolveAllOutDamageDice,
} from '../src/combat/tactical-options.js';
import { getAvailableAttackActions, getRoundState, type RoundState } from '../src/combat/action-economy.js';
import { getTargetArmor, getTargetEvade } from '../src/combat/target-defenses.js';
import {
  consumeFreeRaisesPreferSelfThenDonors,
  listFreeRaiseSources,
} from '../src/combat/shared-free-raises.js';
import { revertStoneAssignmentEffects } from '../src/stones/stone-assignment-reset.js';

type MockOpts = {
  type?: 'character' | 'npc';
  armor?: number;
  evade?: number;
  rs?: Partial<RoundState>;
  writable?: boolean;
  failWrites?: boolean;
  npcAttacks?: number;
};

function mockActor(id: string, opts: MockOpts = {}) {
  const flags: Record<string, any> = { 'mastery-system': {} };
  if (opts.rs) {
    flags['mastery-system'].roundState = {
      combatId: 'c1',
      round: 1,
      turn: 0,
      isPC: (opts.type ?? 'character') === 'character',
      movementActions: { total: 1, used: 0 },
      attackActions: { total: opts.npcAttacks ?? 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
      ...opts.rs,
    };
  }
  const writes: string[] = [];
  return {
    id,
    name: id,
    type: opts.type ?? 'character',
    writes,
    system: {
      combat: {
        armorTotal: opts.armor ?? 6,
        armorFromActiveBuffs: 0,
        evadeTotal: opts.evade ?? 12,
        evadeFromActiveBuffs: 0,
      },
      npcAttacksPerRound: opts.npcAttacks,
    },
    canUserModify: () => opts.writable !== false,
    getFlag: (scope: string, key: string) => flags[scope]?.[key],
    setFlag: async (scope: string, key: string, value: unknown) => {
      if (opts.failWrites) throw new Error('permission denied');
      writes.push(key);
      flags[scope] = flags[scope] ?? {};
      flags[scope][key] = JSON.parse(JSON.stringify(value));
    },
    unsetFlag: async (scope: string, key: string) => {
      if (opts.failWrites) throw new Error('permission denied');
      if (flags[scope]) delete flags[scope][key];
    },
  };
}

function combatant(actor: any, disposition: number, xy = { x: 0, y: 0 }) {
  return {
    actor,
    actorId: actor.id,
    token: { disposition, x: xy.x, y: xy.y, width: 1, height: 1 },
  };
}

describe('All-Out Attack — drawback is real, Round-scoped and Armor-gated', () => {
  it('lowers Armor/Evade only for the declared live Round', () => {
    const armorActor = mockActor('a', { armor: 6, rs: { allOutAttack: { active: true, penalty: 'armor' } } });
    const evadeActor = mockActor('e', { evade: 12, rs: { allOutAttack: { active: true, penalty: 'evade' } } });
    expect(getTargetArmor(armorActor)).toBe(2);
    expect(getTargetEvade(evadeActor)).toBe(10);

    g.game.combat.round = 2;
    expect(getTargetArmor(armorActor)).toBe(6);
    expect(getTargetEvade(evadeActor)).toBe(12);

    g.game.combat = { id: 'other', round: 1, combatants: [] };
    expect(getTargetArmor(armorActor)).toBe(6);
  });

  it('refuses the Armor drawback below 4 effective Armor, allows Evade', async () => {
    const low = mockActor('low', { armor: ALL_OUT_ARMOR_MIN - 1, rs: {} });
    const denied = await declareAllOutAttack(low, g.game.combat, 'armor');
    expect(denied).toMatchObject({ ok: false, reason: 'armor-below-minimum', effectiveArmor: 3 });
    expect(getRoundState(low as any, g.game.combat).allOutAttack).toBeUndefined();

    const viaEvade = await declareAllOutAttack(low, g.game.combat, 'evade');
    expect(viaEvade.ok).toBe(true);
    expect(getTargetEvade(low)).toBe(10);

    const enough = mockActor('ok', { armor: ALL_OUT_ARMOR_MIN, rs: {} });
    const accepted = await declareAllOutAttack(enough, g.game.combat, 'armor');
    expect(accepted.ok).toBe(true);
    expect(getTargetArmor(enough)).toBe(0);
  });

  it('an explicit 0 die (Special-only card / Negation-stripped reroll) is never re-read', () => {
    const live = { allOutAttack: { active: true, penalty: 'armor' } } as any;
    expect(resolveAllOutDamageDice(undefined, false, live)).toBe(1);
    expect(resolveAllOutDamageDice(0, false, live)).toBe(0);
    expect(resolveAllOutDamageDice(1, true, live)).toBe(0);
    expect(resolveAllOutDamageDice(undefined, true, live)).toBe(0);
    expect(resolveAllOutDamageDice(undefined, false, null)).toBe(0);
  });
});

describe('Regular Attack Action Transfer — allies, atomic writes, recipient Turn', () => {
  it('moves exactly the base Action; donor keeps Stone extras, recipient gets +1', async () => {
    const donor = mockActor('donor', {
      rs: { attackActions: { total: 2, used: 0 }, stoneBonuses: { extraAttacks: 1, extraReactions: 0, extraMoveMeters: 0 } },
    });
    const recipient = mockActor('rcpt', { rs: {} });
    const res = await grantRegularAttackActionTransfer(donor, recipient, g.game.combat, {
      donorToken: { disposition: 1 },
      recipientToken: { disposition: 1 },
    });
    expect(res).toEqual({ ok: true });
    expect(getAvailableAttackActions(donor as any, g.game.combat)).toBe(1);
    expect(getAvailableAttackActions(recipient as any, g.game.combat)).toBe(2);
    expect(getRoundState(recipient as any, g.game.combat).receivedAttackTransfer?.status).toBe('granted');

    const again = await grantRegularAttackActionTransfer(donor, recipient, g.game.combat, {
      donorToken: { disposition: 1 },
      recipientToken: { disposition: 1 },
    });
    expect(again).toMatchObject({ ok: false, reason: 'donor-base-unavailable' });
  });

  it('expires at Round End (new Round state has no transfer)', async () => {
    const donor = mockActor('donor', { rs: {} });
    const recipient = mockActor('rcpt', { rs: {} });
    await grantRegularAttackActionTransfer(donor, recipient, g.game.combat, { skipRangeCheck: true });
    g.game.combat.round = 2;
    expect(getAvailableAttackActions(donor as any, g.game.combat)).toBe(1);
    expect(getAvailableAttackActions(recipient as any, g.game.combat)).toBe(1);
  });

  it('rejects hostile recipients', async () => {
    const donor = mockActor('donor', { rs: {} });
    const enemy = mockActor('enemy', { type: 'npc', rs: {} });
    const res = await grantRegularAttackActionTransfer(donor, enemy, g.game.combat, {
      donorToken: { disposition: 1 },
      recipientToken: { disposition: -1 },
    });
    expect(res).toMatchObject({ ok: false, reason: 'not-ally' });
    expect(getAvailableAttackActions(donor as any, g.game.combat)).toBe(1);
  });

  it('does not lock the donor when no GM can record a gift to another player', async () => {
    g.game.user = { id: 'p1', isGM: false };
    const donor = mockActor('donor', { rs: {} });
    const foreign = mockActor('foreign', { rs: {}, writable: false });
    const res = await grantRegularAttackActionTransfer(donor, foreign, g.game.combat, { skipRangeCheck: true });
    expect(res).toMatchObject({ ok: false, reason: 'gm-unavailable' });
    expect(donor.writes).toEqual([]);
    expect(getAvailableAttackActions(donor as any, g.game.combat)).toBe(1);
  });

  it('keeps the gifted Action for NPC allies through slot reconciliation', async () => {
    const donor = mockActor('donor', { rs: {} });
    const npc = mockActor('npc', { type: 'npc', rs: {}, npcAttacks: 1 });
    await grantRegularAttackActionTransfer(donor, npc, g.game.combat, { skipRangeCheck: true });
    expect(getRoundState(npc as any, g.game.combat).attackActions.total).toBe(2);
  });

  it('survives the recipient undoing their Stone plan in Preparation', async () => {
    const donor = mockActor('donor', { rs: {} });
    const recipient = mockActor('rcpt', { rs: {} });
    await grantRegularAttackActionTransfer(donor, recipient, g.game.combat, { skipRangeCheck: true });
    await revertStoneAssignmentEffects({ actor: recipient, combat: g.game.combat, receipt: [] });
    expect(getRoundState(recipient as any, g.game.combat).stoneBonuses?.donatedAttackActions).toBe(1);
  });
});

describe('Shared Free Raises — no drawing from pools that were not assigned', () => {
  function setup() {
    const raises = (n: number) => ({ stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0, freeRaises: n } });
    const me = mockActor('me', { rs: raises(1) });
    const ally = mockActor('ally', { rs: raises(4) });
    const enemy = mockActor('enemy', { type: 'npc', rs: raises(8) });
    g.game.combat.combatants = [combatant(enemy, -1), combatant(ally, 1), combatant(me, 1)];
    return { me, ally, enemy };
  }

  it('lists only the own pool while no ally assigned anything', () => {
    const { me } = setup();
    expect(listFreeRaiseSources(me, g.game.combat).map((d) => d.actorId)).toEqual(['me']);
  });

  it('spends only the own pool; ally and enemy pools stay untouched', async () => {
    const { me, ally, enemy } = setup();
    const res = await consumeFreeRaisesPreferSelfThenDonors(me, 3, g.game.combat);
    expect(res).toEqual({ spent: 1, from: [{ actorId: 'me', amount: 1 }] });
    expect(getRoundState(ally as any, g.game.combat).stoneBonuses?.freeRaises).toBe(4);
    expect(getRoundState(enemy as any, g.game.combat).stoneBonuses?.freeRaises).toBe(8);
  });
});
