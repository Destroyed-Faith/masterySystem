/**
 * A3 / Closeout Fix 2: setRoundState prefers Foundry V14 `_replace` /
 * ForcedReplacement, verifies persisted flags before any local mirror, and
 * falls back to unset+set when replace is not applied.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNpcAttackUsesThisRound,
  getRoundState,
  markNpcAttackUsedThisRound,
  setRoundState,
  type RoundState,
} from '../src/combat/action-economy.js';

const REPLACE_MARK = '__forcedReplace';

/** Minimal Foundry-like update applicator for `==` / `_replace` / `-=` / `_del`. */
function applyUpdate(flags: Record<string, any>, update: Record<string, unknown>): void {
  for (const [rawKey, value] of Object.entries(update)) {
    const parts = rawKey.split('.');
    if (parts[0] !== 'flags' || parts[1] !== 'mastery-system') continue;
    const leaf = parts[2] || '';
    if (!flags['mastery-system']) flags['mastery-system'] = {};

    if (leaf.startsWith('==')) {
      flags['mastery-system'][leaf.slice(2)] = value;
      continue;
    }
    if (leaf.startsWith('-=')) {
      delete flags['mastery-system'][leaf.slice(2)];
      continue;
    }
    if (leaf === 'roundState') {
      const v = value as any;
      if (v && typeof v === 'object' && v[REPLACE_MARK] === true) {
        flags['mastery-system'].roundState = v.value;
      } else if (v && typeof v === 'object' && v.__$OPERATOR$__ === 'ForcedDeletion') {
        delete flags['mastery-system'].roundState;
      } else if (v == null) {
        delete flags['mastery-system'].roundState;
      } else {
        flags['mastery-system'].roundState = value;
      }
    }
  }
}

function installV14ReplaceGlobals() {
  (globalThis as any)._replace = (value: unknown) => ({
    [REPLACE_MARK]: true,
    value: JSON.parse(JSON.stringify(value)),
  });
  (globalThis as any)._del = { __$OPERATOR$__: 'ForcedDeletion' };
}

function clearV14ReplaceGlobals() {
  delete (globalThis as any)._replace;
  delete (globalThis as any)._del;
}

function createActorWithUpdate(opts?: { isToken?: boolean; mergeInsteadOfReplace?: boolean }) {
  const flags: Record<string, any> = { 'mastery-system': {} };
  let updateCalls = 0;
  let setFlagCalls = 0;
  let unsetFlagCalls = 0;
  let lastUpdate: Record<string, unknown> | null = null;

  const actor = {
    id: opts?.isToken ? 'token-actor-1' : 'a1',
    type: 'npc',
    isToken: !!opts?.isToken,
    system: {
      npcBaseAttack: { name: 'Slash', attackDiceCount: 6, damageDiceCount: 4, npcAttacksPerRound: 1 },
      attackValues: [],
      attributes: {},
    },
    flags,
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      setFlagCalls += 1;
      if (!flags[scope]) flags[scope] = {};
      // Merge semantics (Foundry setFlag) — proves why replace is required.
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flags[scope][key] = { ...(flags[scope][key] || {}), ...(value as object) };
      } else {
        flags[scope][key] = value;
      }
    },
    async unsetFlag(scope: string, key: string) {
      unsetFlagCalls += 1;
      if (flags[scope]) delete flags[scope][key];
    },
    async update(update: Record<string, unknown>) {
      updateCalls += 1;
      lastUpdate = update;
      if (opts?.mergeInsteadOfReplace) {
        const raw =
          update['flags.mastery-system.roundState'] ?? update['flags.mastery-system.==roundState'];
        let payload = raw as any;
        if (payload && payload[REPLACE_MARK]) payload = payload.value;
        if (payload && typeof payload === 'object') {
          flags['mastery-system'] = flags['mastery-system'] || {};
          flags['mastery-system'].roundState = {
            ...(flags['mastery-system'].roundState || {}),
            ...payload,
            // Nested maps merge (the bug replace must prevent)
            npcAttackUsesThisRound: {
              ...(flags['mastery-system'].roundState?.npcAttackUsesThisRound || {}),
              ...(payload.npcAttackUsesThisRound || {}),
            },
          };
        }
        return;
      }
      applyUpdate(flags, update);
    },
    getStats: () => ({ updateCalls, setFlagCalls, unsetFlagCalls, lastUpdate }),
  };
  return actor;
}

function emptyRound(partial: Partial<RoundState> = {}): RoundState {
  return {
    combatId: 'c1',
    round: 1,
    turn: 0,
    isPC: false,
    movementActions: { total: 1, used: 0 },
    attackActions: { total: 1, used: 0 },
    reactionActions: { total: 1, used: 0 },
    moveBonusMeters: 0,
    npcAttackUsesThisRound: {},
    usedPowerIdsThisRound: [],
    ...partial,
  };
}

describe('A3 setRoundState single-write replace (Foundry V14)', () => {
  beforeEach(() => {
    (globalThis as any).game = { actors: { get: () => null } };
    (globalThis as any).Hooks = { callAll: vi.fn() };
    clearV14ReplaceGlobals();
  });

  it('uses a single _replace write when globalThis._replace exists', async () => {
    installV14ReplaceGlobals();
    const actor = createActorWithUpdate();
    await setRoundState(
      actor as any,
      emptyRound({
        npcAttackUsesThisRound: { 'npc-attack-root-0': 1 },
        reactionActions: { total: 2, used: 1 },
      }),
    );
    const stats = actor.getStats();
    expect(stats.updateCalls).toBe(1);
    expect(stats.unsetFlagCalls).toBe(0);
    expect(stats.setFlagCalls).toBe(0);
    expect(stats.lastUpdate).toHaveProperty('flags.mastery-system.roundState');
    expect((stats.lastUpdate as any)['flags.mastery-system.roundState'][REPLACE_MARK]).toBe(true);
    expect(actor.getFlag('mastery-system', 'roundState')?.npcAttackUsesThisRound).toEqual({
      'npc-attack-root-0': 1,
    });
    expect(actor.getFlag('mastery-system', 'roundState')?.reactionActions).toEqual({
      total: 2,
      used: 1,
    });
  });

  it('falls back to legacy ==roundState key when _replace is unavailable', async () => {
    const actor = createActorWithUpdate();
    await setRoundState(actor as any, emptyRound({ reactionActions: { total: 1, used: 1 } }));
    const stats = actor.getStats();
    expect(stats.updateCalls).toBe(1);
    expect(stats.setFlagCalls).toBe(0);
    expect(stats.lastUpdate).toHaveProperty('flags.mastery-system.==roundState');
    expect(actor.getFlag('mastery-system', 'roundState')?.reactionActions?.used).toBe(1);
  });

  it('does not treat an optimistic local mirror as persistence proof', async () => {
    installV14ReplaceGlobals();
    const actor = createActorWithUpdate({ mergeInsteadOfReplace: true });
    // Seed obsolete nested key
    await actor.setFlag('mastery-system', 'roundState', emptyRound({
      npcAttackUsesThisRound: { stale: 1 },
    }));
    const setBefore = actor.getStats().setFlagCalls;

    await setRoundState(
      actor as any,
      emptyRound({
        round: 2,
        npcAttackUsesThisRound: {},
      }),
    );
    const stats = actor.getStats();
    // Merge update cannot clear stale key → verification fails → unset+set fallback
    expect(stats.unsetFlagCalls).toBeGreaterThanOrEqual(1);
    expect(stats.setFlagCalls).toBeGreaterThan(setBefore);
    expect(actor.getFlag('mastery-system', 'roundState')?.npcAttackUsesThisRound).toEqual({});
  });

  it('replaces obsolete nested npcAttackUsesThisRound keys on world actors', async () => {
    installV14ReplaceGlobals();
    const actor = createActorWithUpdate();
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await markNpcAttackUsedThisRound(actor as any, combat, 'npc-attack-root-0');
    expect(getNpcAttackUsesThisRound(actor as any, combat, 'npc-attack-root-0')).toBe(1);

    await setRoundState(
      actor as any,
      emptyRound({
        round: 2,
        npcAttackUsesThisRound: {},
      }),
    );
    expect(getNpcAttackUsesThisRound(actor as any, { id: 'c1', round: 2 } as any, 'npc-attack-root-0')).toBe(
      0,
    );
    const rs = getRoundState(actor as any, { id: 'c1', round: 2 } as any);
    expect(rs?.npcAttackUsesThisRound).toEqual({});
  });

  it('replaces obsolete nested keys on unlinked token actors (ActorDelta)', async () => {
    installV14ReplaceGlobals();
    const actor = createActorWithUpdate({ isToken: true });
    await setRoundState(
      actor as any,
      emptyRound({
        npcAttackUsesThisRound: { 'npc-attack-root-0': 1 },
        reactionActions: { total: 1, used: 1 },
      }),
    );
    await setRoundState(
      actor as any,
      emptyRound({
        round: 2,
        npcAttackUsesThisRound: {},
        reactionActions: { total: 1, used: 0 },
      }),
    );
    expect(actor.isToken).toBe(true);
    expect(actor.getFlag('mastery-system', 'roundState')?.npcAttackUsesThisRound).toEqual({});
    expect(actor.getFlag('mastery-system', 'roundState')?.reactionActions?.used).toBe(0);
    expect(actor.getStats().updateCalls).toBe(2);
    expect(actor.getStats().setFlagCalls).toBe(0);
  });

  it('falls back to unset+set when update throws', async () => {
    installV14ReplaceGlobals();
    const actor = createActorWithUpdate();
    actor.update = async () => {
      throw new Error('no replace support');
    };
    await setRoundState(actor as any, emptyRound({ reactionActions: { total: 1, used: 1 } }));
    const stats = actor.getStats();
    expect(stats.setFlagCalls).toBeGreaterThanOrEqual(1);
    expect(actor.getFlag('mastery-system', 'roundState')?.reactionActions?.used).toBe(1);
  });

  it('repeated updates replace rather than accumulate usedPowerIds', async () => {
    installV14ReplaceGlobals();
    const actor = createActorWithUpdate();
    await setRoundState(actor as any, emptyRound({ usedPowerIdsThisRound: ['p1', 'p2'] }));
    await setRoundState(actor as any, emptyRound({ usedPowerIdsThisRound: ['p3'] }));
    expect(actor.getFlag('mastery-system', 'roundState')?.usedPowerIdsThisRound).toEqual(['p3']);
    expect(actor.getStats().updateCalls).toBe(2);
    expect(actor.getStats().setFlagCalls).toBe(0);
  });
});
