import { describe, expect, it } from 'vitest';
import { buildEncounterSetupStatus } from '../src/combat/encounter-setup-status.js';

function mockCombatant(opts: {
  actorId?: string;
  passives?: Array<{ name: string }>;
  shop?: Record<string, unknown>;
  confirmed?: boolean;
}): Combatant {
  const actor = {
    id: opts.actorId ?? 'a1',
    type: 'character',
    items: { get: () => null },
    system: {
      mastery: { rank: 4 },
      passives: Object.fromEntries(
        (opts.passives ?? []).map((p, i) => [`slot${i}`, { passive: { id: `p${i}`, name: p.name }, active: true }]),
      ),
    },
    getFlag: () => null,
  };
  return {
    id: 'c1',
    actor,
    getFlag: (_scope: string, key: string) => (key === 'initiativeShop' ? opts.shop : null),
  } as unknown as Combatant;
}

describe('buildEncounterSetupStatus', () => {
  it('lists slotted passives without marking them done', () => {
    (globalThis as any).game = { user: { isGM: true }, combat: null };
    const combatant = mockCombatant({
      passives: [{ name: 'Lean Ward' }],
    });
    const status = buildEncounterSetupStatus(combatant, null);
    expect(status?.rows[0]?.summary).toContain('Lean Ward');
    expect(status?.rows[0]?.done).toBe(false);
    expect(status?.rows).toHaveLength(2);
  });

  it('marks rows done only after explicit confirm', () => {
    const combat = {
      id: 'c1',
      round: 1,
      flags: {
        'mastery-system': {
          encounterSetup: {
            passives: { a1: { locked: true } },
            initiativeConfirmed: { c1: true },
          },
          stonePowersState: { stonesDone: { c1: 1 } },
        },
      },
    };
    (globalThis as any).game = {
      user: { isGM: true },
      combat,
      combats: { get: (id: string) => (id === 'c1' ? combat : null) },
    };
    const status = buildEncounterSetupStatus(mockCombatant({ actorId: 'a1' }), combat as unknown as Combat);
    expect(status?.rows.every((r) => r.done)).toBe(true);
  });

  it('hides pick summaries from players', () => {
    (globalThis as any).game = { user: { isGM: false }, combat: null };
    expect(buildEncounterSetupStatus(mockCombatant({ passives: [{ name: 'Lean Ward' }] }), null)).toBeNull();
  });

  it('shows open rows when nothing was picked', () => {
    (globalThis as any).game = { user: { isGM: true }, combat: null };
    const status = buildEncounterSetupStatus(mockCombatant({}), null);
    expect(status?.rows.every((r) => r.summary === 'noch nichts')).toBe(true);
    expect(status?.canForce).toBe(true);
  });
});
