import { describe, expect, it } from 'vitest';
import { arePlayerStonesReadyForRound, warnIfPlayerStonesPending } from '../src/combat/stone-round-gate.js';

function mockActor(id: string, owners: string[], type = 'character'): Actor {
  return {
    id,
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
  stonesDoneRound?: number;
}): Combatant {
  return {
    id: opts.id,
    actor: mockActor(opts.actorId, opts.owners, opts.type),
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

function setPlayerGame(userId = 'fynn'): void {
  const fynn = { id: 'fynn', isGM: false, active: true };
  const robin = { id: 'robin', isGM: false, active: true };
  (globalThis as any).game = {
    user: { id: userId, isGM: false },
    users: { contents: [fynn, robin] },
    combat: null,
  };
  (globalThis as any).ui = { notifications: { warn: () => undefined } };
}

describe('arePlayerStonesReadyForRound', () => {
  it('waits until every connected PC confirmed stones for the new round', () => {
    setPlayerGame('fynn');
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'] });
    const robin = mockCombatant({ id: 'c2', actorId: 'a2', owners: ['robin'] });
    const combat = mockCombat([fynn, robin], 2);
    expect(arePlayerStonesReadyForRound(combat, 2)).toBe(false);

    const fynnDone = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], stonesDoneRound: 2 });
    expect(arePlayerStonesReadyForRound(mockCombat([fynnDone, robin], 2), 2)).toBe(false);

    const robinDone = mockCombatant({ id: 'c2', actorId: 'a2', owners: ['robin'], stonesDoneRound: 2 });
    expect(arePlayerStonesReadyForRound(mockCombat([fynnDone, robinDone], 2), 2)).toBe(true);
  });

  it('does not wait on NPCs or unattended PCs', () => {
    setPlayerGame('fynn');
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], stonesDoneRound: 2 });
    const npc = mockCombatant({ id: 'c3', actorId: 'n1', owners: ['gm'], type: 'npc' });
    const ghost = mockCombatant({ id: 'c4', actorId: 'a4', owners: ['offline'] });
    expect(arePlayerStonesReadyForRound(mockCombat([fynn, npc, ghost], 2), 2)).toBe(true);
  });

  it('treats last-round confirms as not ready for the new round', () => {
    setPlayerGame('fynn');
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], stonesDoneRound: 1 });
    expect(arePlayerStonesReadyForRound(mockCombat([fynn], 2), 2)).toBe(false);
    expect(arePlayerStonesReadyForRound(mockCombat([fynn], 1), 1)).toBe(true);
  });

  it('blocks actions while stones are pending', () => {
    setPlayerGame('fynn');
    const fynn = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'] });
    expect(warnIfPlayerStonesPending(mockCombat([fynn], 2))).toBe(true);
    const done = mockCombatant({ id: 'c1', actorId: 'a1', owners: ['fynn'], stonesDoneRound: 2 });
    expect(warnIfPlayerStonesPending(mockCombat([done], 2))).toBe(false);
  });
});
