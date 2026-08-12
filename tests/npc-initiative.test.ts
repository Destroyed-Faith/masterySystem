import { describe, expect, it } from 'vitest';
import {
  clampNpcInitiativeModifier,
  formatNpcInitiativeSigned,
  getNpcInitiativeModifier,
  splitNpcInitiativeModifier,
} from '../src/utils/npc-initiative.js';

describe('npc initiative modifier', () => {
  it('clamps to −10…+10', () => {
    expect(clampNpcInitiativeModifier(-99)).toBe(-10);
    expect(clampNpcInitiativeModifier(99)).toBe(10);
    expect(clampNpcInitiativeModifier('−3')).toBe(0); // not a JS number
    expect(clampNpcInitiativeModifier('-3')).toBe(-3);
    expect(clampNpcInitiativeModifier(undefined)).toBe(0);
  });

  it('splits net into malus or bonus for the sheet selects', () => {
    expect(splitNpcInitiativeModifier(-4)).toEqual({ net: -4, malus: -4, bonus: 0 });
    expect(splitNpcInitiativeModifier(5)).toEqual({ net: 5, malus: 0, bonus: 5 });
    expect(splitNpcInitiativeModifier(0)).toEqual({ net: 0, malus: 0, bonus: 0 });
  });

  it('formats signed display', () => {
    expect(formatNpcInitiativeSigned(0)).toBe('0');
    expect(formatNpcInitiativeSigned(3)).toBe('+3');
    expect(formatNpcInitiativeSigned(-2)).toBe('-2');
  });

  it('reads active phase initiative over root', () => {
    const actor = {
      system: {
        combat: { initiative: 2 },
        npcActivePhaseIndex: 1,
        phases: [{ combat: { initiative: 1 } }, { combat: { initiative: -4 } }],
      },
    };
    expect(getNpcInitiativeModifier(actor)).toBe(-4);
  });

  it('falls back to root when no phases', () => {
    expect(getNpcInitiativeModifier({ system: { combat: { initiative: -6 } } })).toBe(-6);
  });
});
