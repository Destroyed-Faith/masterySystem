import { describe, expect, it } from 'vitest';
import { passiveSlotsHaveOpenChoice } from '../src/powers/passives';
import { initiativeRollAlreadyRecorded } from '../src/combat/initiative-roll';
import { formatRaiseOutcomeBody } from '../src/combat/raise-resolution';

describe('passiveSlotsHaveOpenChoice', () => {
  it('stays quiet when every unlocked slot is already filled', () => {
    expect(
      passiveSlotsHaveOpenChoice([{ passive: { id: 'a' } }, { passive: { id: 'b' } }], 4, 0),
    ).toBe(false);
  });

  it('stays quiet when the empty slot has no spare passive', () => {
    expect(passiveSlotsHaveOpenChoice([{ passive: { id: 'a' } }, { passive: null }], 1, 0)).toBe(false);
  });

  it('prompts when an empty slot still has a passive to assign', () => {
    expect(passiveSlotsHaveOpenChoice([{ passive: { id: 'a' } }, { passive: null }], 2, 0)).toBe(true);
  });

  it('prompts after Exchange Passive even if the slots are full', () => {
    expect(passiveSlotsHaveOpenChoice([{ passive: { id: 'a' } }], 1, 1)).toBe(true);
  });
});

describe('initiativeRollAlreadyRecorded', () => {
  it('matches only the same combat and round with a stored total', () => {
    expect(initiativeRollAlreadyRecorded({ combatId: 'c1', round: 1, total: 11 }, 'c1', 1)).toBe(true);
    expect(initiativeRollAlreadyRecorded({ combatId: 'c1', round: 1, total: 11 }, 'c1', 2)).toBe(false);
    expect(initiativeRollAlreadyRecorded({ combatId: 'c1', round: 1 }, 'c1', 1)).toBe(false);
  });
});

describe('formatRaiseOutcomeBody', () => {
  it('labels damage and range so the raise line is not just 3d8', () => {
    expect(
      formatRaiseOutcomeBody({
        damageDice: 3,
        specials: [],
        rangeM: 12,
        aoeRadiusM: null,
        durationSteps: 0,
        hasRange: true,
        hasAoe: false,
        hasDuration: false,
      }),
    ).toBe('3d8 Schaden, Reichweite 12 m');
  });
});
