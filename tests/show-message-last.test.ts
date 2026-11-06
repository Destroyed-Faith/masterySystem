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

  it('token/world duplicate flags are one shared pool — cannot maximize twice on 1 charge', async () => {
    const { spendMaximization, remainingStoneMaximizations, remainingMaximizations } =
      await import('../src/stones/stone-combat-effects.js');

    const worldFlag = { remaining: 1, uses: 1, combatId: 'c1', used: true };
    // Stale sibling still shows 1 after a naive single-document spend.
    const tokenFlag = { remaining: 1, uses: 1, combatId: 'c1', used: true };

    const world: any = {
      id: 'base',
      uuid: 'Actor.base',
      isToken: false,
      getFlag: (_s: string, key: string) =>
        key === 'damageMaximization' ? { ...worldFlag } : undefined,
      setFlag: async (_s: string, key: string, value: any) => {
        if (key === 'damageMaximization') Object.assign(worldFlag, value);
      },
    };
    const token: any = {
      id: 'base',
      uuid: 'Scene.x.Token.y.Actor.base',
      isToken: true,
      token: { actorId: 'base' },
      getFlag: (_s: string, key: string) =>
        key === 'damageMaximization' ? { ...tokenFlag } : undefined,
      setFlag: async (_s: string, key: string, value: any) => {
        if (key === 'damageMaximization') Object.assign(tokenFlag, value);
      },
    };
    (globalThis as any).game = {
      combat: { id: 'c1', round: 1 },
      actors: { get: (id: string) => (id === 'base' ? world : null) },
      canvas: { tokens: { placeables: [] } },
    };

    expect(remainingStoneMaximizations(token)).toBe(1);
    expect(await spendMaximization(token, 'stone')).toBe(true);
    expect(worldFlag.remaining).toBe(0);
    expect(tokenFlag.remaining).toBe(0);
    expect(remainingStoneMaximizations(token)).toBe(0);
    expect(remainingMaximizations(world)).toBe(0);
    expect(await spendMaximization(world, 'stone')).toBe(false);
    expect(await spendMaximization(token, 'stone')).toBe(false);
  });

  it('after spending only one copy, a stale sibling cannot inflate remaining', async () => {
    const { remainingStoneMaximizations, spendMaximization } = await import(
      '../src/stones/stone-combat-effects.js'
    );
    const worldFlag = { remaining: 0, uses: 1, combatId: 'c1', used: true };
    const tokenFlag = { remaining: 1, uses: 1, combatId: 'c1', used: true };
    const world: any = {
      id: 'base',
      uuid: 'Actor.base',
      isToken: false,
      getFlag: (_s: string, key: string) =>
        key === 'damageMaximization' ? { ...worldFlag } : undefined,
      setFlag: async (_s: string, key: string, value: any) => {
        if (key === 'damageMaximization') Object.assign(worldFlag, value);
      },
    };
    const token: any = {
      id: 'base',
      uuid: 'Scene.x.Token.y.Actor.base',
      isToken: true,
      token: { actorId: 'base' },
      getFlag: (_s: string, key: string) =>
        key === 'damageMaximization' ? { ...tokenFlag } : undefined,
      setFlag: async (_s: string, key: string, value: any) => {
        if (key === 'damageMaximization') Object.assign(tokenFlag, value);
      },
    };
    (globalThis as any).game = {
      combat: { id: 'c1', round: 1 },
      actors: { get: (id: string) => (id === 'base' ? world : null) },
      canvas: { tokens: { placeables: [] } },
    };

    // Shared pool = min(0, 1) → already exhausted; second Roll Maximum must fail.
    expect(remainingStoneMaximizations(token)).toBe(0);
    expect(await spendMaximization(token, 'stone')).toBe(false);
  });
});
