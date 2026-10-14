import { describe, expect, it } from 'vitest';
import { endOrdinaryStealthOnAttack } from '../src/combat/perception-gate.js';
import { getPerceptionCombatState, setPerceptionCombatState } from '../src/combat/perception-state.js';

function makeActor(id: string, name: string, initial?: Record<string, unknown>) {
  const flags: Record<string, any> = {
    'mastery-system': initial ? { perceptionCombat: { ...initial } } : {},
  };
  return {
    id,
    name,
    flags,
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      if (!flags[scope]) flags[scope] = {};
      flags[scope][key] = value;
    },
    async unsetFlag(scope: string, key: string) {
      if (flags[scope]) delete flags[scope][key];
    },
  };
}

describe('Attacking from Invisibility (no reveal)', () => {
  it('endOrdinaryStealthOnAttack clears hidden but leaves invisibility bonus flag', async () => {
    const attacker = makeActor('atk', 'Sneak', {
      hidden: true,
      stealthRaiseBonus: 4,
      invisibilityBonus: 2,
    });
    await endOrdinaryStealthOnAttack(attacker);
    const st = getPerceptionCombatState(attacker);
    expect(st.hidden).toBe(false);
    expect(st.stealthRaiseBonus).toBe(0);
    expect(st.invisibilityBonus).toBe(2);
  });

  it('endOrdinaryStealthOnAttack is a no-op when only invisible (not stealth-hidden)', async () => {
    const attacker = makeActor('atk', 'Ghost');
    await setPerceptionCombatState(attacker, { invisibilityBonus: 5 });
    await endOrdinaryStealthOnAttack(attacker);
    const st = getPerceptionCombatState(attacker);
    expect(st.invisibilityBonus).toBe(5);
    expect(st.hidden).toBeFalsy();
  });
});
