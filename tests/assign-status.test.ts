import { describe, expect, it } from 'vitest';
import {
  isAssignableStatusId,
  listAssignableStatuses,
  openStatusAddDialog,
  removeStatusById,
  setActorCatalogStatus,
  upsertStatusEntry,
} from '../src/system/assign-status.js';
import { encodeStatusFlag, readActorStatusEffects } from '../src/system/active-specials.js';
import { resolveLiveActor, tokenIdOfActor } from '../src/system/status-target.js';
import { statusIdFromHudTarget } from '../src/system/status-hud.js';

function applyDotted(target: any, patch: Record<string, unknown>) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('.');
    let obj = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]!;
      if (obj[key] == null || typeof obj[key] !== 'object') obj[key] = {};
      obj = obj[key];
    }
    obj[parts[parts.length - 1]!] = v;
  }
}

function mockActor(statusEffects: unknown[] = []) {
  const actor = {
    id: 'a1',
    name: 'Bjorn',
    system: { statusEffects: [...statusEffects] },
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

/** Unlinked scene token: ActorDelta drops actor writes; TokenDocument flags stay. */
function mockUnlinkedNpc() {
  const token = {
    id: 'tok-dog-2',
    documentName: 'Token',
    parent: { documentName: 'Scene' },
    flags: { 'mastery-system': {} as Record<string, unknown> },
    getFlag(ns: string, key: string) {
      return token.flags[ns]?.[key];
    },
    setFlag: async (ns: string, key: string, value: unknown) => {
      token.flags[ns] = token.flags[ns] || {};
      token.flags[ns][key] = value;
    },
  };
  const actor = {
    id: 'dog1',
    name: 'Dog',
    isToken: true,
    token,
    system: { statusEffects: [] as unknown[] },
    flags: { 'mastery-system': {} as Record<string, unknown> },
    getFlag(ns: string, key: string) {
      return actor.flags[ns]?.[key];
    },
    update: async () => {
      /* ActorDelta drops system + actor flags on this token */
    },
  };
  return actor;
}

describe('assign catalog status', () => {
  it('offers persistent statuses and skips instants', () => {
    const ids = listAssignableStatuses().map((c) => c.id);
    expect(ids).toContain('slow');
    expect(ids).toContain('surprise');
    expect(ids).toContain('stunned');
    expect(ids).not.toContain('knockback');
    expect(ids).not.toContain('cleanse');
    expect(isAssignableStatusId('prone')).toBe(true);
    expect(isAssignableStatusId('push')).toBe(false);
  });

  it('adds a missing status and keeps an existing rank unless a new one is given', () => {
    const added = upsertStatusEntry([], 'slow');
    expect(added).toEqual([{ id: 'slow', name: 'Slow', value: 1 }]);
    const kept = upsertStatusEntry(added, 'slow');
    expect(kept).toEqual([{ id: 'slow', name: 'Slow', value: 1 }]);
    const raised = upsertStatusEntry(kept, 'slow', 4);
    expect(raised).toEqual([{ id: 'slow', name: 'Slow', value: 4 }]);
    const surprise = upsertStatusEntry(raised, 'surprise');
    expect(surprise[1]).toEqual({ id: 'surprise', name: 'Surprise' });
  });

  it('removes a status by id', () => {
    const next = removeStatusById(
      [
        { id: 'slow', value: 2 },
        { id: 'prone' },
      ],
      'slow',
    );
    expect(next).toEqual([{ id: 'prone' }]);
  });

  it('writes the sheet list when the status was not there', async () => {
    const actor = mockActor();
    await setActorCatalogStatus(actor, 'stunned', true);
    expect(actor.system.statusEffects).toEqual([{ id: 'stunned', name: 'Stunned' }]);
    expect(actor.flags['mastery-system'].statusJson).toBe(encodeStatusFlag([{ id: 'stunned', name: 'Stunned' }]));
    await setActorCatalogStatus(actor, 'stunned', false);
    expect(actor.system.statusEffects).toEqual([]);
    expect(actor.flags['mastery-system'].statusJson).toBe(encodeStatusFlag([]));
  });

  it('reads flags when the sheet field was dropped', () => {
    const actor = mockActor();
    actor.system.statusEffects = [];
    actor.flags['mastery-system'].statusJson = encodeStatusFlag([{ id: 'slow', name: 'Slow', value: 6 }]);
    expect(readActorStatusEffects(actor)).toEqual([{ id: 'slow', name: 'Slow', value: 6 }]);
  });

  it('opens no dialog when Foundry Dialog is missing', async () => {
    await expect(openStatusAddDialog(mockActor())).resolves.toBeUndefined();
  });

  it('keeps a manual status on an unlinked NPC when ActorDelta drops actor writes', async () => {
    const actor = mockUnlinkedNpc();
    await setActorCatalogStatus(actor, 'slow', true, 6);
    expect(actor.system.statusEffects).toEqual([]);
    expect(actor.flags['mastery-system'].statusJson).toBeUndefined();
    expect(actor.token.flags['mastery-system'].statusJson).toBe(
      encodeStatusFlag([{ id: 'slow', name: 'Slow', value: 6 }]),
    );
    expect(readActorStatusEffects(actor)).toEqual([{ id: 'slow', name: 'Slow', value: 6 }]);
  });
});

describe('live token target', () => {
  it('keeps the attack-card token id instead of the first actor.id match', () => {
    const actor = { id: 'dog1', isToken: true, token: { id: 'tok-b', documentName: 'Token', parent: { documentName: 'Scene' } } };
    expect(tokenIdOfActor(actor, 'tok-from-card')).toBe('tok-from-card');
    expect(tokenIdOfActor(actor)).toBe('tok-b');
  });

  it('resolves the placed token actor, not the world prototype', () => {
    const tokenActor = { id: 'dog1', name: 'Dogs', isToken: true };
    const world = { id: 'dog1', name: 'Dogs prototype' };
    (globalThis as any).canvas = {
      scene: { tokens: { get: (id: string) => (id === 'tok-b' ? { actor: tokenActor } : null) } },
    };
    (globalThis as any).game = { actors: { get: () => world }, scenes: {}, combat: null };
    expect(resolveLiveActor('dog1', 'tok-b')).toBe(tokenActor);
    expect(resolveLiveActor('dog1')).toBe(world);
    delete (globalThis as any).canvas;
    delete (globalThis as any).game;
  });
});

describe('token HUD status target', () => {
  it('reads the status id from the palette button, not from an instant', () => {
    const button = {
      dataset: { statusId: 'slow', action: 'effect' },
      closest() {
        return this;
      },
    };
    const img = {
      dataset: {},
      closest() {
        return button;
      },
    };
    expect(statusIdFromHudTarget(img)).toBe('slow');

    const instant = {
      dataset: { statusId: 'knockback', action: 'effect' },
      closest() {
        return this;
      },
    };
    expect(statusIdFromHudTarget(instant)).toBe('');
  });
});
