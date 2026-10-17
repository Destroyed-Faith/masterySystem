import { describe, expect, it } from 'vitest';
import { computePerceptionTn } from '../src/combat/perception-gate.js';
import { applyStealthRollResult } from '../src/combat/perception-combat-hooks.js';
import { getPerceptionCombatState } from '../src/combat/perception-state.js';
import {
  absorptionStonesPerTrigger,
  fortitudeMultiplierForLevel,
} from '../src/utils/powers/templates/passives.js';
import { PASSIVE_TEMPLATES } from '../src/utils/powers/templates/passives.js';

function actorWithFlag(flag: Record<string, unknown>) {
  const flags: Record<string, any> = { 'mastery-system': { perceptionCombat: { ...flag } } };
  return {
    id: 'a',
    name: 'A',
    flags,
    system: { mastery: { rank: 3 }, health: { currentBar: 0, bars: [{ name: 'Healthy' }] } },
    items: [],
    getFlag(_s: string, key: string) {
      return flags['mastery-system']?.[key];
    },
    async setFlag(_s: string, key: string, value: unknown) {
      flags['mastery-system'][key] = value;
    },
    async unsetFlag(_s: string, key: string) {
      delete flags['mastery-system'][key];
    },
  };
}

describe('v0.9.9.5 core deltas', () => {
  it('ordinary Stealth Final Result is the Perception TN and is not added to Invisibility', async () => {
    const hidden = actorWithFlag({ hidden: true, stealthPerceptionTn: 21 });
    expect(computePerceptionTn(hidden)).toBe(21);

    const invisible = actorWithFlag({
      hidden: true,
      stealthPerceptionTn: 21,
      invisibilityBonus: 6,
    });
    // MR 3 → 4*3 + 6 = 18. Stealth result is not added.
    expect(computePerceptionTn(invisible)).toBe(18);
  });

  it('applyStealthRollResult stores the final result', async () => {
    const actor = actorWithFlag({});
    await applyStealthRollResult(actor, { success: true, finalResult: 21 });
    expect(getPerceptionCombatState(actor).stealthPerceptionTn).toBe(21);
    expect(getPerceptionCombatState(actor).hidden).toBe(true);
  });

  it('Fortitude and Absorption curves match the book', () => {
    expect(fortitudeMultiplierForLevel(1)).toBe(4);
    expect(fortitudeMultiplierForLevel(4)).toBe(5);
    expect(fortitudeMultiplierForLevel(8)).toBe(6);
    expect(fortitudeMultiplierForLevel(12)).toBe(7);
    expect(fortitudeMultiplierForLevel(16)).toBe(8);
    expect(absorptionStonesPerTrigger(1)).toBe(1);
    expect(absorptionStonesPerTrigger(3)).toBe(2);
    expect(absorptionStonesPerTrigger(16)).toBe(8);
  });

  it('retired combined passives are not selectable; Fortitude is', () => {
    const ids = new Set(PASSIVE_TEMPLATES.map((t) => t.templateId));
    expect(ids.has('passive-armor-temp-hp')).toBe(false);
    expect(ids.has('passive-stone-stance')).toBe(false);
    expect(ids.has('passive-fortitude')).toBe(true);
    expect(ids.has('passive-invisibility')).toBe(true);
  });
});
