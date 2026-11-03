import { describe, expect, it } from 'vitest';
import {
  clearPerceptionCombatEncounterState,
  clearPerceptionRoundUsage,
  getPerceptionCombatState,
  setPerceptionCombatState,
} from '../src/combat/perception-state.js';

/** Mimics Foundry ActorDelta: setFlag merges objects, so `{}` does not drop keys. */
function makeMergeActor(initial?: Record<string, unknown>) {
  const flags: Record<string, any> = {
    'mastery-system': initial ? { perceptionCombat: { ...initial } } : {},
  };
  return {
    flags,
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      if (!flags[scope]) flags[scope] = {};
      const prev = flags[scope][key];
      if (prev && typeof prev === 'object' && value && typeof value === 'object') {
        flags[scope][key] = { ...prev, ...(value as object) };
        // Nested maps also merge (the bug we are fixing against).
        for (const [nk, nv] of Object.entries(value as object)) {
          if (
            nv &&
            typeof nv === 'object' &&
            !Array.isArray(nv) &&
            prev[nk] &&
            typeof prev[nk] === 'object'
          ) {
            flags[scope][key][nk] = { ...prev[nk], ...nv };
          }
        }
      } else {
        flags[scope][key] = value;
      }
    },
    async unsetFlag(scope: string, key: string) {
      if (flags[scope]) delete flags[scope][key];
    },
  };
}

describe('perceptionCombat flag clear on merge-style actors', () => {
  it('clears perceptionUsedVs via setPerceptionCombatState empty map', async () => {
    const actor = makeMergeActor({
      perceptionUsedVs: { tgtA: true },
      invisibilityBonus: 2,
    });
    await setPerceptionCombatState(actor, { perceptionUsedVs: {} });
    const st = getPerceptionCombatState(actor);
    expect(st.perceptionUsedVs).toBeUndefined();
    expect(st.invisibilityBonus).toBe(2);
  });

  it('clearPerceptionRoundUsage drops stale attempt ids', async () => {
    const actor = makeMergeActor({ perceptionUsedVs: { u3G8Y7YWZICdL4sV: true } });
    await clearPerceptionRoundUsage(actor);
    expect(getPerceptionCombatState(actor).perceptionUsedVs).toBeUndefined();
  });

  it('does not write an unlinked token the current player cannot update', async () => {
    const actor = makeMergeActor({ invisibilityBonus: 1 });
    (actor as any).isToken = true;
    (actor as any).token = {
      documentName: 'Token',
      isOwner: false,
      canUserModify: () => false,
    };
    let writes = 0;
    const orig = actor.unsetFlag;
    actor.unsetFlag = async (scope: string, key: string) => {
      writes += 1;
      return orig(scope, key);
    };
    const prev = (globalThis as any).game;
    (globalThis as any).game = { user: { id: 'diego', isGM: false } };
    try {
      await setPerceptionCombatState(actor, { invisibilityBonus: 4 });
    } finally {
      (globalThis as any).game = prev;
    }
    expect(writes).toBe(0);
    expect(getPerceptionCombatState(actor).invisibilityBonus).toBe(1);
  });

  it('still lets the GM write that token, and skips an identical sync', async () => {
    const actor = makeMergeActor({ invisibilityBonus: 2, blockedSenses: ['darkvision'] });
    (actor as any).isToken = true;
    (actor as any).token = { documentName: 'Token', isOwner: false, canUserModify: () => false };
    let writes = 0;
    const orig = actor.unsetFlag;
    actor.unsetFlag = async (scope: string, key: string) => {
      writes += 1;
      return orig(scope, key);
    };
    const prev = (globalThis as any).game;
    (globalThis as any).game = { user: { id: 'gm', isGM: true } };
    try {
      await setPerceptionCombatState(actor, { invisibilityBonus: 2, blockedSenses: ['darkvision'] as any });
      expect(writes).toBe(0);
      await setPerceptionCombatState(actor, { invisibilityBonus: 5 });
      expect(writes).toBe(1);
      expect(getPerceptionCombatState(actor).invisibilityBonus).toBe(5);
    } finally {
      (globalThis as any).game = prev;
    }
  });

  it('clearPerceptionCombatEncounterState unsets the whole flag', async () => {
    const actor = makeMergeActor({
      perceptionUsedVs: { tgt: true },
      locatedTargets: { tgt: { targetId: 'tgt', round: 1, expiresRound: 1 } },
      hidden: true,
    });
    await clearPerceptionCombatEncounterState(actor);
    expect(actor.flags['mastery-system'].perceptionCombat).toBeUndefined();
    expect(getPerceptionCombatState(actor)).toEqual({});
  });
});
