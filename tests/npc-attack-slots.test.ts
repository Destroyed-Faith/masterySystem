import { describe, expect, it } from 'vitest';

import {
  npcAttacksPerRoundCap,
  npcAttackUsageKey,
  resolveNpcAttackSlots,
  sumNpcAttackSlotsFromPowers,
} from '../src/utils/npc-attack-model.js';

describe('npc attack slots from Angriffe/Runde', () => {
  it('caps per-power copies at 1–5', () => {
    expect(npcAttacksPerRoundCap(undefined)).toBe(1);
    expect(npcAttacksPerRoundCap({ npcAttacksPerRound: 0 })).toBe(1);
    expect(npcAttacksPerRoundCap({ npcAttacksPerRound: 3 })).toBe(3);
    expect(npcAttacksPerRoundCap({ npcAttacksPerRound: 9 })).toBe(5);
  });

  it('sums active-list copies into ATK slots', () => {
    const system = {
      npcBaseAttack: {
        name: 'Hieb',
        attackDiceCount: 6,
        damageDiceCount: 4,
        npcAttacksPerRound: 2,
      },
      attackValues: [
        { name: 'Strahl', attackDiceCount: 6, damageDiceCount: 4, npcAttacksPerRound: 3 },
      ],
    };
    expect(sumNpcAttackSlotsFromPowers(system)).toBe(5);
  });

  it('uses the active phase attack list for the sum', () => {
    const system = {
      npcActivePhaseIndex: 1,
      phases: [
        {
          npcBaseAttack: {
            name: 'P1',
            attackDiceCount: 4,
            damageDiceCount: 4,
            npcAttacksPerRound: 1,
          },
          attackValues: [],
        },
        {
          npcBaseAttack: {
            name: 'P2',
            attackDiceCount: 4,
            damageDiceCount: 4,
            npcAttacksPerRound: 2,
          },
          attackValues: [
            { name: 'Extra', attackDiceCount: 4, damageDiceCount: 4, npcAttacksPerRound: 2 },
          ],
        },
      ],
    };
    expect(sumNpcAttackSlotsFromPowers(system)).toBe(4);
    expect(npcAttackUsageKey(1, 0)).toBe('npc-attack-1-0');
  });
});

describe('resolveNpcAttackSlots (explicit per phase)', () => {
  it('prefers an explicit root attackSlots over the APR sum', () => {
    const system = {
      attackSlots: 7,
      npcBaseAttack: {
        name: 'Hieb',
        attackDiceCount: 6,
        damageDiceCount: 4,
        npcAttacksPerRound: 1,
      },
      attackValues: [],
    };
    expect(resolveNpcAttackSlots(system)).toBe(7);
    expect(sumNpcAttackSlotsFromPowers(system)).toBe(1);
  });

  it('uses each phase attackSlots independently', () => {
    const system = {
      npcActivePhaseIndex: 0,
      phases: [
        {
          attackSlots: 2,
          npcBaseAttack: {
            name: 'P1',
            attackDiceCount: 4,
            damageDiceCount: 4,
            npcAttacksPerRound: 5,
          },
          attackValues: [],
        },
        {
          attackSlots: 6,
          npcBaseAttack: {
            name: 'P2',
            attackDiceCount: 4,
            damageDiceCount: 4,
            npcAttacksPerRound: 1,
          },
          attackValues: [],
        },
      ],
    };
    expect(resolveNpcAttackSlots(system)).toBe(2);
    expect(resolveNpcAttackSlots({ ...system, npcActivePhaseIndex: 1 })).toBe(6);
  });

  it('falls back to APR sum when phase attackSlots is unset', () => {
    const system = {
      npcActivePhaseIndex: 0,
      phases: [
        {
          npcBaseAttack: {
            name: 'P1',
            attackDiceCount: 4,
            damageDiceCount: 4,
            npcAttacksPerRound: 3,
          },
          attackValues: [],
        },
      ],
    };
    expect(resolveNpcAttackSlots(system)).toBe(3);
  });
});
