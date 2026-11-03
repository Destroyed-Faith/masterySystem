import { describe, expect, it } from 'vitest';
import { activeBuffOptionMarks } from '../src/combat/active-buff-option-state.js';

const options = [
  { id: 'damage', name: 'Active Buff: Damage', level: 4 },
  { id: 'roar', name: 'Draconic Roar I', level: 2 },
  { id: 'artifact:staff:2:active-buff', name: 'Serpent Evasion I', level: 2 },
];

describe('active buff option marks', () => {
  it('marks an artifact buff by key even when the listed Power Level is lower', () => {
    const effect = {
      name: 'Serpent Evasion I',
      flags: {
        'mastery-system': {
          activeBuff: true,
          artifactBuffKey: 'artifact:staff:2:active-buff',
          powerName: 'Serpent Evasion I',
          effectiveLevel: 4,
          activatedRound: 3,
        },
      },
    };
    expect(activeBuffOptionMarks(options[2], effect, 3, options)).toEqual({
      isActive: true,
      chosenThisRound: true,
    });
    expect(activeBuffOptionMarks(options[0], effect, 3, options).isActive).toBe(false);
    expect(activeBuffOptionMarks(options[1], effect, 3, options).isActive).toBe(false);
  });

  it('marks a power buff by powerId and keeps an older activation as active only', () => {
    const effect = {
      name: 'Draconic Roar I',
      flags: {
        'mastery-system': {
          powerId: 'roar',
          powerName: 'Draconic Roar I',
          activationRound: 1,
          effectiveLevel: 2,
        },
      },
    };
    expect(activeBuffOptionMarks(options[1], effect, 3, options)).toEqual({
      isActive: true,
      chosenThisRound: false,
    });
  });

  it('falls back to the only same-named row when empowerment changed the level', () => {
    const effect = {
      name: 'Serpent Evasion I',
      flags: {
        'mastery-system': {
          powerName: 'Serpent Evasion I',
          effectiveLevel: 4,
          activatedRound: 2,
        },
      },
    };
    expect(activeBuffOptionMarks(options[2], effect, 2, options).isActive).toBe(true);
  });
});
