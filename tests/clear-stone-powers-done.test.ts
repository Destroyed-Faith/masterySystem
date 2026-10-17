/**
 * GM Reset Stone Assignments must clear combat stonesDone via ForcedDeletion path.
 */
import { describe, expect, it, vi } from 'vitest';

describe('clearStonePowersDoneForCombatant', () => {
  it('writes ForcedDeletion (or -=) for the combatant stonesDone key', async () => {
    const updates: Record<string, unknown>[] = [];
    const combatant = {
      id: 'c1',
      setFlag: vi.fn(async () => undefined),
      getFlag: vi.fn(() => ({ combatId: 'cmb', stonesDoneRound: 2 })),
      canUserModify: () => true,
    };
    const combat = {
      id: 'cmb',
      round: 2,
      combatants: { get: (id: string) => (id === 'c1' ? combatant : null) },
      flags: {
        'mastery-system': {
          stonePowersState: { stonesDone: { c1: 2 }, roundStonesPrompted: {} },
        },
      },
      getFlag: (scope: string, key: string) =>
        scope === 'mastery-system' ? (combat as any).flags?.[scope]?.[key] : undefined,
      update: vi.fn(async (patch: Record<string, unknown>) => {
        updates.push(patch);
      }),
      setFlag: vi.fn(async () => undefined),
    };

    (globalThis as any).game = {
      user: { isGM: true },
      combat,
      combats: { get: (id: string) => (id === 'cmb' ? combat : null) },
    };
    (globalThis as any).foundry = {
      data: {
        operators: {
          ForcedDeletion: class ForcedDeletion {},
        },
      },
    };

    const { clearStonePowersDoneForCombatant } = await import('../src/combat/stone-round-gate.js');
    await clearStonePowersDoneForCombatant(combat as any, combatant as any);

    expect(updates.length).toBeGreaterThanOrEqual(1);
    const patch = updates[0]!;
    const key = 'flags.mastery-system.stonePowersState.stonesDone.c1';
    const legacyKey = 'flags.mastery-system.stonePowersState.stonesDone.-=c1';
    const cleared =
      patch[key] != null || Object.prototype.hasOwnProperty.call(patch, legacyKey);
    expect(cleared).toBe(true);
  });
});
