/**
 * A2: prepareDerivedData path collects mechanics contributions once via
 * buildActorMechanicsBreakdowns (same results as the three separate builders).
 */
import { describe, expect, it } from 'vitest';
import {
  buildActorMechanicsBreakdown,
  buildActorMechanicsBreakdowns,
  buildBuffMechanicsBreakdown,
  buildPassiveMechanicsBreakdown,
} from '../src/utils/power-mechanics.js';

describe('A2 buildActorMechanicsBreakdowns', () => {
  it('matches separate all/passive/buff builders for an empty actor', () => {
    const actor = {
      id: 'a1',
      items: [],
      effects: [],
      system: { passives: {} },
    };
    const batched = buildActorMechanicsBreakdowns(actor);
    expect(batched.all).toEqual(buildActorMechanicsBreakdown(actor));
    expect(batched.passive).toEqual(buildPassiveMechanicsBreakdown(actor));
    expect(batched.buff).toEqual(buildBuffMechanicsBreakdown(actor));
  });

  it('folds a slotted passive into all + passive, not buff', () => {
    const actor = {
      id: 'a2',
      items: [
        {
          id: 'p-dr',
          type: 'power',
          name: 'Damage Reduction',
          system: {
            templateId: 'passive-damage-reduction',
            category: 'passive',
            powerType: 'passive',
            rank: 4,
            levels: {
              '4': { mechanics: { damageReductionPct: 20, applyWhen: 'passive-slotted-active' } },
            },
          },
        },
      ],
      effects: [],
      system: { passives: {} },
    };
    const batched = buildActorMechanicsBreakdowns(actor);
    expect(batched.passive.totals.damageReductionPct).toBeGreaterThan(0);
    expect(batched.all.totals.damageReductionPct).toBe(batched.passive.totals.damageReductionPct);
    expect(batched.buff.totals.damageReductionPct).toBe(0);
  });
});
