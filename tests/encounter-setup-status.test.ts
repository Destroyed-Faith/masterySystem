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
  it('keeps carousel cards free of Passives and Stones setup rows', () => {
    (globalThis as any).game = { user: { isGM: true }, combat: null };
    const combatant = mockCombatant({
      passives: [{ name: 'Lean Ward' }],
    });
    const status = buildEncounterSetupStatus(combatant, null);
    expect(status?.rows).toEqual([]);
    expect(status?.passivesDone).toBe(false);
    expect(status?.stonesDone).toBe(false);
  });

  it('marks setup done flags after explicit confirm without adding rows', () => {
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
    expect(status?.rows).toEqual([]);
    expect(status?.passivesDone).toBe(true);
    expect(status?.stonesDone).toBe(true);
  });

  it('hides pick summaries from players', () => {
    (globalThis as any).game = { user: { isGM: false }, combat: null };
    expect(buildEncounterSetupStatus(mockCombatant({ passives: [{ name: 'Lean Ward' }] }), null)).toBeNull();
  });

  it('tracks a confirmed stone assignment for the GM without listing it', () => {
    const combat = {
      id: 'cmb',
      round: 1,
      flags: {
        'mastery-system': {
          stonePowersState: { stonesDone: { c1: 1 } },
        },
      },
    };
    (globalThis as any).game = { user: { isGM: true }, combat };
    const combatant = mockCombatant({ actorId: 'a1' });
    (combatant.actor as any).items = {
      get: (id: string) => (id === 'might.parry' ? { name: 'Parry' } : null),
    };
    (combatant.actor as any).getFlag = (_scope: string, key: string) =>
      key === 'stonePowersRoundPlan'
        ? {
            combatId: 'cmb',
            round: 1,
            lanes: [{ accKey: 'might.parry:might:0', value: [1] }],
          }
        : null;
    const status = buildEncounterSetupStatus(combatant, combat as unknown as Combat);
    expect(status?.rows).toEqual([]);
    expect(status?.stonesDone).toBe(true);
  });

  it('still lets the GM force dialogs when nothing was picked', () => {
    (globalThis as any).game = { user: { isGM: true }, combat: null };
    const status = buildEncounterSetupStatus(mockCombatant({}), null);
    expect(status?.rows).toEqual([]);
    expect(status?.canForce).toBe(true);
    expect(status?.passivesDone).toBe(false);
    expect(status?.stonesDone).toBe(false);
  });
});
