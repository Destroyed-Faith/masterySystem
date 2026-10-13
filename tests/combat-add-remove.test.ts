import { describe, expect, it } from 'vitest';
import { listTokensNotInCombat } from '../src/combat/start-encounter';

describe('listTokensNotInCombat', () => {
  it('filters out token ids already in the combat tracker', () => {
    const g = globalThis as any;
    const prevGame = g.game;
    const prevCanvas = g.canvas;
    g.game = {
      user: { isGM: true },
      scenes: { active: null },
      actors: {
        get: (id: string) =>
          id === 'a1'
            ? { id: 'a1', type: 'character', name: 'Hero', img: 'h.png' }
            : id === 'a2'
              ? { id: 'a2', type: 'npc', name: 'Goblin', img: 'g.png' }
              : null,
      },
    };
    g.canvas = {
      scene: {
        id: 's1',
        tokens: {
          contents: [
            { id: 't1', actorId: 'a1', name: 'Hero', texture: { src: 'h.png' }, hidden: false },
            { id: 't2', actorId: 'a2', name: 'Goblin', texture: { src: 'g.png' }, hidden: false },
          ],
        },
      },
      tokens: { placeables: [] },
    };
    try {
      const combat = {
        combatants: [{ tokenId: 't1' }, { tokenId: 't2' }],
      } as any;
      expect(listTokensNotInCombat(combat)).toEqual([]);
      expect(listTokensNotInCombat({ combatants: [{ tokenId: 't1' }] } as any).map((t) => t.tokenId)).toEqual([
        't2',
      ]);
    } finally {
      g.game = prevGame;
      g.canvas = prevCanvas;
    }
  });
});
