import { describe, expect, it } from 'vitest';
import {
  BASE_SUMMON,
  computeSummonBond,
  emptyBondSpend,
  maxSummonPowerLevel,
  powerTokenCostFromPp,
  standardPowerTokenCost,
  summonSkillSlots,
  summonTokensFromStones,
  SUMMON_CAPS,
} from '../src/stones/summon-bond-rules';
import { migrateFamiliarToBond } from '../src/stones/summon-bond-bind';

describe('Summons V2 token formula', () => {
  it('grants 8 tokens per Bound Stone including the first', () => {
    expect(summonTokensFromStones(1)).toBe(8);
    expect(summonTokensFromStones(4)).toBe(32);
    expect(summonTokensFromStones(10)).toBe(80);
  });

  it('adds bonus tokens after the stone formula', () => {
    expect(summonTokensFromStones(1, 4)).toBe(12);
  });
});

describe('Summons V2 skill slots', () => {
  it('scales by Bound Stones only', () => {
    expect(summonSkillSlots(1)).toBe(2);
    expect(summonSkillSlots(2)).toBe(3);
    expect(summonSkillSlots(3)).toBe(4);
    expect(summonSkillSlots(10)).toBe(4);
  });
});

describe('Summons V2 power costs', () => {
  it('uses ceil(PP/10)', () => {
    expect(powerTokenCostFromPp(1)).toBe(1);
    expect(powerTokenCostFromPp(10)).toBe(1);
    expect(powerTokenCostFromPp(11)).toBe(2);
  });

  it('uses standard per-type reference costs', () => {
    expect(standardPowerTokenCost('active', 4)).toBe(12);
    expect(standardPowerTokenCost('passive', 4)).toBe(8);
    expect(standardPowerTokenCost('activeBuff', 4)).toBe(13);
  });

  it('caps power level by owner MR', () => {
    expect(maxSummonPowerLevel(1)).toBe(4);
    expect(maxSummonPowerLevel(3)).toBe(8);
    expect(maxSummonPowerLevel(5)).toBe(16);
  });
});

describe('computeSummonBond', () => {
  it('starts every Movement Mode at 8 m (PG: chosen mode begins at 8 m)', () => {
    const flying = computeSummonBond({
      boundStoneCount: 1,
      movementMode: 'flying',
      spend: emptyBondSpend(1),
    });
    expect(flying.errors).toEqual([]);
    expect(flying.movementM).toBe(8);
    expect(flying.attackDice).toBe(BASE_SUMMON.attackDice);
    expect(flying.tokensAvailable).toBe(8);
    expect(flying.bodies[0].hp).toBe(10);

    const swim = computeSummonBond({
      boundStoneCount: 1,
      movementMode: 'swimming',
      spend: emptyBondSpend(1),
    });
    expect(swim.movementM).toBe(8);
  });

  it('supports Climbing as its own Movement Mode at base 8 m', () => {
    const c = computeSummonBond({
      boundStoneCount: 1,
      movementMode: 'climbing' as any,
      spend: emptyBondSpend(1),
    });
    expect(c.errors).toEqual([]);
    expect(c.movementM).toBe(8);
  });

  it('caps movement at 16 m', () => {
    const spend = emptyBondSpend(1);
    spend.movementPurchases = 10; // would be 28 m
    const c = computeSummonBond({
      boundStoneCount: 10,
      movementMode: 'walking',
      spend,
    });
    expect(c.errors.some((e) => e.includes('exceeds cap'))).toBe(true);
    expect(c.movementM).toBe(SUMMON_CAPS.maxMovementM);
  });

  it('does not grant extra attacks from additional bodies', () => {
    const spend = emptyBondSpend(3); // 1 + 2 additional
    const c = computeSummonBond({
      boundStoneCount: 4,
      movementMode: 'walking',
      spend,
    });
    expect(c.bodyCount).toBe(3);
    expect(c.summonAttacks).toBe(1);
    expect(c.tokensSpent).toBe(2 * SUMMON_CAPS.extraBodyTokenCost);
  });

  it('charges Extra Attack separately (8 tokens)', () => {
    const spend = emptyBondSpend(1);
    spend.extraAttackPurchases = 1;
    const c = computeSummonBond({
      boundStoneCount: 2,
      movementMode: 'walking',
      spend,
    });
    expect(c.summonAttacks).toBe(2);
    expect(c.tokensSpent).toBe(8);
  });
});

describe('migrateFamiliarToBond', () => {
  it('preserves stones and marks redistribution', () => {
    const bond = migrateFamiliarToBond(
      {
        id: 'fam-1',
        name: 'Owl',
        img: '',
        movementType: 'flying',
        ownerActorId: 'actor-1',
        baseStone: { attribute: 'wits' },
        upgradeStones: [{ id: 'u1', attribute: 'agility', picks: ['hp', 'evade'] }],
        sharedSenses: [],
        boundStoneCount: 2,
        stats: { hp: 22, armor: 0, evade: 8, attack: '2d8', damage: '1d8', movementM: 12 },
        size: 'Tiny',
        locked: false,
      } as any,
      'actor-1',
    );
    expect(bond.boundStoneCount).toBe(2);
    expect(bond.movementMode).toBe('flying');
    expect(bond.needsRedistribution).toBe(true);
    expect(summonTokensFromStones(bond.boundStoneCount)).toBe(16);
  });
});
