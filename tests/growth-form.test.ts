import { describe, expect, it } from 'vitest';
import { growthFormBlocksProne, reduceForcedMeters } from '../src/combat/growth-form.js';

function actorWithForm(form: Record<string, unknown> | null) {
  return {
    effects: form
      ? [{ disabled: false, flags: { 'mastery-system': { mechanics: { growthForm: form } } } }]
      : [],
  };
}

describe('Growth Form riders', () => {
  it('reduces push and pull and floors at 0', () => {
    const giant = actorWithForm({ pushReductionM: 8, reachBonusM: 3, proneImmunity: 'smaller', footprintHexes: 3 });
    expect(reduceForcedMeters(giant, 10)).toBe(2);
    expect(reduceForcedMeters(giant, 3)).toBe(0);
    expect(reduceForcedMeters(actorWithForm(null), 5)).toBe(5);
  });

  it('blocks Prone from smaller or standard footprints', () => {
    const large = actorWithForm({ pushReductionM: 4, proneImmunity: 'smaller', footprintHexes: 3 });
    const standard = actorWithForm({ proneImmunity: 'standard', footprintHexes: 3 });
    const bigger = actorWithForm({ footprintHexes: 7, proneImmunity: 'none' });
    expect(growthFormBlocksProne(large, actorWithForm(null))).toBe(true);
    expect(growthFormBlocksProne(large, bigger)).toBe(false);
    expect(growthFormBlocksProne(standard, actorWithForm(null))).toBe(true);
    expect(growthFormBlocksProne(standard, bigger)).toBe(false);
  });
});
