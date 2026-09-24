import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  GRAPPLED_STATUS_ID,
  applyGrapple,
  attackRequiresGrappleRelease,
  clearGrappleAfterCombat,
  endGrapple,
  grappleDamage,
  grappleRoleOf,
  grappleStatusIds,
  isInGrapple,
  planGrapplePair,
  readGrappleState,
} from '../src/combat/grapple-state.js';
import { readActorStatusEffects, hasActiveSpecial } from '../src/system/active-specials.js';

function applyDotted(target: any, patch: Record<string, unknown>) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('.');
    let obj = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]!;
      if (obj[key] == null || typeof obj[key] !== 'object') obj[key] = {};
      obj = obj[key];
    }
    const last = parts[parts.length - 1]!;
    if (last.startsWith('-=')) {
      delete obj[last.slice(2)];
    } else {
      obj[last] = v;
    }
  }
}

function mockActor(id: string, name: string) {
  const actor: any = {
    id,
    uuid: `Actor.${id}`,
    name,
    type: 'character',
    system: { statusEffects: [] as unknown[], combat: { speed: 8 }, health: { value: 30, max: 30 } },
    flags: { 'mastery-system': {} as Record<string, unknown> },
    getFlag(ns: string, key: string) {
      return actor.flags[ns]?.[key];
    },
    update: async (patch: Record<string, unknown>) => {
      applyDotted(actor, patch);
    },
  };
  return actor;
}

const g = globalThis as any;

describe('Grapple pair plan (pure)', () => {
  it('links both creatures with mirrored roles and nothing else', () => {
    const plan = planGrapplePair(
      { actorId: 'a1', tokenId: 't1', name: 'Bjorn' },
      { actorId: 'n1', tokenId: 't2', name: 'Wolf' },
      { id: 'c1', round: 2 },
    );
    expect(plan.grappler).toEqual({
      role: 'grappler',
      partnerActorId: 'n1',
      partnerTokenId: 't2',
      partnerName: 'Wolf',
      combatId: 'c1',
      round: 2,
    });
    expect(plan.held).toEqual({
      role: 'held',
      partnerActorId: 'a1',
      partnerTokenId: 't1',
      partnerName: 'Bjorn',
      combatId: 'c1',
      round: 2,
    });
    for (const side of [plan.grappler, plan.held] as any[]) {
      expect(side.damage).toBeUndefined();
      expect(side.root).toBeUndefined();
      expect(side.evade).toBeUndefined();
      expect(side.armor).toBeUndefined();
    }
  });

  it('Grapple deals zero damage and applies only the grappled status (never Root)', () => {
    expect(grappleDamage()).toBe(0);
    expect(grappleStatusIds()).toEqual([GRAPPLED_STATUS_ID]);
    expect(grappleStatusIds()).not.toContain('root');
  });

  it('reads role and partner from the actor flag', () => {
    const a = mockActor('a1', 'Bjorn');
    expect(readGrappleState(a)).toBeNull();
    expect(isInGrapple(a)).toBe(false);
    a.flags['mastery-system'].grapple = { role: 'held', partnerActorId: 'n1', partnerName: 'Wolf' };
    expect(grappleRoleOf(a)).toBe('held');
    expect(readGrappleState(a)?.partnerActorId).toBe('n1');
    a.flags['mastery-system'].grapple = { role: 'nonsense', partnerActorId: 'n1' };
    expect(readGrappleState(a)).toBeNull();
  });
});

describe('Weapon attacks while grappling', () => {
  const grappler = mockActor('a1', 'Bjorn');
  grappler.flags['mastery-system'].grapple = { role: 'grappler', partnerActorId: 'n1', partnerName: 'Wolf' };
  const held = mockActor('n1', 'Wolf');
  held.flags['mastery-system'].grapple = { role: 'held', partnerActorId: 'a1', partnerName: 'Bjorn' };
  const free = mockActor('x', 'Free');

  const basicAttack = { id: 'weapon-attack', slot: 'attack', source: 'maneuver', maneuver: { id: 'weapon-attack' } };

  it('unarmed Basic Attack keeps the Grapple', () => {
    expect(attackRequiresGrappleRelease(grappler, basicAttack, { unarmedNow: true })).toBe(false);
  });

  it('an armed Basic Attack requires releasing the Grapple first', () => {
    expect(attackRequiresGrappleRelease(grappler, basicAttack, { unarmedNow: false })).toBe(true);
  });

  it('only the grappler is gated — the held creature and free actors are not', () => {
    expect(attackRequiresGrappleRelease(held, basicAttack, { unarmedNow: false })).toBe(false);
    expect(attackRequiresGrappleRelease(free, basicAttack, { unarmedNow: false })).toBe(false);
  });

  it('weapon-based Active Powers are gated, spells and Active Buffs are not', () => {
    const martial = { id: 'p1', slot: 'attack', source: 'power', item: { system: { powerType: 'active', isSpell: false } } };
    const spell = { id: 'p2', slot: 'attack', source: 'power', item: { system: { powerType: 'active', isSpell: true } } };
    const buff = { id: 'p3', slot: 'attack', source: 'power', powerType: 'active-buff', item: { system: { powerType: 'active-buff' } } };
    expect(attackRequiresGrappleRelease(grappler, martial, { unarmedNow: true })).toBe(true);
    expect(attackRequiresGrappleRelease(grappler, spell, { unarmedNow: true })).toBe(false);
    expect(attackRequiresGrappleRelease(grappler, buff, { unarmedNow: true })).toBe(false);
    // NPC sheet attacks are the creature's own body; NPCs have no separate unarmed Basic Attack.
    const npcAttack = { id: 'npc-attack-0', slot: 'attack', source: 'npc-attack', tags: ['melee'] };
    expect(attackRequiresGrappleRelease(grappler, npcAttack, { unarmedNow: false })).toBe(false);
  });

  it('the Grapple family itself is never treated as a weapon attack', () => {
    for (const id of ['grapple', 'grapple-escape', 'grapple-release', 'parry-stance']) {
      const opt = { id, slot: 'attack', source: 'maneuver', maneuver: { id } };
      expect(attackRequiresGrappleRelease(grappler, opt, { unarmedNow: false })).toBe(false);
    }
  });
});

describe('Grapple apply / release / escape (mock world)', () => {
  let bjorn: any;
  let wolf: any;

  beforeEach(() => {
    bjorn = mockActor('a1', 'Bjorn');
    wolf = mockActor('n1', 'Wolf');
    const actors = new Map<string, any>([
      ['a1', bjorn],
      ['n1', wolf],
    ]);
    g.game = { user: { id: 'u1', isGM: true }, actors: { get: (id: string) => actors.get(id) } };
    g.canvas = undefined;
    g.fromUuid = undefined;
  });

  afterEach(() => {
    delete g.game;
    delete g.canvas;
    delete g.fromUuid;
  });

  it('a won Grapple links both creatures and puts grappled on each, nothing more', async () => {
    await applyGrapple(bjorn, wolf, { combat: { id: 'c1', round: 1 } });
    expect(grappleRoleOf(bjorn)).toBe('grappler');
    expect(grappleRoleOf(wolf)).toBe('held');
    expect(readGrappleState(bjorn)?.partnerActorId).toBe('n1');
    expect(readGrappleState(wolf)?.partnerActorId).toBe('a1');
    expect(hasActiveSpecial(bjorn, 'grappled')).toBe(true);
    expect(hasActiveSpecial(wolf, 'grappled')).toBe(true);
    for (const a of [bjorn, wolf]) {
      expect(hasActiveSpecial(a, 'root')).toBe(false);
      expect(a.system.health.value).toBe(30);
      expect(readActorStatusEffects(a)).toHaveLength(1);
    }
  });

  it('release ends the Grapple for both', async () => {
    await applyGrapple(bjorn, wolf);
    const { partner } = await endGrapple(bjorn);
    expect(partner).toBe(wolf);
    expect(readGrappleState(bjorn)).toBeNull();
    expect(readGrappleState(wolf)).toBeNull();
    expect(hasActiveSpecial(bjorn, 'grappled')).toBe(false);
    expect(hasActiveSpecial(wolf, 'grappled')).toBe(false);
  });

  it('a successful escape (ending from the held side) also frees the grappler', async () => {
    await applyGrapple(bjorn, wolf);
    await endGrapple(wolf);
    expect(readGrappleState(bjorn)).toBeNull();
    expect(readGrappleState(wolf)).toBeNull();
    expect(hasActiveSpecial(bjorn, 'grappled')).toBe(false);
  });

  it('combat end clears leftover grapple links', async () => {
    await applyGrapple(bjorn, wolf);
    await clearGrappleAfterCombat([bjorn, wolf]);
    expect(readGrappleState(bjorn)).toBeNull();
    expect(readGrappleState(wolf)).toBeNull();
  });
});
