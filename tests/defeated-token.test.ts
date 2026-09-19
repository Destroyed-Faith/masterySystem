import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  DEFEATED_TOKEN_ALPHA,
  isNpcFinallyDefeated,
  isPlayerCharacterActor,
  tokenHasDownedFlag,
  tokenIsExcludedAsTarget,
  writeDefeatedPresentation,
} from '../src/combat/defeated-token.js';

function health(current: number, max = 30) {
  return {
    bars: [{ name: 'Healthy', max, current, penalty: 0 }],
    currentBar: 0,
    tempHP: 0,
  };
}

function npc(overrides: Record<string, unknown> = {}) {
  return {
    type: 'npc',
    name: 'Dog',
    system: {
      health: health(0),
      phases: [],
      npcActivePhaseIndex: 0,
      ...(overrides.system as object | undefined),
    },
    ...overrides,
  };
}

function mockToken(opts: {
  id?: string;
  actor?: any;
  downed?: boolean;
  defeatedCombatant?: boolean;
  alpha?: number;
}) {
  const flags: Record<string, Record<string, unknown>> = {
    'mastery-system': opts.downed ? { downed: true } : {},
  };
  const doc: any = {
    id: opts.id ?? 'tok-1',
    documentName: 'Token',
    alpha: opts.alpha ?? 1,
    flags,
    actor: opts.actor,
    getFlag(ns: string, key: string) {
      return flags[ns]?.[key];
    },
    setFlag: async (ns: string, key: string, value: unknown) => {
      flags[ns] = flags[ns] || {};
      flags[ns][key] = value;
    },
    unsetFlag: async (ns: string, key: string) => {
      if (flags[ns]) delete flags[ns][key];
    },
    update: vi.fn(async (patch: Record<string, unknown>) => {
      if (patch.alpha != null) doc.alpha = patch.alpha;
    }),
  };
  return {
    id: doc.id,
    document: doc,
    actor: opts.actor,
    alpha: opts.alpha ?? 1,
  };
}

describe('isNpcFinallyDefeated', () => {
  it('is true for a single-phase NPC at 0 HP', () => {
    expect(isNpcFinallyDefeated(npc())).toBe(true);
    expect(isNpcFinallyDefeated(npc({ system: { health: health(4) } }))).toBe(false);
  });

  it('is false for a boss that still has a later phase', () => {
    const boss = npc({
      system: {
        health: health(0),
        npcActivePhaseIndex: 0,
        phases: [
          { name: 'One', health: health(0) },
          { name: 'Two', health: health(40, 40) },
        ],
      },
    });
    expect(isNpcFinallyDefeated(boss)).toBe(false);
  });

  it('is true on the last boss phase at 0 HP', () => {
    const boss = npc({
      system: {
        health: health(0),
        npcActivePhaseIndex: 1,
        phases: [
          { name: 'One', health: health(0) },
          { name: 'Two', health: health(0) },
        ],
      },
    });
    expect(isNpcFinallyDefeated(boss)).toBe(true);
  });

  it('ignores player characters and NPCs without bars', () => {
    expect(isPlayerCharacterActor({ type: 'character' })).toBe(true);
    expect(isNpcFinallyDefeated({ type: 'character', system: { health: health(0) } })).toBe(false);
    expect(isNpcFinallyDefeated({ type: 'npc', system: { health: { bars: [] } } })).toBe(false);
  });
});

describe('tokenIsExcludedAsTarget', () => {
  const prevGame = (globalThis as any).game;

  beforeEach(() => {
    (globalThis as any).game = { combat: { combatants: [] } };
  });

  afterEach(() => {
    (globalThis as any).game = prevGame;
  });

  it('keeps a 0 HP player character targetable', () => {
    const token = mockToken({
      actor: { type: 'character', system: { health: health(0) } },
    });
    expect(tokenIsExcludedAsTarget(token)).toBe(false);
  });

  it('excludes a 0 HP NPC even before the defeated flag is written', () => {
    const token = mockToken({ actor: npc() });
    expect(tokenIsExcludedAsTarget(token)).toBe(true);
  });

  it('excludes a living NPC once the token is marked downed', () => {
    const token = mockToken({
      actor: npc({ system: { health: health(12) } }),
      downed: true,
    });
    expect(tokenHasDownedFlag(token)).toBe(true);
    expect(tokenIsExcludedAsTarget(token)).toBe(true);
  });

  it('excludes anyone the combatant marks defeated', () => {
    const token = mockToken({
      id: 'pc-tok',
      actor: { type: 'character', system: { health: health(0) } },
    });
    (globalThis as any).game = {
      combat: { combatants: [{ tokenId: 'pc-tok', defeated: true }] },
    };
    expect(tokenIsExcludedAsTarget(token)).toBe(true);
  });

  it('still allows a boss that just emptied a mid-fight phase', () => {
    const token = mockToken({
      actor: npc({
        system: {
          health: health(0),
          npcActivePhaseIndex: 0,
          phases: [
            { name: 'One', health: health(0) },
            { name: 'Two', health: health(40, 40) },
          ],
        },
      }),
    });
    expect(tokenIsExcludedAsTarget(token)).toBe(false);
  });
});

describe('writeDefeatedPresentation', () => {
  const prev = { game: (globalThis as any).game, canvas: (globalThis as any).canvas };

  afterEach(() => {
    (globalThis as any).game = prev.game;
    (globalThis as any).canvas = prev.canvas;
  });

  it('ghosts the token and marks the combatant defeated', async () => {
    const actor = npc({ system: { health: health(0) } });
    const token = mockToken({ id: 'dog-tok', actor });
    const combatant = {
      tokenId: 'dog-tok',
      defeated: false,
      update: vi.fn(async (patch: Record<string, unknown>) => {
        combatant.defeated = !!patch.defeated;
      }),
    };
    (globalThis as any).game = {
      combat: { combatants: [combatant] },
      scenes: { viewed: { tokens: { get: () => token.document } }, active: { tokens: { get: () => token.document } } },
    };
    (globalThis as any).canvas = {
      scene: { tokens: { get: (id: string) => (id === 'dog-tok' ? token.document : null) } },
      tokens: { get: (id: string) => (id === 'dog-tok' ? token : null) },
    };

    await writeDefeatedPresentation({ actor, tokenId: 'dog-tok', defeated: true });

    expect(token.document.alpha).toBe(DEFEATED_TOKEN_ALPHA);
    expect(token.document.getFlag('mastery-system', 'downed')).toBe(true);
    expect(combatant.update).toHaveBeenCalledWith({ defeated: true });
  });

  it('restores alpha when the corpse is stood back up', async () => {
    const actor = npc({ system: { health: health(10) } });
    const token = mockToken({ id: 'dog-tok', actor, downed: true, alpha: DEFEATED_TOKEN_ALPHA });
    token.document.flags['mastery-system'].preDownedAlpha = 1;
    const combatant = {
      tokenId: 'dog-tok',
      defeated: true,
      update: vi.fn(async (patch: Record<string, unknown>) => {
        combatant.defeated = !!patch.defeated;
      }),
    };
    (globalThis as any).game = {
      combat: { combatants: [combatant] },
      scenes: { viewed: { tokens: { get: () => token.document } }, active: { tokens: { get: () => token.document } } },
    };
    (globalThis as any).canvas = {
      scene: { tokens: { get: (id: string) => (id === 'dog-tok' ? token.document : null) } },
      tokens: { get: (id: string) => (id === 'dog-tok' ? token : null) },
    };

    await writeDefeatedPresentation({ actor, tokenId: 'dog-tok', defeated: false });

    expect(token.document.alpha).toBe(1);
    expect(token.document.getFlag('mastery-system', 'downed')).toBeUndefined();
    expect(combatant.update).toHaveBeenCalledWith({ defeated: false });
  });
});
