import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLiveSummonActor, updateSummonActorForBondBody } from '../src/stones/familiar-actor-factory';

describe('getLiveSummonActor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves only by Foundry document id, never by name', () => {
    const actor = { id: 'ActorAbc123', name: 'Wolf' };
    vi.stubGlobal('game', {
      actors: {
        get: (id: string) => (id === 'ActorAbc123' ? actor : null),
      },
    });
    expect(getLiveSummonActor('ActorAbc123')).toBe(actor);
    expect(getLiveSummonActor('Wolf')).toBeNull();
    expect(getLiveSummonActor('')).toBeNull();
    expect(getLiveSummonActor(undefined)).toBeNull();
    expect(getLiveSummonActor(null)).toBeNull();
  });

  it('returns null when the stored id is stale', () => {
    vi.stubGlobal('game', {
      actors: { get: () => null },
    });
    expect(getLiveSummonActor('deleted-id')).toBeNull();
  });
});

describe('updateSummonActorForBondBody', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refuses to create when the stored id is missing', async () => {
    vi.stubGlobal('game', { actors: { get: () => null } });
    vi.stubGlobal('ui', { notifications: { warn: vi.fn(), error: vi.fn() } });
    const result = await updateSummonActorForBondBody(
      { name: 'Wolf' } as any,
      { summonActorId: 'gone' } as any,
      {},
    );
    expect(result).toBeNull();
    expect((ui as any).notifications.warn).toHaveBeenCalled();
  });
});
