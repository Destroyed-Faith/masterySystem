import { describe, expect, it } from 'vitest';
import {
  canCurrentUserUpdateDocument,
  findConnectedPlayerOwners,
  setSimulatePlayerEncounter,
  shouldShowEncounterDialogLocally,
} from '../src/combat/combat-permissions.js';

function mockActor(owners: string[]): Actor {
  return {
    id: 'actor1',
    isOwner: owners.includes('me'),
    testUserPermission: (user: { id: string }, perm: string) =>
      perm === 'OWNER' && owners.includes(user.id),
  } as unknown as Actor;
}

describe('combat encounter ownership', () => {
  it('lets a connected player owner take the dialog instead of the GM', () => {
    setSimulatePlayerEncounter(null);
    (globalThis as any).game = {
      user: { id: 'gm', isGM: true },
      users: {
        contents: [
          { id: 'gm', isGM: true, active: true },
          { id: 'fynn', isGM: false, active: true },
        ],
      },
    };
    const actor = mockActor(['fynn']);
    expect(findConnectedPlayerOwners(actor).map((u) => u.id)).toEqual(['fynn']);
    expect(shouldShowEncounterDialogLocally(actor)).toBe(false);

    (globalThis as any).game.user = { id: 'fynn', isGM: false };
    expect(shouldShowEncounterDialogLocally(actor)).toBe(true);
  });

  it('falls back to the GM when no player owner is online', () => {
    (globalThis as any).game = {
      user: { id: 'gm', isGM: true },
      users: {
        contents: [
          { id: 'gm', isGM: true, active: true },
          { id: 'fynn', isGM: false, active: false },
        ],
      },
    };
    const actor = mockActor(['fynn']);
    expect(shouldShowEncounterDialogLocally(actor)).toBe(true);
  });

  it('blocks player updates on documents they do not own', () => {
    (globalThis as any).game = { user: { id: 'fynn', isGM: false } };
    const npc = {
      canUserModify: (user: { id: string }) => user.id === 'gm',
    };
    expect(canCurrentUserUpdateDocument(npc)).toBe(false);

    (globalThis as any).game.user = { id: 'gm', isGM: true };
    expect(canCurrentUserUpdateDocument(npc)).toBe(true);
  });
});
