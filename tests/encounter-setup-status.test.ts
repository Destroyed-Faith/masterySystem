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
  it('lists slotted passives and marks shop purchases', () => {
    (globalThis as any).game = { user: { isGM: true }, combat: null };
    const combatant = mockCombatant({
      passives: [{ name: 'Lean Ward' }],
      shop: { extraAttack: true, extraMovement: 1 },
    });
    const status = buildEncounterSetupStatus(combatant, null);
    expect(status?.rows[0]?.summary).toContain('Lean Ward');
    expect(status?.rows[0]?.done).toBe(true);
    expect(status?.rows[2]?.summary).toMatch(/\+Atk/);
    expect(status?.rows[2]?.done).toBe(true);
  });

  it('shows open rows when nothing was picked', () => {
    (globalThis as any).game = { user: { isGM: false }, combat: null };
    const status = buildEncounterSetupStatus(mockCombatant({}), null);
    expect(status?.rows.every((r) => r.summary === 'noch nichts')).toBe(true);
    expect(status?.canForce).toBe(false);
  });
});
