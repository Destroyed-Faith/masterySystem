import { describe, expect, it } from 'vitest';
import { listSceneEncounterTokens } from '../src/combat/start-encounter.js';
import { setSimulatePlayerEncounter, shouldShowEncounterDialogLocally } from '../src/combat/combat-permissions.js';

function token(opts: {
  id: string;
  name: string;
  type: string;
  hidden?: boolean;
  actorId?: string;
}): any {
  return {
    id: opts.id,
    name: opts.name,
    hidden: opts.hidden === true,
    actorId: opts.actorId ?? `a-${opts.id}`,
    actor: { id: opts.actorId ?? `a-${opts.id}`, type: opts.type, name: opts.name, img: 'x.png' },
    texture: { src: 'x.png' },
  };
}

describe('listSceneEncounterTokens', () => {
  it('lists PCs and NPCs and skips tokens without actors', () => {
    (globalThis as any).game = { user: { isGM: true } };
    const scene = {
      tokens: {
        contents: [
          token({ id: 't1', name: 'Fynn', type: 'character' }),
          token({ id: 't2', name: 'Wolf', type: 'npc' }),
          { id: 't3', name: 'Prop', actor: null },
        ],
      },
    };
    const list = listSceneEncounterTokens(scene);
    expect(list.map((t) => t.name)).toEqual(['Fynn', 'Wolf']);
    expect(list[0]?.isCharacter).toBe(true);
    expect(list[1]?.isCharacter).toBe(false);
  });

  it('hides hidden tokens from players', () => {
    (globalThis as any).game = { user: { isGM: false } };
    const scene = {
      tokens: [token({ id: 't1', name: 'Hidden', type: 'npc', hidden: true }), token({ id: 't2', name: 'Open', type: 'npc' })],
    };
    expect(listSceneEncounterTokens(scene).map((t) => t.name)).toEqual(['Open']);
  });
});

describe('simulate player encounter', () => {
  it('lets the GM see dialogs even when a player owner is online', () => {
    (globalThis as any).game = {
      user: { id: 'gm', isGM: true },
      combat: { id: 'c1' },
      users: [
        { id: 'gm', isGM: true, active: true },
        { id: 'p1', isGM: false, active: true },
      ],
    };
    const actor = {
      testUserPermission: (u: { id: string }, perm: string) => u.id === 'p1' && perm === 'OWNER',
    } as unknown as Actor;
    setSimulatePlayerEncounter(null);
    expect(shouldShowEncounterDialogLocally(actor)).toBe(false);
    setSimulatePlayerEncounter('c1');
    expect(shouldShowEncounterDialogLocally(actor)).toBe(true);
    setSimulatePlayerEncounter(null);
  });
});
