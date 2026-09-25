import { describe, expect, it } from 'vitest';

import {
  npcAttacksPerRoundCap,
  npcAttackUsageKey,
  npcAttackDiceCount,
  npcAttackExplodesOn7,
  resolveNpcSheetToHit,
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

describe('npc attack dice pool', () => {
  it('uses the sheet count, and an empty field is 6 not Might', () => {
    expect(npcAttackDiceCount(null)).toBe(0);
    expect(npcAttackDiceCount({ attackDiceCount: 0 } as any)).toBe(0);
    expect(npcAttackDiceCount({ attackDiceCount: 2 } as any)).toBe(2);
    expect(npcAttackDiceCount({} as any)).toBe(6);
    expect(npcAttackDiceCount({ attackDiceCount: '' } as any)).toBe(6);
    expect(npcAttackDiceCount({ attackDiceCount: 6 } as any)).toBe(6);
  });

  it('keeps an explicit token count and only reads the prototype when the token field is blank', () => {
    const tokenTwo = {
      npcBaseAttack: { name: 'Hieb', attackDiceCount: 2, damageDiceCount: 4 },
    };
    const protoSix = {
      npcBaseAttack: { name: 'Waffenangriff', attackDiceCount: 6, damageDiceCount: 4 },
    };
    expect(
      resolveNpcSheetToHit({
        actorType: 'npc',
        system: tokenTwo,
        masteryRank: 2,
        prototypeSystem: protoSix,
      }),
    ).toEqual({ dice: 2, keep: 2, name: 'Hieb', crit: false });

    expect(
      resolveNpcSheetToHit({
        actorType: 'npc',
        system: { npcBaseAttack: { name: 'Waffenangriff' } },
        masteryRank: 2,
        prototypeSystem: protoSix,
      }),
    ).toEqual({ dice: 6, keep: 2, name: 'Waffenangriff', crit: false });

    expect(
      resolveNpcSheetToHit({
        actorType: 'npc',
        system: {},
        masteryRank: 2,
      }),
    ).toEqual({ dice: 6, keep: 2, name: '', crit: false });

    expect(
      resolveNpcSheetToHit({
        actorType: 'summon',
        system: { npcBaseAttack: { name: 'Summon Attack', attackDiceCount: 2 } },
        masteryRank: 1,
        prototypeSystem: protoSix,
      }),
    ).toEqual({ dice: 2, keep: 1, name: 'Summon Attack', crit: false });

    expect(
      resolveNpcSheetToHit({
        actorType: 'summon',
        system: {},
        masteryRank: 1,
      }),
    ).toBeNull();

    expect(
      resolveNpcSheetToHit({
        actorType: 'character',
        system: protoSix,
        masteryRank: 4,
      }),
    ).toBeNull();
  });

  it('reads Crit per power: attack dice explode on 7–8 only when that row is marked', () => {
    expect(npcAttackExplodesOn7(null)).toBe(false);
    expect(npcAttackExplodesOn7({ npcCrit: true })).toBe(true);
    expect(npcAttackExplodesOn7({ npcCrit: 'on' as any })).toBe(true);
    expect(npcAttackExplodesOn7({})).toBe(false);

    const system = {
      npcBaseAttack: { name: 'Hieb', attackDiceCount: 6, npcCrit: false },
      attackValues: [{ name: 'Biss', attackDiceCount: 8, npcCrit: true }],
    };
    expect(
      resolveNpcSheetToHit({ actorType: 'npc', system, masteryRank: 3, attackIndex: 0 })?.crit,
    ).toBe(false);
    expect(
      resolveNpcSheetToHit({ actorType: 'npc', system, masteryRank: 3, attackIndex: 1 })?.crit,
    ).toBe(true);
  });
});
