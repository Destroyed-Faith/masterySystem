import { describe, expect, it } from 'vitest';
import { computeSummonBond, emptyBondSpend, maxMovementPurchases, SUMMON_CAPS } from '../src/stones/summon-bond-rules';
import {
  applyBondFieldDelta,
  applyBodyFieldDelta,
  applyBonusTokenDelta,
  applySkillDiceAllocDelta,
  countArtifactSummonStones,
  inspectBondSpend,
  isAbsurdPurchaseRaw,
  resetIllegalPurchases,
  safePurchaseInt,
  sanitizeBonusTokens,
  type SpendClampContext,
} from '../src/stones/summon-bond-spend';
import { createEmptyBond, validateBondRitual } from '../src/stones/summon-bond-bind';

const ctx = (over: Partial<SpendClampContext> = {}): SpendClampContext => ({
  boundStoneCount: 1,
  bonusTokens: 0,
  movementMode: 'walking',
  selectedSkills: [],
  ownerSkillRatings: {},
  maxBonusTokens: 0,
  ...over,
});

describe('safePurchaseInt', () => {
  it('rejects NaN, negatives, Infinity, and huge values', () => {
    expect(safePurchaseInt(Number.NaN)).toBe(0);
    expect(safePurchaseInt(-3)).toBe(0);
    expect(safePurchaseInt(Number.POSITIVE_INFINITY)).toBe(0);
    expect(safePurchaseInt(534345)).toBe(99);
    expect(safePurchaseInt('999999')).toBe(99);
    expect(safePurchaseInt('nope')).toBe(0);
    expect(safePurchaseInt(null)).toBe(0);
  });

  it('keeps finite non-negative integers', () => {
    expect(safePurchaseInt(3)).toBe(3);
    expect(safePurchaseInt('4')).toBe(4);
    expect(safePurchaseInt(2.9)).toBe(2);
  });
});

describe('Bond upgrade steppers', () => {
  it('cannot enter arbitrary Attack or Damage purchases', () => {
    const spend = emptyBondSpend(1);
    expect(applyBondFieldDelta(spend, 'attackPurchases', 2, ctx())).toBeNull();
    const one = applyBondFieldDelta(spend, 'attackPurchases', 1, ctx());
    expect(one?.attackPurchases).toBe(1);
    const two = applyBondFieldDelta(one!, 'attackPurchases', 1, ctx());
    expect(two?.attackPurchases).toBe(2);
    // 3rd Attack purchase costs 2 more tokens; 1 stone = 8 tokens, 4 already spent
    const three = applyBondFieldDelta(two!, 'attackPurchases', 1, ctx());
    expect(three?.attackPurchases).toBe(3);
    const four = applyBondFieldDelta(three!, 'attackPurchases', 1, ctx());
    expect(four?.attackPurchases).toBe(4);
    expect(applyBondFieldDelta(four!, 'attackPurchases', 1, ctx())).toBeNull();
  });

  it('disables plus when remaining tokens are insufficient', () => {
    const spend = emptyBondSpend(1);
    spend.attackPurchases = 4; // 8 tokens
    expect(applyBondFieldDelta(spend, 'damagePurchases', 1, ctx())).toBeNull();
    expect(applyBodyFieldDelta(spend, 0, 'hpPurchases', 1, ctx())).toBeNull();
    expect(applyBodyFieldDelta(spend, 0, 'armorPurchases', 1, ctx())).toBeNull();
    expect(applyBodyFieldDelta(spend, 0, 'evadePurchases', 1, ctx())).toBeNull();
  });

  it('caps walking/swimming movement at 4 purchases (16 m) and flying at 6', () => {
    expect(maxMovementPurchases('walking')).toBe(4);
    expect(maxMovementPurchases('swimming')).toBe(4);
    expect(maxMovementPurchases('flying')).toBe(6);

    const walk = emptyBondSpend(1);
    walk.movementPurchases = 4;
    expect(applyBondFieldDelta(walk, 'movementPurchases', 1, ctx({ boundStoneCount: 4 }))).toBeNull();

    const fly = emptyBondSpend(1);
    fly.movementPurchases = 6;
    expect(applyBondFieldDelta(fly, 'movementPurchases', 1, ctx({ boundStoneCount: 4, movementMode: 'flying' }))).toBeNull();
    const fly5 = emptyBondSpend(1);
    fly5.movementPurchases = 5;
    expect(applyBondFieldDelta(fly5, 'movementPurchases', 1, ctx({ boundStoneCount: 4, movementMode: 'flying' }))?.movementPurchases).toBe(6);
  });

  it('caps Extra Attack at 2 purchases (3 total Bond Attacks)', () => {
    const spend = emptyBondSpend(1);
    const one = applyBondFieldDelta(spend, 'extraAttackPurchases', 1, ctx({ boundStoneCount: 3 }));
    expect(one?.extraAttackPurchases).toBe(1);
    const two = applyBondFieldDelta(one!, 'extraAttackPurchases', 1, ctx({ boundStoneCount: 3 }));
    expect(two?.extraAttackPurchases).toBe(2);
    expect(applyBondFieldDelta(two!, 'extraAttackPurchases', 1, ctx({ boundStoneCount: 3 }))).toBeNull();
  });

  it('never lets remaining tokens go negative through a legal step', () => {
    let spend = emptyBondSpend(1);
    const fields = ['attackPurchases', 'damagePurchases', 'movementPurchases', 'skillDicePurchases', 'additionalBodies'] as const;
    for (const field of fields) {
      for (let i = 0; i < 20; i++) {
        const next = applyBondFieldDelta(spend, field, 1, ctx({ boundStoneCount: 1 }));
        if (!next) break;
        spend = next;
        const rem = computeSummonBond({
          boundStoneCount: 1,
          movementMode: 'walking',
          spend,
        }).tokensRemaining;
        expect(rem).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('caps Skill Dice by remaining tokens and selected skill capacity', () => {
    const spend = emptyBondSpend(1);
    const limited = ctx({
      boundStoneCount: 2,
      selectedSkills: ['perception'],
      ownerSkillRatings: { perception: 2 },
    });
    const one = applyBondFieldDelta(spend, 'skillDicePurchases', 1, limited);
    expect(one?.skillDicePurchases).toBe(1);
    expect(applyBondFieldDelta(one!, 'skillDicePurchases', 1, limited)).toBeNull();
  });

  it('clamps skill allocation to owner rating and purchased dice', () => {
    expect(applySkillDiceAllocDelta({}, 'perception', 1, 4, 2)?.perception).toBe(1);
    expect(applySkillDiceAllocDelta({ perception: 2 }, 'perception', 1, 4, 2)).toBeNull();
    expect(applySkillDiceAllocDelta({ perception: 4 }, 'perception', 1, 4, 8)).toBeNull();
    expect(applySkillDiceAllocDelta({ perception: 0 }, 'perception', -1, 4, 2)).toBeNull();
  });

  it('shrinks additional bodies without inventing spend rows', () => {
    const spend = emptyBondSpend(3);
    spend.bodies[2].hpPurchases = 2;
    const down = applyBondFieldDelta(spend, 'additionalBodies', -1, ctx({ boundStoneCount: 4 }));
    expect(down?.additionalBodies).toBe(1);
    expect(down?.bodies).toHaveLength(2);
    expect(down?.bodies[0]).toEqual(spend.bodies[0]);
  });
});

describe('Artifact bonus Tokens', () => {
  it('is always a multiple of 4 and cannot create a Bond', () => {
    expect(sanitizeBonusTokens(7, 16)).toBe(4);
    expect(sanitizeBonusTokens(999999, 8)).toBe(8);
    expect(applyBonusTokenDelta(0, 1, 8, 0)).toBeNull();
    expect(applyBonusTokenDelta(0, 1, 8, 1)).toBe(4);
    expect(applyBonusTokenDelta(8, 1, 8, 1)).toBeNull();
    expect(applyBonusTokenDelta(4, -1, 8, 1)).toBe(0);
  });

  it('counts Artifact Summon Stones from actor items and flags', () => {
    const actor = {
      system: {},
      items: [
        { type: 'artifact', name: 'Crystal Summon Stone', system: { quantity: 1 } },
        { type: 'artifact', name: 'Sword', system: { artifactSummonStones: 2 } },
        { type: 'weapon', name: 'Summon Stone Fake', system: {} },
      ],
    };
    expect(countArtifactSummonStones(actor)).toBe(3);
  });
});

describe('legacy illegal purchases', () => {
  it('detects absurd values and does not preview million-dice attacks', () => {
    const spend = emptyBondSpend(1);
    spend.attackPurchases = 534345;
    spend.damagePurchases = 345345345;
    const report = inspectBondSpend(spend, ctx());
    expect(report.illegal).toBe(true);
    expect(report.absurd).toBe(true);
    expect(isAbsurdPurchaseRaw(534345)).toBe(true);

    const preview = computeSummonBond({
      boundStoneCount: 1,
      movementMode: 'walking',
      spend,
    });
    expect(preview.attackDice).toBeLessThan(30);
    expect(preview.damageDice).toBeLessThan(20);
    expect(preview.errors.length).toBeGreaterThan(0);
  });

  it('reset illegal purchases zeros purchase counts', () => {
    const spend = emptyBondSpend(2);
    spend.attackPurchases = 534345;
    spend.bodies[0].hpPurchases = 999;
    const reset = resetIllegalPurchases(spend);
    expect(reset.attackPurchases).toBe(0);
    expect(reset.additionalBodies).toBe(0);
    expect(reset.bodies).toHaveLength(1);
    expect(reset.bodies[0].hpPurchases).toBe(0);
  });

  it('keeps Apply disabled for over-budget imported data', () => {
    const bond = createEmptyBond({
      name: 'Legacy',
      ownerActorId: 'Actor.1',
      movementMode: 'walking',
      stoneAttributes: ['might'],
    });
    bond.spend.attackPurchases = 40;
    const v = validateBondRitual(bond);
    expect(v.ok).toBe(false);
    expect(v.overBudget || v.errors.length > 0).toBe(true);
  });

  it('rejects NaN / Infinity bonus and non-multiples of 4', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'Actor.1',
      movementMode: 'walking',
      stoneAttributes: ['wits'],
    });
    bond.bonusTokens = 7;
    const v = validateBondRitual(bond, {}, 1, { maxBonusTokens: 4 });
    expect(v.ok).toBe(false);
  });
});

describe('computeSummonBond preview clamp', () => {
  it('never renders absurd Attack/Damage dice from huge purchases', () => {
    const spend = emptyBondSpend(1);
    spend.attackPurchases = 1068692;
    spend.damagePurchases = 345345346;
    const c = computeSummonBond({ boundStoneCount: 2, movementMode: 'walking', spend });
    expect(c.attackDice).toBe(BASE_FROM_TOKENS_ATTACK);
    expect(c.damageDice).toBe(BASE_FROM_TOKENS_DAMAGE);
  });
});

const BASE_FROM_TOKENS_ATTACK = 2 + Math.floor(16 / SUMMON_CAPS.attackTokenCost) * SUMMON_CAPS.attackDiceGain;
const BASE_FROM_TOKENS_DAMAGE = 1 + Math.floor(16 / SUMMON_CAPS.damageTokenCost) * SUMMON_CAPS.damageDiceGain;
