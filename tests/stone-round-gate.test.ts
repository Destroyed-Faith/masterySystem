import { describe, expect, it } from 'vitest';
import {
  arePlayerStonesReadyForRound,
  assignPendingStonesAsGm,
  pendingStonePlayerNames,
  warnIfPlayerStonesPending,
} from '../src/combat/stone-round-gate.js';

function mockActor(id: string, owners: string[], type = 'character', name = id): Actor {
  return {
    id,
    name,
    type,
    isOwner: owners.includes('me'),
    testUserPermission: (user: { id: string }, perm: string) =>
      perm === 'OWNER' && owners.includes(user.id),
  } as unknown as Actor;
}

function mockCombatant(opts: {
  id: string;
  actorId: string;
  owners: string[];
  type?: string;
  name?: string;
  stonesDoneRound?: number;
}): Combatant {
  return {
    id: opts.id,
    name: opts.name,
    actor: mockActor(opts.actorId, opts.owners, opts.type, opts.name ?? opts.actorId),
    getFlag: (_scope: string, key: string) =>
      key === 'encounterSetupStep' && opts.stonesDoneRound != null
        ? { combatId: 'cmb', stonesDoneRound: opts.stonesDoneRound }
        : null,
  } as unknown as Combatant;
}

function mockCombat(combatants: Combatant[], round = 2, stonesDone: Record<string, number> = {}): Combat {
  const list = combatants;
  return {
    id: 'cmb',
    started: true,
    round,
    combatants: {
      [Symbol.iterator]: () => list[Symbol.iterator](),
      get: (id: string) => list.find((c) => c.id === id),
    },
    flags: {
      'mastery-system': {
        stonePowersState: { stonesDone, roundStonesPrompted: {}, initiativePhaseDoneByRound: {} },
      },
    },
  } as unknown as Combat;
}

function setGame(opts: { userId: string; isGM: boolean; extraUsers?: Array<{ id: string; isGM: boolean; active: boolean }> }): void {
  const self = { id: opts.userId, isGM: opts.isGM, active: true };
  (globalThis as any).game = {
    user: { id: opts.userId, isGM: opts.isGM },
    users: { contents: [self, ...(opts.extraUsers ?? [])] },
    combat: null,
  };
  (globalThis as any).ui = { notifications: { warn: () => undefined } };
}

describe('arePlayerStonesReadyForRound', () => {
  it('waits until every PC confirmed stones for the new round', () => {
    setGame({ userId: 'fynn', isGM: false, extraUsers: [{ id: 'robin', isGM: false, active: true }] });
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], name: 'Fynn' });
    const robin = mockCombatant({ id: 'c2', actorId: 'a2', owners: ['robin'], name: 'Robin' });
    expect(arePlayerStonesReadyForRound(mockCombat([fynn, robin], 2), 2)).toBe(false);

    const fynnDone = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], name: 'Fynn', stonesDoneRound: 2 });
    expect(arePlayerStonesReadyForRound(mockCombat([fynnDone, robin], 2), 2)).toBe(false);

    const robinDone = mockCombatant({ id: 'c2', actorId: 'a2', owners: ['robin'], name: 'Robin', stonesDoneRound: 2 });
    expect(arePlayerStonesReadyForRound(mockCombat([fynnDone, robinDone], 2), 2)).toBe(true);
  });

  it('still waits on PCs when the current user is the GM', () => {
    setGame({
      userId: 'gm',
      isGM: true,
      extraUsers: [{ id: 'fynn', isGM: false, active: true }],
    });
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], name: 'Fynn' });
    const npc = mockCombatant({ id: 'c3', actorId: 'n1', owners: ['gm'], type: 'npc', name: 'Goblin' });
    const combat = mockCombat([fynn, npc], 2);
    expect(arePlayerStonesReadyForRound(combat, 2)).toBe(false);
    expect(pendingStonePlayerNames(combat, 2)).toEqual(['Fynn']);
    expect(warnIfPlayerStonesPending(combat)).toBe(true);
  });

  it('does not wait on NPCs', () => {
    setGame({ userId: 'gm', isGM: true });
    const npc = mockCombatant({ id: 'c3', actorId: 'n1', owners: ['gm'], type: 'npc', name: 'Goblin' });
    expect(arePlayerStonesReadyForRound(mockCombat([npc], 2), 2)).toBe(true);
  });

  it('treats last-round confirms as not ready for the new round', () => {
    setGame({ userId: 'fynn', isGM: false });
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], name: 'Fynn', stonesDoneRound: 1 });
    expect(arePlayerStonesReadyForRound(mockCombat([fynn], 2), 2)).toBe(false);
    expect(arePlayerStonesReadyForRound(mockCombat([fynn], 1), 1)).toBe(true);
  });

  it('does not let a player assign stones for others', async () => {
    setGame({ userId: 'fynn', isGM: false });
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], name: 'Fynn' });
    expect(await assignPendingStonesAsGm(mockCombat([fynn], 2))).toBe(0);
  });

  it('blocks the GM even if the player owner is offline', () => {
    setGame({
      userId: 'gm',
      isGM: true,
      extraUsers: [{ id: 'fynn', isGM: false, active: false }],
    });
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], name: 'Fynn' });
    expect(arePlayerStonesReadyForRound(mockCombat([fynn], 2), 2)).toBe(false);
    expect(pendingStonePlayerNames(mockCombat([fynn], 2), 2)).toEqual(['Fynn']);
  });
});
