import { describe, expect, it } from 'vitest';
import { chatMessageIsNewest } from '../src/chat/show-message-last';
import { resolveMaximizationActor } from '../src/stones/stone-combat-effects';

describe('chat message order', () => {
  it('treats the highest timestamp as newest', () => {
    const rows = [
      { id: 'strike-1', timestamp: 10 },
      { id: 'strike-2', timestamp: 20 },
    ];
    expect(chatMessageIsNewest('strike-2', rows)).toBe(true);
    expect(chatMessageIsNewest('strike-1', rows)).toBe(false);
  });
});

describe('maximization actor', () => {
  it('reads charges from the world actor when the token actor has none', () => {
    const world = {
      id: 'base',
      isToken: false,
      getFlag: (_scope: string, key: string) =>
        key === 'damageMaximization'
          ? { remaining: 2, uses: 2, combatId: 'c1', used: true }
          : undefined,
    };
    const token = {
      id: 'base',
      isToken: true,
      token: { actorId: 'base' },
      getFlag: () => undefined,
    };
    (globalThis as any).game = {
      combat: { id: 'c1', round: 1 },
      actors: { get: (id: string) => (id === 'base' ? world : null) },
    };
    expect(resolveMaximizationActor(token)).toBe(world);
  });
});
