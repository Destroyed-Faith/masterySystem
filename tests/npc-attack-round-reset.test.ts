import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Foundry `Document#setFlag` merges object values (does not replace).
 * Simulate that here so we can prove round-reset clears NPC attack uses.
 */
function createMergeFlagActor(initial?: Record<string, unknown>) {
  const flags: Record<string, any> = {
    'mastery-system': { ...(initial ?? {}) },
  };

  const merge = (target: any, source: any): any => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return source;
    const out = { ...(target && typeof target === 'object' && !Array.isArray(target) ? target : {}) };
    for (const [k, v] of Object.entries(source)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = merge(out[k], v);
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  return {
    id: 'npc1',
    type: 'npc',
    isToken: false,
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
      if (!flags[scope]) flags[scope] = {};
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flags[scope][key] = merge(flags[scope][key], value);
      } else {
        flags[scope][key] = value;
      }
    },
    async unsetFlag(scope: string, key: string) {
      if (flags[scope]) delete flags[scope][key];
    },
  };
}

describe('NPC attack uses reset across rounds (Foundry flag merge)', () => {
  beforeEach(() => {
    (globalThis as any).game = { actors: { get: () => null } };
    (globalThis as any).Hooks = { callAll: vi.fn() };
  });

  it('setRoundState clears npcAttackUsesThisRound even when setFlag merges', async () => {
    const {
      setRoundState,
      getNpcAttackUsesThisRound,
      markNpcAttackUsedThisRound,
      resetRoundState,
    } = await import('../src/combat/action-economy.js');

    const actor = createMergeFlagActor() as any;
    const combat = { id: 'c1', round: 1, turn: 0 } as any;

    await markNpcAttackUsedThisRound(actor, combat, 'npc-attack-root-0');
    expect(getNpcAttackUsesThisRound(actor, combat, 'npc-attack-root-0')).toBe(1);

    // Naive merge-write of {} must NOT be how we persist (documents the bug).
    await actor.setFlag('mastery-system', 'roundState', {
      ...actor.getFlag('mastery-system', 'roundState'),
      npcAttackUsesThisRound: {},
    });
    expect(getNpcAttackUsesThisRound(actor, combat, 'npc-attack-root-0')).toBe(1);

    // Proper replace via setRoundState / resetRoundState.
    const combatant = { actor, id: 'cb1' } as any;
    const combatR2 = { id: 'c1', round: 2, turn: 0 } as any;
    await resetRoundState(actor, combatant, combatR2);
    expect(getNpcAttackUsesThisRound(actor, combatR2, 'npc-attack-root-0')).toBe(0);

    // And a direct setRoundState empty map also clears.
    await markNpcAttackUsedThisRound(actor, combatR2, 'npc-attack-root-0');
    expect(getNpcAttackUsesThisRound(actor, combatR2, 'npc-attack-root-0')).toBe(1);
    await setRoundState(actor, {
      combatId: 'c1',
      round: 2,
      turn: 0,
      isPC: false,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      npcAttackUsesThisRound: {},
      usedPowerIdsThisRound: [],
    });
    expect(getNpcAttackUsesThisRound(actor, combatR2, 'npc-attack-root-0')).toBe(0);
  });
});
