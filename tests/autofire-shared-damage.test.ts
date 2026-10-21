/**
 * Stepped Autofire — shared ordered Damage Roll with per-hit Damage Negation.
 * Pure helpers only (no Foundry).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  autofireRaiseShareKey,
  autofireSessionCount,
  createAutofireDamageSession,
  damageFromSharedDice,
  endAutofireSession,
  getAutofireSession,
  newAutofirePowerUseId,
  normalizeOmitCount,
  peekSharedRaiseAllocation,
  raiseAllocShareKey,
  readAutofirePowerUseId,
  registerAutofireSession,
  rememberSharedRaiseAllocation,
  sharedDamageForHit,
} from '../src/combat/autofire-shared-damage';
import { autofireDamageFlags } from '../src/combat/autofire-stepped';
import { isInstantAoeFlags, martialWeaponDamageApplies } from '../src/combat/damage-transfer';
import { toSharedAoeDamagePayload } from '../src/combat/aoe-melee-resolution';

const FACES = [3, 8, 2, 7]; // one shared 4d8 roll, in roll order
const PLAN = [{ effect: 'damage' }] as any;

afterEach(async () => {
  for (const id of ['use-A', 'use-B', 'use-C']) await endAutofireSession(id);
});

describe('Autofire shared dice — omit per hit', () => {
  it('omit 0 / 1 / 2 across three hits → totals 20 / 17 / 9; natural 8s 1 / 1 / 0', () => {
    const hits = [0, 1, 2].map((omit) => damageFromSharedDice(FACES, omit));
    expect(hits.map((h) => h.total)).toEqual([20, 17, 9]);
    expect(hits.map((h) => h.natural8s)).toEqual([1, 1, 0]);
  });

  it('same target twice (omit 1 then omit 2): separate omit, identical faces', () => {
    const faces = [...FACES];
    const first = damageFromSharedDice(faces, 1);
    const second = damageFromSharedDice(faces, 2);
    expect(first.total).toBe(17);
    expect(second.total).toBe(9);
    expect(first.total).not.toBe(second.total);
    expect(faces).toEqual(FACES); // the shared roll is never mutated
  });

  it('omitted natural 8s do not count toward the natural-8 minimum', () => {
    const t = damageFromSharedDice([8, 8, 1, 4], 2);
    expect(t.natural8s).toBe(0);
    expect(t.omittedNatural8s).toBe(2);
    expect(t.total).toBe(5);
    // Kept 8s still count.
    expect(damageFromSharedDice([1, 8, 8], 1).natural8s).toBe(2);
  });

  it('omit is a deterministic PREFIX of the ordered list (no cherry-picking)', () => {
    // Omit 1 always drops index 0 (the 3), never the highest or lowest die.
    expect(damageFromSharedDice(FACES, 1).total).toBe(FACES.slice(1).reduce((a, b) => a + b, 0));
    expect(damageFromSharedDice(FACES, 2).total).toBe(FACES.slice(2).reduce((a, b) => a + b, 0));
    // Same inputs, same result, every time.
    expect(damageFromSharedDice(FACES, 2)).toEqual(damageFromSharedDice(FACES, 2));
    // Reordering the roll changes which dice drop — the order is fixed by the roll.
    expect(damageFromSharedDice([7, 2, 8, 3], 1).total).toBe(13);
  });

  it('one roll: helpers never re-roll (no RNG, input untouched, deterministic)', () => {
    const rnd = vi.spyOn(Math, 'random');
    const faces = [4, 4, 4, 4];
    const a = damageFromSharedDice(faces, 1);
    const b = damageFromSharedDice(faces, 1);
    expect(a).toEqual(b);
    sharedDamageForHit({ totalDamage: 16, count8s: 0, orderedDieFaces: faces }, 1);
    expect(rnd).not.toHaveBeenCalled();
    rnd.mockRestore();
    expect(faces).toEqual([4, 4, 4, 4]);
  });

  it('clamps omit to the pool size and ignores negatives', () => {
    expect(normalizeOmitCount(9, 4)).toBe(4);
    expect(normalizeOmitCount(-3, 4)).toBe(0);
    expect(damageFromSharedDice(FACES, 99).total).toBe(0);
    expect(damageFromSharedDice(FACES, -1).total).toBe(20);
  });

  it('Maximization: artificial 8s are not natural 8s but still add 8 each', () => {
    const t = damageFromSharedDice([8, 8, 8], 1, { artificial: true });
    expect(t.total).toBe(16);
    expect(t.natural8s).toBe(0);
  });

  it('die floors (Brutal Impact / Mark) are given back for omitted dice', () => {
    // floor 4: faces count as 4,8,4,7 = 23 in the full total.
    const t = damageFromSharedDice([3, 8, 2, 7], 2, { dieFloor: 4 });
    expect(t.omittedTotal).toBe(12); // 4 + 8
    expect(t.total).toBe(11); // 4 + 7
  });
});

describe('Autofire shared payload — per hit', () => {
  const full = toSharedAoeDamagePayload({
    totalDamage: 25, // 20 dice + 5 flat (Might etc.)
    count8s: 1,
    specialsUsed: ['Burn(2)'],
    rollDetails: ['Base weapon: 4d8 [3, 8, 2, 7] → 20'],
    sharedDice: { orderedDieFaces: FACES, artificial: false, dieFloor: 0 },
  })!;

  it('stores the full ordered faces on the shared payload', () => {
    expect(full.orderedDieFaces).toEqual(FACES);
    expect(full.totalDamage).toBe(25);
    expect(full.specialsUsed).toEqual(['Burn(2)']);
  });

  it('derives per-hit totals from the one roll; flat bonus stays, omitted dice leave', () => {
    const hits = [0, 1, 2].map((o) => sharedDamageForHit(full, o));
    expect(hits.map((h) => h.totalDamage)).toEqual([25, 22, 14]);
    expect(hits.map((h) => h.count8s)).toEqual([1, 1, 0]);
    expect(hits.map((h) => h.omitCount)).toEqual([0, 1, 2]);
    expect(hits.every((h) => h.orderedDieFaces === full.orderedDieFaces || h.orderedDieFaces?.join() === FACES.join())).toBe(true);
    expect(hits[1]!.rollDetails?.[0]).toMatch(/first 1 of 4 shared dice omitted/);
    // The shared source payload is never mutated.
    expect(full.totalDamage).toBe(25);
    expect(full.count8s).toBe(1);
  });

  it('a payload without ordered faces is unchanged (Instant AoE style)', () => {
    const aoe = toSharedAoeDamagePayload({ totalDamage: 17, count8s: 1 })!;
    expect(aoe.orderedDieFaces).toBeUndefined();
    const hit = sharedDamageForHit(aoe, 3);
    expect(hit.totalDamage).toBe(17);
    expect(hit.count8s).toBe(1);
  });
});

describe('Autofire — powerUseId and shared Raise allocation key', () => {
  it('two powerUseIds give independent raise keys', () => {
    const base = { autofire: true, attackerId: 'a1', attackTotal: 20, declaredRaiseSlots: 1 };
    const k1 = raiseAllocShareKey({ ...base, powerUseId: 'use-A' });
    const k2 = raiseAllocShareKey({ ...base, powerUseId: 'use-B' });
    expect(k1).toBe('autofire:use-A');
    expect(k2).toBe('autofire:use-B');
    expect(k1).not.toBe(k2);
    rememberSharedRaiseAllocation(k1, PLAN);
    expect(peekSharedRaiseAllocation(k1)).not.toBeNull();
    expect(peekSharedRaiseAllocation(k2)).toBeNull();
  });

  it('the same powerUseId yields the same key for every slot (raiseTn differs per slot)', () => {
    const keys = [10, 14, 18, 22].map((raiseTn) =>
      raiseAllocShareKey({
        autofire: true,
        powerUseId: 'use-A',
        attackerId: 'a1',
        attackTotal: 25,
        raiseTn,
        autofireSlot: raiseTn,
      }),
    );
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toBe(autofireRaiseShareKey('use-A'));
  });

  it('autofireUseId is accepted as an alias; fresh ids are unique', () => {
    expect(readAutofirePowerUseId({ autofireUseId: 'x' })).toBe('x');
    expect(readAutofirePowerUseId({ powerUseId: 'y', autofireUseId: 'x' })).toBe('y');
    const ids = new Set(Array.from({ length: 50 }, () => newAutofirePowerUseId('actor1')));
    expect(ids.size).toBe(50);
  });

  it('legacy cards without an id fall back to the old attacker/total/paid key', () => {
    const key = raiseAllocShareKey({
      autofire: true,
      attackerId: 'a1',
      attackTotal: 20,
      declaredRaiseSlots: 2,
    });
    expect(key).toBe('autofire:a1:20:2');
  });
});

describe('Autofire — Negation session, cancellation cleanup', () => {
  it('collects Negation for every hit in order before any die exists; repeats are separate', async () => {
    const order: Array<[number, number]> = [];
    const declared = [2, 0, 1];
    const session = createAutofireDamageSession({
      useId: 'use-A',
      hitCount: 3,
      promptNegation: async (hitIndex, pool) => {
        order.push([hitIndex, pool]);
        return { diceRemoved: declared[hitIndex]!, note: `−${declared[hitIndex]}` };
      },
    });
    const omits = await session.collectNegation(4);
    expect(order).toEqual([[0, 4], [1, 4], [2, 4]]);
    expect(omits).toEqual([2, 0, 1]);
    // A second call (Faith reroll) must not re-prompt or re-spend.
    await session.collectNegation(4);
    expect(order).toHaveLength(3);
  });

  it('clamps over-declared Negation to the pool', async () => {
    const session = createAutofireDamageSession({
      useId: 'use-A',
      hitCount: 1,
      promptNegation: async () => ({ diceRemoved: 99 }),
    });
    expect(await session.collectNegation(3)).toEqual([3]);
  });

  it('cancel refunds every spend, forgets the Raise allocation and clears the session', async () => {
    const refund0 = vi.fn(async () => {});
    const refund2 = vi.fn(async () => {});
    const session = createAutofireDamageSession({
      useId: 'use-A',
      hitCount: 3,
      promptNegation: async (i) =>
        i === 1
          ? { diceRemoved: 0 }
          : { diceRemoved: 1, refund: i === 0 ? refund0 : refund2 },
    });
    registerAutofireSession(session);
    const key = autofireRaiseShareKey('use-A');
    rememberSharedRaiseAllocation(key, PLAN);
    await session.collectNegation(4);
    expect(peekSharedRaiseAllocation(key)).not.toBeNull();

    const refunded = await endAutofireSession('use-A', { refund: true });
    expect(refunded).toBe(2);
    expect(refund0).toHaveBeenCalledTimes(1);
    expect(refund2).toHaveBeenCalledTimes(1);
    expect(peekSharedRaiseAllocation(key)).toBeNull(); // no stale key
    expect(getAutofireSession('use-A')).toBeNull();
    expect(autofireSessionCount()).toBe(0);
  });

  it('normal completion clears the Raise allocation without refunding', async () => {
    const refund = vi.fn(async () => {});
    const session = createAutofireDamageSession({
      useId: 'use-B',
      hitCount: 1,
      promptNegation: async () => ({ diceRemoved: 1, refund }),
    });
    registerAutofireSession(session);
    const key = autofireRaiseShareKey('use-B');
    rememberSharedRaiseAllocation(key, PLAN);
    await session.collectNegation(2);
    expect(await endAutofireSession('use-B')).toBe(0);
    expect(refund).not.toHaveBeenCalled();
    expect(peekSharedRaiseAllocation(key)).toBeNull();
  });

  it('ending one Power use leaves another use untouched', async () => {
    registerAutofireSession(
      createAutofireDamageSession({ useId: 'use-A', hitCount: 1, promptNegation: async () => ({ diceRemoved: 0 }) }),
    );
    registerAutofireSession(
      createAutofireDamageSession({ useId: 'use-C', hitCount: 1, promptNegation: async () => ({ diceRemoved: 0 }) }),
    );
    rememberSharedRaiseAllocation(autofireRaiseShareKey('use-A'), PLAN);
    rememberSharedRaiseAllocation(autofireRaiseShareKey('use-C'), PLAN);
    await endAutofireSession('use-A', { refund: true });
    expect(peekSharedRaiseAllocation(autofireRaiseShareKey('use-A'))).toBeNull();
    expect(peekSharedRaiseAllocation(autofireRaiseShareKey('use-C'))).not.toBeNull();
    expect(getAutofireSession('use-C')).not.toBeNull();
  });
});

describe('Autofire vs Instant AoE damage rules unchanged', () => {
  it('Instant AoE: martialWeaponDamageApplies stays false', () => {
    expect(martialWeaponDamageApplies({ aoeMeleeWeapon: true })).toBe(false);
    expect(martialWeaponDamageApplies({ instantAoe: true })).toBe(false);
    expect(isInstantAoeFlags({ instantAoe: true })).toBe(true);
  });

  it('Autofire: martialWeaponDamageApplies stays true and the use id does not make it AoE', () => {
    const flags = autofireDamageFlags({ attackType: 'ranged', powerUseId: 'use-A' });
    expect(flags.autofire).toBe(true);
    expect(isInstantAoeFlags(flags)).toBe(false);
    expect(martialWeaponDamageApplies(flags)).toBe(true);
  });
});
