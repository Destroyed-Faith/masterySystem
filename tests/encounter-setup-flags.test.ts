import { describe, expect, it } from 'vitest';
import {
  isCombatantInitiativeConfirmed,
  isPassiveSelectionLocked,
  readCombatantSetupStep,
} from '../src/combat/encounter-setup-flags.js';

function combatantWithStep(step: Record<string, unknown> | null): Combatant {
  return {
    id: 'c1',
    actor: { id: 'a1' },
    getFlag: (_scope: string, key: string) => (key === 'encounterSetupStep' ? step : null),
  } as unknown as Combatant;
}

describe('encounter setup combatant flags', () => {
  it('reads a step only for the current combat', () => {
    const combat = { id: 'c1' } as Combat;
    expect(readCombatantSetupStep(combatantWithStep({ combatId: 'c1', passivesLocked: true }), combat)?.passivesLocked).toBe(
      true,
    );
    expect(readCombatantSetupStep(combatantWithStep({ combatId: 'other', passivesLocked: true }), combat)).toBeNull();
  });

  it('treats combatant locks as done when Combat flags are empty', () => {
    const combatant = combatantWithStep({
      combatId: 'c1',
      passivesLocked: true,
      stonesDoneRound: 1,
      initiativeConfirmed: true,
    });
    const combat = {
      id: 'c1',
      flags: { 'mastery-system': {} },
      combatants: {
        get: (id: string) => (id === 'c1' ? combatant : null),
        [Symbol.iterator]: function* () {
          yield combatant;
        },
      },
    } as unknown as Combat;
    (combat.combatants as any).find = (fn: (c: Combatant) => boolean) =>
      Array.from(combat.combatants).find(fn);

    expect(isPassiveSelectionLocked(combat, 'a1')).toBe(true);
    expect(isCombatantInitiativeConfirmed(combat, 'c1')).toBe(true);
  });
});
