import { beforeEach, describe, expect, it } from 'vitest';
import { runCombatEndCleanup } from '../src/combat/combat-end-cleanup.js';

interface MockActor {
  id: string;
  type: string;
  system: any;
  flags: Record<string, Record<string, unknown>>;
  effects: any[];
  deleted: string[];
  getFlag: (scope: string, key: string) => unknown;
  setFlag: (scope: string, key: string, value: unknown) => Promise<void>;
  unsetFlag: (scope: string, key: string) => Promise<void>;
  update: (patch: Record<string, unknown>) => Promise<void>;
  deleteEmbeddedDocuments: (type: string, ids: string[]) => Promise<void>;
}

function mockActor(id: string, type: string, options: { tempHP?: number; specials?: any[]; buff?: boolean } = {}): MockActor {
  const own: Record<string, unknown> = { tempColorlessStones: 3 };
  const actor: MockActor = {
    id,
    type,
    system: {
      health: { tempHP: options.tempHP ?? 0 },
      statusEffects: options.specials ?? [],
    },
    flags: { 'mastery-system': own },
    effects: options.buff
      ? [{ id: `eff-${id}`, flags: { 'mastery-system': { activeBuff: true } } }]
      : [],
    deleted: [],
    getFlag: (_scope: string, key: string) => own[key],
    setFlag: async (_scope: string, key: string, value: unknown) => {
      own[key] = value;
    },
    unsetFlag: async (_scope: string, key: string) => {
      delete own[key];
    },
    update: async (patch: Record<string, unknown>) => {
      if ('system.health.tempHP' in patch) {
        actor.system.health.tempHP = patch['system.health.tempHP'];
      }
      if ('system.statusEffects' in patch) {
        actor.system.statusEffects = patch['system.statusEffects'];
      }
    },
    deleteEmbeddedDocuments: async (_type: string, ids: string[]) => {
      actor.deleted.push(...ids);
      actor.effects = actor.effects.filter((e) => !ids.includes(e.id));
    },
  };
  return actor;
}

function setupCombat(actors: MockActor[]) {
  const combat = {
    id: 'cmb1',
    round: 3,
    combatants: actors.map((actor) => ({ id: `c-${actor.id}`, actor })),
  };
  (globalThis as any).game = { combat, actors: { get: () => undefined }, user: { isGM: true } };
  (globalThis as any).canvas = {};
  (globalThis as any).Hooks = { callAll: () => {} };
  return combat;
}

describe('combat end cleanup', () => {
  beforeEach(() => {
    delete (globalThis as any).game;
    delete (globalThis as any).canvas;
  });

  it('clears Temp HP and Colorless Stones for everyone', async () => {
    const pc = mockActor('pc', 'character', { tempHP: 12 });
    const npc = mockActor('npc', 'npc', { tempHP: 7 });
    const combat = setupCombat([pc, npc]);

    await runCombatEndCleanup(combat);

    expect(pc.system.health.tempHP).toBe(0);
    expect(npc.system.health.tempHP).toBe(0);
    expect(pc.getFlag('mastery-system', 'tempColorlessStones')).toBeUndefined();
    expect(npc.getFlag('mastery-system', 'tempColorlessStones')).toBeUndefined();
  });

  it('keeps ongoing Specials on players and wipes them on NPCs', async () => {
    const pc = mockActor('pc', 'character', {
      specials: [{ id: 'ruin', value: 4 }],
      buff: true,
    });
    const npc = mockActor('npc', 'npc', {
      specials: [{ id: 'ruin', value: 4 }],
      buff: true,
    });
    const combat = setupCombat([pc, npc]);

    await runCombatEndCleanup(combat);

    expect(pc.system.statusEffects).toEqual([{ id: 'ruin', value: 4 }]);
    expect(pc.deleted).toEqual([]);
    expect(npc.system.statusEffects).toEqual([]);
    expect(npc.deleted).toEqual(['eff-npc']);
  });
});
