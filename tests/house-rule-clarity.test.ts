import { describe, expect, it } from 'vitest';
import { passiveSlotsHaveOpenChoice } from '../src/powers/passives';
import {
  formatInitiativeExchangeSummary,
  initiativeRollAlreadyRecorded,
  pcNeedsManualInitiativeRoll,
} from '../src/combat/initiative-roll';
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

describe('pcNeedsManualInitiativeRoll', () => {
  it('asks a player character to press the button before the first roll', () => {
    expect(
      pcNeedsManualInitiativeRoll({
        actorType: 'character',
        combatId: 'c1',
        initiative: null,
      }),
    ).toBe(true);
    expect(
      pcNeedsManualInitiativeRoll({
        actorType: 'character',
        combatId: 'c1',
        initiative: 0,
        combatantHasRecordedValue: false,
      }),
    ).toBe(true);
  });

  it('does not ask again once this combat already has a stored total', () => {
    expect(
      pcNeedsManualInitiativeRoll({
        actorType: 'character',
        combatId: 'c1',
        recordedCombatId: 'c1',
        recordedTotal: 11,
        initiative: 11,
        combatantHasRecordedValue: true,
      }),
    ).toBe(false);
  });

  it('skips NPCs and surprised characters', () => {
    expect(pcNeedsManualInitiativeRoll({ actorType: 'npc', combatId: 'c1', initiative: null })).toBe(false);
    expect(
      pcNeedsManualInitiativeRoll({
        actorType: 'character',
        surprised: true,
        combatId: 'c1',
        initiative: 0,
      }),
    ).toBe(false);
  });
});

describe('formatInitiativeExchangeSummary', () => {
  it('names the roll and what can still be added', () => {
    expect(
      formatInitiativeExchangeSummary({
        diceTotal: 7,
        initiative: 7,
        combatReflexesNext: 2,
        costPerStone: 2,
      }),
    ).toBe(
      'Wurf hat 7 gebracht. Jetzt kannst du noch +2 aus Combat Reflexes drauflegen, oder 2 Initiative pro Stein tauschen.',
    );
  });

  it('keeps the dice result when Combat Reflexes already changed the score', () => {
    expect(
      formatInitiativeExchangeSummary({
        diceTotal: 7,
        initiative: 9,
        combatReflexesNext: 0,
        costPerStone: 2,
      }),
    ).toBe('Wurf hat 7 gebracht. Initiative jetzt 9. Du kannst 2 Initiative pro Stein tauschen.');
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
