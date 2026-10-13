import { afterEach, describe, expect, it } from 'vitest';
import { diveForCoverDeciderUserId } from '../src/combat/aoe-melee-resolution.js';

const g = globalThis as any;
const prevGame = g.game;

function setGame(user: any, users: any[]) {
  g.game = { user, users: Object.assign(users, { activeGM: users.find((u) => u.isGM && u.active) ?? null }) };
}

afterEach(() => {
  g.game = prevGame;
});

describe('Dive for Cover — who decides', () => {
  const gm = { id: 'gm', isGM: true, active: true };
  const alice = { id: 'alice', isGM: false, active: true };
  const bob = { id: 'bob', isGM: false, active: true };

  it('GM always decides locally', () => {
    setGame(gm, [gm, alice]);
    const npc = { type: 'npc', isOwner: true };
    expect(diveForCoverDeciderUserId(npc)).toEqual({ local: true, userId: 'gm' });
  });

  it('a player resolving an AoE against an NPC is never asked — the GM is', () => {
    setGame(alice, [gm, alice]);
    const npc = { type: 'npc', isOwner: false, testUserPermission: () => false };
    expect(diveForCoverDeciderUserId(npc)).toEqual({ local: false, userId: 'gm' });
    // Even when the player technically owns the NPC document.
    const ownedNpc = { type: 'npc', isOwner: true, testUserPermission: () => true };
    expect(diveForCoverDeciderUserId(ownedNpc)).toEqual({ local: false, userId: 'gm' });
  });

  it('a player decides for their own PC locally', () => {
    setGame(alice, [gm, alice]);
    const pc = { type: 'character', isOwner: true, testUserPermission: (u: any) => u.id === 'alice' };
    expect(diveForCoverDeciderUserId(pc)).toEqual({ local: true, userId: 'alice' });
  });

  it("another player's PC goes to that connected owner, else to the GM", () => {
    setGame(alice, [gm, alice, bob]);
    const bobsPc = { type: 'character', isOwner: false, testUserPermission: (u: any) => u.id === 'bob' };
    expect(diveForCoverDeciderUserId(bobsPc)).toEqual({ local: false, userId: 'bob' });
    setGame(alice, [gm, alice, { ...bob, active: false }]);
    expect(diveForCoverDeciderUserId(bobsPc)).toEqual({ local: false, userId: 'gm' });
  });

  it('nobody online who may decide → no dive (empty user id)', () => {
    setGame(alice, [alice]);
    const npc = { type: 'npc', isOwner: false, testUserPermission: () => false };
    expect(diveForCoverDeciderUserId(npc)).toEqual({ local: false, userId: '' });
  });
});
