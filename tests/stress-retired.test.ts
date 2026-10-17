import { describe, expect, it, vi } from 'vitest';
import {
  applyFizzleStress,
  applyStressToActor,
} from '../src/combat/spell-roll-handler.js';
import { maybeTriggerStressBreakdown } from '../src/combat/stress-breakdown.js';
import {
  noteSplitSpellRoll,
  resetSplitSpellRolls,
  splitSpellShouldStress,
} from '../src/combat/split-spell-stress.js';

describe('mechanical Stress retired', () => {
  it('applyStressToActor is a no-op', async () => {
    const update = vi.fn();
    const actor = {
      type: 'character',
      system: {
        stress: {
          bars: [{ name: 'Healthy', max: 10, current: 10, penalty: 0 }],
          currentBar: 0,
        },
      },
      update,
    };
    const bar = await applyStressToActor(actor, 8);
    expect(bar).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });

  it('applyFizzleStress returns 0 without rolling', async () => {
    const amount = await applyFizzleStress({ id: 'x', system: { stress: { bars: [] } } });
    expect(amount).toBe(0);
  });

  it('maybeTriggerStressBreakdown always no-ops', async () => {
    const actor = {
      type: 'character',
      system: {
        stress: {
          bars: [
            { name: 'Healthy', max: 10, current: 0, penalty: 0 },
            { name: 'Stressed', max: 10, current: 0, penalty: 0 },
            { name: 'Not Well', max: 10, current: 0, penalty: 0 },
            { name: 'Breaking', max: 10, current: 0, penalty: 0 },
          ],
          currentBar: 3,
        },
      },
      getFlag: () => false,
      setFlag: vi.fn(),
    };
    await expect(maybeTriggerStressBreakdown(actor)).resolves.toBe(false);
    expect(actor.setFlag).not.toHaveBeenCalled();
  });

  it('split spell helpers never return stress', () => {
    resetSplitSpellRolls();
    expect(splitSpellShouldStress([1, 2], 99)).toBe(false);
    expect(noteSplitSpellRoll('z', 5, 22, 1)).toBe('clear');
    expect(noteSplitSpellRoll('z2', 5, 22)).toBe('pending');
    expect(noteSplitSpellRoll('z2', 6, 22)).toBe('clear');
  });
});
