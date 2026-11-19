/**
 * QA follow-up 2026-11-19: GM-relayed Attack Action Transfer, donor-allocated
 * Shared Free Raises, All-Out Armor on the declaring attacker, MR-2 concept
 * catalogue names.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const g = globalThis as any;
const GM = { id: 'gm', isGM: true };
const P1 = { id: 'p1', isGM: false };
const P2 = { id: 'p2', isGM: false };

let registry: Map<string, any>;

beforeEach(() => {
  registry = new Map();
  g.game = {
    combat: { id: 'c1', round: 1, turn: 0, combatants: [] },
    combats: { get: (id: string) => (id === 'c1' ? g.game.combat : undefined) },
    actors: { get: (id: string) => registry.get(id) ?? null },
    users: { activeGM: { id: 'gm', isGM: true, active: true }, get: (id: string) => ({ gm: GM, p1: P1, p2: P2 } as any)[id] },
    user: GM,
  };
  g.canvas = {
    tokens: { placeables: [] },
    grid: { size: 100, measureDistance: undefined },
    scene: { grid: { distance: 1.5 } },
  };
  g.Hooks = { callAll: () => undefined };
});

afterEach(() => {
  delete g.game;
});

import { getAvailableAttackActions, getRoundState, remainingFreeRaiseAllowance } from '../src/combat/action-economy.js';
import { declareAllOutAttack } from '../src/combat/tactical-options.js';
import { getTargetArmor } from '../src/combat/target-defenses.js';
import {
  handleGmTeamworkRequest,
  requestAttackActionTransfer,
  requestFreeRaiseAllocation,
} from '../src/combat/teamwork-transactions.js';
import { settleGmRelay } from '../src/combat/gm-relay.js';
import {
  consumeFreeRaisesPreferSelfThenDonors,
  listFreeRaiseSources,
  totalAvailableSharedFreeRaises,
} from '../src/combat/shared-free-raises.js';
import { revertStoneAssignmentEffects } from '../src/stones/stone-assignment-reset.js';
import { ALL_POWER_TEMPLATES } from '../src/utils/powers/templates/index.js';

type Opts = {
  type?: 'character' | 'npc';
  armor?: number;
  owners?: string[];
  freeRaises?: number;
  failWrites?: boolean;
};

function actor(id: string, opts: Opts = {}) {
  const flags: Record<string, any> = {
    'mastery-system': {
      roundState: {
        combatId: 'c1',
        round: 1,
        turn: 0,
        isPC: (opts.type ?? 'character') === 'character',
        movementActions: { total: 1, used: 0 },
        attackActions: { total: 1, used: 0 },
        reactionActions: { total: 1, used: 0 },
        moveBonusMeters: 0,
        stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0, freeRaises: opts.freeRaises ?? 0 },
      },
    },
  };
  const owners = opts.owners ?? [];
  const a = {
    id,
    uuid: '',
    name: id,
    type: opts.type ?? 'character',
    failWrites: !!opts.failWrites,
    system: { combat: { armorTotal: opts.armor ?? 6, armorFromActiveBuffs: 0, evadeTotal: 12, evadeFromActiveBuffs: 0 } },
    testUserPermission: (u: any) => !!u?.isGM || owners.includes(String(u?.id)),
    canUserModify: (u: any) => !!u?.isGM || owners.includes(String(u?.id)),
    getFlag: (scope: string, key: string) => flags[scope]?.[key],
    setFlag: async (scope: string, key: string, value: unknown) => {
      if (a.failWrites) throw new Error('write failed');
      flags[scope] = flags[scope] ?? {};
      flags[scope][key] = JSON.parse(JSON.stringify(value));
    },
    unsetFlag: async (scope: string, key: string) => {
      if (a.failWrites) throw new Error('write failed');
      if (flags[scope]) delete flags[scope][key];
    },
  };
  registry.set(id, a);
  return a;
}

function join2(actors: Array<[any, number, number?]>) {
  g.game.combat.combatants = actors.map(([a, disposition, x]) => ({
    actor: a,
    actorId: a.id,
    token: { disposition, x: x ?? 0, y: 0, width: 1, height: 1 },
  }));
}

/** Socket that hands relayed requests to the GM handler, as the GM client would. */
function wireGmSocket(): any[] {
  const sent: any[] = [];
  g.game.socket = {
    emit: (_channel: string, payload: any) => {
      sent.push(payload);
      queueMicrotask(async () => {
        const asUser = g.game.user;
        g.game.user = GM;
        const res = await handleGmTeamworkRequest(payload, g.game.users.get(payload.replyTo));
        g.game.user = asUser;
        settleGmRelay(payload.requestId, res.ok, res.ok ? undefined : res.reason);
      });
    },
  };
  return sent;
}

const tok = (disposition: number, x = 0) => ({ disposition, x, y: 0, width: 1, height: 1 });

describe('Attack Action Transfer across players (GM relay)', () => {
  it('player A gives the base Action to player B without owning B', async () => {
    const a = actor('a', { owners: ['p1'] });
    const b = actor('b', { owners: ['p2'] });
    join2([[a, 1], [b, 1]]);
    g.game.user = P1;
    const sent = wireGmSocket();

    const res = await requestAttackActionTransfer(a, b, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) });
    expect(res).toEqual({ ok: true });
    expect(sent.map((p) => p.type)).toEqual(['gmTeamworkTransfer']);
    expect(getAvailableAttackActions(a as any, g.game.combat)).toBe(0);
    expect(getAvailableAttackActions(b as any, g.game.combat)).toBe(2);
    expect(getRoundState(b as any, g.game.combat).receivedAttackTransfer).toMatchObject({
      fromActorId: 'a',
      toActorId: 'b',
      status: 'granted',
    });
  });

  it('the GM rejects a requester who does not control the donor', async () => {
    const a = actor('a', { owners: ['p1'] });
    const b = actor('b', { owners: ['p2'] });
    join2([[a, 1], [b, 1]]);
    const res = await handleGmTeamworkRequest(
      { type: 'gmTeamworkTransfer', combatId: 'c1', round: 1, donorId: 'a', recipientId: 'b' },
      P2,
    );
    expect(res).toEqual({ ok: false, reason: 'permission' });
    expect(getAvailableAttackActions(a as any, g.game.combat)).toBe(1);
    expect(getAvailableAttackActions(b as any, g.game.combat)).toBe(1);
  });

  it('two simultaneous requests book the Action only once', async () => {
    const a = actor('a', { owners: ['p1'] });
    const b = actor('b');
    const c = actor('c');
    join2([[a, 1], [b, 1], [c, 1]]);
    const req = (to: string) =>
      handleGmTeamworkRequest({ type: 'gmTeamworkTransfer', combatId: 'c1', round: 1, donorId: 'a', recipientId: to }, P1);
    const [r1, r2] = await Promise.all([req('b'), req('c')]);
    expect([r1.ok, r2.ok].filter(Boolean)).toHaveLength(1);
    expect([r1, r2].find((r) => !r.ok)).toEqual({ ok: false, reason: 'donor-base-unavailable' });
    const gifts = getAvailableAttackActions(b as any, g.game.combat) + getAvailableAttackActions(c as any, g.game.combat);
    expect(gifts).toBe(3);
  });

  it('restores the recipient when the donor write fails (nothing lost, nothing doubled)', async () => {
    const a = actor('a', { owners: ['p1'], failWrites: true });
    const b = actor('b');
    join2([[a, 1], [b, 1]]);
    const res = await handleGmTeamworkRequest(
      { type: 'gmTeamworkTransfer', combatId: 'c1', round: 1, donorId: 'a', recipientId: 'b' },
      P1,
    );
    expect(res).toEqual({ ok: false, reason: 'write-failed' });
    expect(getAvailableAttackActions(a as any, g.game.combat)).toBe(1);
    expect(getAvailableAttackActions(b as any, g.game.combat)).toBe(1);
    expect(getRoundState(b as any, g.game.combat).stoneBonuses?.donatedAttackActions ?? 0).toBe(0);
  });

  it('rejects enemies, stale Rounds, turns after Preparation and out-of-range allies', async () => {
    const a = actor('a', { owners: ['p1'] });
    const foe = actor('foe', { type: 'npc' });
    const far = actor('far');
    join2([[a, 1, 0], [foe, -1, 0], [far, 1, 2000]]);
    const ask = (to: string, round = 1) =>
      handleGmTeamworkRequest({ type: 'gmTeamworkTransfer', combatId: 'c1', round, donorId: 'a', recipientId: to }, P1);
    expect(await ask('foe')).toEqual({ ok: false, reason: 'not-ally' });
    expect(await ask('far')).toEqual({ ok: false, reason: 'range' });
    expect(await ask('far', 2)).toEqual({ ok: false, reason: 'stale-round' });

    const near = actor('near');
    join2([[a, 1, 0], [near, 1, 0]]);
    g.game.combat.started = true;
    g.game.combat.getFlag = (_s: string, key: string) => (key === 'activeBuffPrepClosedRound' ? 1 : undefined);
    expect(await ask('near')).toEqual({ ok: false, reason: 'not-preparation' });
    expect(getAvailableAttackActions(a as any, g.game.combat)).toBe(1);
  });

  it('without a connected GM nothing is written', async () => {
    const a = actor('a', { owners: ['p1'] });
    const b = actor('b', { owners: ['p2'] });
    join2([[a, 1], [b, 1]]);
    g.game.user = P1;
    g.game.users = { get: () => null };
    g.game.socket = { emit: () => undefined };
    const res = await requestAttackActionTransfer(a, b, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) });
    expect(res).toEqual({ ok: false, reason: 'gm-unavailable' });
    expect(getAvailableAttackActions(a as any, g.game.combat)).toBe(1);
  });
});

describe('Shared Free Raises — donor allocates, recipient spends only its share', () => {
  it('moves Raises from the donor pool; the total never grows', async () => {
    const donor = actor('donor', { freeRaises: 4 });
    const ally = actor('ally', { freeRaises: 1 });
    join2([[donor, 1], [ally, 1]]);
    const res = await requestFreeRaiseAllocation(donor, ally, 3, g.game.combat, {
      donorToken: tok(1),
      recipientToken: tok(1),
    });
    expect(res).toEqual({ ok: true });
    expect(getRoundState(donor as any, g.game.combat).stoneBonuses?.freeRaises).toBe(1);
    expect(getRoundState(donor as any, g.game.combat).sharedFreeRaisesGiven).toEqual([
      { toActorId: 'ally', toUuid: '', toName: 'ally', amount: 3 },
    ]);
    expect(totalAvailableSharedFreeRaises(ally, g.game.combat)).toBe(4);
    expect(listFreeRaiseSources(ally, g.game.combat).map((s) => [s.actorId, s.remaining])).toEqual([
      ['ally', 1],
      ['donor', 3],
    ]);
    const poolSum =
      Number(getRoundState(donor as any, g.game.combat).stoneBonuses?.freeRaises) +
      Number(getRoundState(ally as any, g.game.combat).sharedFreeRaisesReceived?.[0]?.remaining);
    expect(poolSum).toBe(4);
  });

  it('rejects over-allocation, enemies and allies out of range', async () => {
    const donor = actor('donor', { freeRaises: 2 });
    const ally = actor('ally');
    const foe = actor('foe', { type: 'npc' });
    join2([[donor, 1], [ally, 1], [foe, -1]]);
    expect(await requestFreeRaiseAllocation(donor, ally, 3, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) }))
      .toEqual({ ok: false, reason: 'no-raises' });
    expect(await requestFreeRaiseAllocation(donor, foe, 1, g.game.combat, { donorToken: tok(1), recipientToken: tok(-1) }))
      .toEqual({ ok: false, reason: 'not-ally' });
    expect(await requestFreeRaiseAllocation(donor, ally, 1, g.game.combat, { donorToken: tok(1, 0), recipientToken: tok(1, 2000) }))
      .toEqual({ ok: false, reason: 'range' });
    expect(await requestFreeRaiseAllocation(donor, ally, 0, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) }))
      .toEqual({ ok: false, reason: 'invalid-amount' });
    expect(getRoundState(donor as any, g.game.combat).stoneBonuses?.freeRaises).toBe(2);
  });

  it('recipient spends own pool, then its share — never the donor pool', async () => {
    const donor = actor('donor', { freeRaises: 4 });
    const ally = actor('ally', { freeRaises: 1 });
    join2([[donor, 1], [ally, 1]]);
    await requestFreeRaiseAllocation(donor, ally, 2, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) });

    const res = await consumeFreeRaisesPreferSelfThenDonors(ally, 5, g.game.combat);
    expect(res).toEqual({ spent: 3, from: [{ actorId: 'ally', amount: 1 }, { actorId: 'donor', amount: 2 }] });
    expect(getRoundState(donor as any, g.game.combat).stoneBonuses?.freeRaises).toBe(2);
    expect(totalAvailableSharedFreeRaises(ally, g.game.combat)).toBe(0);
  });

  it('parallel commits never spend more than was assigned', async () => {
    const donor = actor('donor', { freeRaises: 3 });
    const ally = actor('ally');
    join2([[donor, 1], [ally, 1]]);
    await requestFreeRaiseAllocation(donor, ally, 3, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) });
    const [x, y] = await Promise.all([
      consumeFreeRaisesPreferSelfThenDonors(ally, 2, g.game.combat),
      consumeFreeRaisesPreferSelfThenDonors(ally, 2, g.game.combat),
    ]);
    expect(x.spent + y.spent).toBe(3);
  });

  it('a failed recipient write spends nothing', async () => {
    const donor = actor('donor', { freeRaises: 2 });
    const ally = actor('ally');
    join2([[donor, 1], [ally, 1]]);
    await requestFreeRaiseAllocation(donor, ally, 2, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) });
    (ally as any).failWrites = true;
    expect(await consumeFreeRaisesPreferSelfThenDonors(ally, 2, g.game.combat)).toEqual({ spent: 0, from: [] });
    (ally as any).failWrites = false;
    expect(totalAvailableSharedFreeRaises(ally, g.game.combat)).toBe(2);
  });

  it('rolls the recipient back when the donor deduction fails', async () => {
    const donor = actor('donor', { freeRaises: 2, failWrites: true });
    const ally = actor('ally');
    join2([[donor, 1], [ally, 1]]);
    const res = await requestFreeRaiseAllocation(donor, ally, 2, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) });
    expect(res).toEqual({ ok: false, reason: 'write-failed' });
    expect(totalAvailableSharedFreeRaises(ally, g.game.combat)).toBe(0);
  });

  it('works across players through the GM and expires at Round End', async () => {
    const donor = actor('donor', { freeRaises: 4, owners: ['p1'] });
    const ally = actor('ally', { owners: ['p2'] });
    join2([[donor, 1], [ally, 1]]);
    g.game.user = P1;
    const sent = wireGmSocket();
    const res = await requestFreeRaiseAllocation(donor, ally, 2, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) });
    expect(res).toEqual({ ok: true });
    expect(sent[0]).toMatchObject({ type: 'gmTeamworkFreeRaises', amount: 2, donorId: 'donor', recipientId: 'ally' });
    expect(totalAvailableSharedFreeRaises(ally, g.game.combat)).toBe(2);

    g.game.combat.round = 2;
    expect(totalAvailableSharedFreeRaises(ally, g.game.combat)).toBe(0);
  });

  it('a higher Intellect Rank later in the Round never refills beyond the allowance', () => {
    const rs: any = {
      stoneBonuses: { freeRaises: 0, freeRaisesUsed: 1 },
      sharedFreeRaisesGiven: [{ toActorId: 'x', toUuid: '', toName: 'x', amount: 1 }],
    };
    expect(remainingFreeRaiseAllowance(rs, 4)).toBe(2);
    expect(remainingFreeRaiseAllowance({ stoneBonuses: { freeRaises: 2 } } as any, 4)).toBe(4);
  });

  it('GM Stone reset of the donor takes back unspent assigned Raises', async () => {
    const donor = actor('donor', { freeRaises: 4 });
    const ally = actor('ally');
    join2([[donor, 1], [ally, 1]]);
    await requestFreeRaiseAllocation(donor, ally, 3, g.game.combat, { donorToken: tok(1), recipientToken: tok(1) });
    await consumeFreeRaisesPreferSelfThenDonors(ally, 1, g.game.combat);
    await revertStoneAssignmentEffects({ actor: donor, combat: g.game.combat, receipt: [] });
    expect(totalAvailableSharedFreeRaises(ally, g.game.combat)).toBe(0);
    expect(getRoundState(donor as any, g.game.combat).sharedFreeRaisesGiven).toBeUndefined();
    expect(getRoundState(donor as any, g.game.combat).stoneBonuses?.freeRaises).toBe(0);
  });
});

describe('All-Out Attack — drawback and Armor minimum belong to the attacker', () => {
  it('lowers only the declaring attacker\u2019s own Armor, not its target\u2019s', async () => {
    const attacker = actor('att', { armor: 6 });
    const defender = actor('def', { armor: 10 });
    const res = await declareAllOutAttack(attacker, g.game.combat, 'armor');
    expect(res.ok).toBe(true);
    expect(getTargetArmor(attacker)).toBe(2);
    expect(getTargetArmor(defender)).toBe(10);
  });

  it('checks the attacker\u2019s Armor for the −4 choice, whatever its target has', async () => {
    const attacker = actor('att', { armor: 3 });
    actor('def', { armor: 20 });
    expect(await declareAllOutAttack(attacker, g.game.combat, 'armor')).toMatchObject({
      ok: false,
      reason: 'armor-below-minimum',
      effectiveArmor: 3,
    });
  });
});

describe('MR-2 character concepts use existing catalogue entries', () => {
  const ph = readFileSync(join(__dirname, '..', 'docs', 'Rules', 'Canonical', 'Players_Handbook.md'), 'utf8');
  const rows = [...ph.matchAll(/^\| (Passive \d|Reaction|Active Buff), \*\*PL \d+\*\* \| \*\*([^*]+)\*\* \|\r?$/gm)];
  const categoryOf: Record<string, string> = { Reaction: 'reaction', 'Active Buff': 'activeBuff' };

  it('finds the 13 concept slot tables', () => {
    expect(rows.length).toBe(13 * 4);
  });

  it.each(rows.map((m) => [m[2], m[1]]))('%s exists in the runtime catalogue', (name, slot) => {
    const category = categoryOf[slot as string] ?? 'passive';
    const hits = ALL_POWER_TEMPLATES.filter((t: any) => t.name === name && t.category === category);
    expect(hits.length).toBe(1);
  });

  it('Concept 11 names the existing Reactive Cleanse template', () => {
    expect(ph).toContain('| Reaction, **PL 4** | **Reaction: Reactive Cleanse** |');
    expect(ALL_POWER_TEMPLATES.some((t: any) => t.templateId === 'reaction-reactive-cleanse')).toBe(true);
  });
});
