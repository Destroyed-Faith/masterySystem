/**
 * v0.9.9.0 pool-compression sync.
 * Catalogue ranks for Challenge / Disoriented / Soulburn / Weaken, the new
 * Parry curves, and the values that must stay on their own scales.
 */
import { describe, expect, it } from 'vitest';
import { getTemplate } from '../src/utils/powers/index.js';
import {
  activeBuffSpecialIncrease,
  bindPoolSpecialsOnRow,
  isPoolReducingSpecial,
  poolSpecialRankOverride,
  reactionSpecialIncrease,
} from '../src/utils/powers/pool-special-ranks.js';
import { passiveDamageNegationReserveForLevel, passiveParryPoolForLevel } from '../src/utils/powers/templates/passives.js';
import { STONE_POWERS } from '../src/stones/stone-powers.js';
import { computeParryStrip } from '../src/combat/parry.js';
import { calculateHealthBarMax, calculateStressBarMax, passiveSkillValue } from '../src/utils/calculations.js';
import { MINOR_EXPRESSION_TIERS, tierThresholdForAttributeValue } from '../src/utils/minor-expressions.js';
import { ADDICTION_SKILL_DICE_PENALTIES, DISADVANTAGES } from '../src/system/disadvantages.js';
import { ECHO_ARTIFACTS } from '../src/utils/echo-artifacts.js';

function boundRank(templateId: string, key: string, level: number): number | undefined {
  const tpl = getTemplate(templateId);
  const row = tpl?.levels?.[String(level) as '1'];
  if (!row) return undefined;
  const bound = bindPoolSpecialsOnRow(row, key, templateId, level);
  return bound.specials?.find((s) => s.key === key)?.rank;
}

describe('Stone Ability Parry', () => {
  const parry = STONE_POWERS['might.parry'];

  it('starts at Tier 2 with +2 / +4 / +6 and no Tier 1', () => {
    expect(parry.startsAtTier).toBe(2);
    expect(parry.tiers).toHaveLength(3);
    expect(parry.tiers.map((t) => t.value)).toEqual([2, 4, 6]);
    expect(parry.tiers.some((t) => /tier 1/i.test(t.label))).toBe(false);
  });

  it('Fully Parried still fires when the Attack Pool is reduced to zero', () => {
    expect(computeParryStrip(6, 6).fullyParried).toBe(true);
    expect(computeParryStrip(6, 6).remainingDice).toBe(0);
    expect(computeParryStrip(0, 4).fullyParried).toBe(false);
  });
});

describe('pool-reducing Special ranks', () => {
  it('uses the printed Challenge / Disoriented / Soulburn / Weaken tables', () => {
    expect(boundRank('active-melee-damage-t5', 'challenge', 1)).toBe(1);
    expect(boundRank('active-melee-damage-t5', 'challenge', 6)).toBe(3);
    expect(boundRank('active-melee-damage-t5', 'challenge', 16)).toBe(5);
    expect(boundRank('active-ranged-damage-t5', 'challenge', 3)).toBe(1);
    expect(boundRank('active-ranged-damage-t5', 'challenge', 16)).toBe(5);
    expect(boundRank('active-melee-damage-t6', 'disoriented', 2)).toBe(1);
    expect(boundRank('active-melee-damage-t6', 'soulburn', 11)).toBe(4);
    expect(boundRank('active-melee-damage-t6', 'weaken', 16)).toBe(5);
    expect(boundRank('active-ranged-damage-t6', 'weaken', 4)).toBe(1);
    expect(boundRank('active-ranged-damage-t6', 'disoriented', 16)).toBe(4);
    expect(boundRank('active-melee-aoe-damage-t5', 'challenge', 1)).toBe(1);
    expect(boundRank('active-melee-aoe-damage-t5', 'challenge', 16)).toBe(4);
    expect(boundRank('active-ranged-aoe-damage-t5', 'challenge', 6)).toBe(2);
    expect(boundRank('active-ranged-aoe-damage-t5', 'challenge', 16)).toBe(3);
    expect(boundRank('active-melee-aoe-damage-t6', 'soulburn', 5)).toBe(2);
    expect(boundRank('active-melee-aoe-damage-t6', 'weaken', 16)).toBe(4);
    expect(boundRank('active-ranged-aoe-damage-t6', 'disoriented', 7)).toBe(2);
    expect(boundRank('active-ranged-aoe-damage-t6', 'soulburn', 16)).toBe(3);
    expect(poolSpecialRankOverride('active-ranged-zone-t5', 'challenge', 1)).toBeNull();
    expect(poolSpecialRankOverride('active-ranged-zone-t5', 'challenge', 2)).toBeNull();
    expect(boundRank('active-ranged-zone-t5', 'challenge', 3)).toBe(1);
    expect(boundRank('active-ranged-zone-t5', 'challenge', 11)).toBe(2);
    expect(boundRank('active-ranged-zone-t6', 'weaken', 3)).toBe(1);
    expect(boundRank('active-ranged-zone-t6', 'disoriented', 14)).toBe(2);
  });

  it('does not halve Expose, Corrode, Hex, or Sundered', () => {
    expect(isPoolReducingSpecial('expose')).toBe(false);
    expect(isPoolReducingSpecial('corrode')).toBe(false);
    expect(boundRank('active-melee-damage-t5', 'corrode', 1)).toBe(2);
    expect(boundRank('active-melee-damage-t5', 'hex', 2)).toBe(3);
    expect(boundRank('active-melee-damage-t5', 'sundered', 16)).toBe(11);
    expect(boundRank('active-melee-damage-t6', 'expose', 1)).toBe(1);
    expect(boundRank('active-melee-damage-t6', 'expose', 2)).toBe(3);
    expect(boundRank('active-ranged-damage-t5', 'corrode', 1)).toBe(1);
    expect(boundRank('active-ranged-damage-t5', 'root', 1)).toBe(2);
    expect(boundRank('active-melee-aoe-damage-t6', 'expose', 1)).toBe(2);
    expect(boundRank('active-ranged-aoe-damage-t6', 'expose', 16)).toBe(7);
  });
});

describe('Special Increase curves stay split', () => {
  it('Active Buff uses the wider curve and a smaller pool-special curve', () => {
    expect(activeBuffSpecialIncrease(3)).toBe(0);
    expect(activeBuffSpecialIncrease(4, 'expose')).toBe(1);
    expect(activeBuffSpecialIncrease(8, 'hex')).toBe(2);
    expect(activeBuffSpecialIncrease(8, 'challenge')).toBe(1);
    expect(activeBuffSpecialIncrease(12, 'corrode')).toBe(3);
    expect(activeBuffSpecialIncrease(12, 'weaken')).toBe(2);
    expect(activeBuffSpecialIncrease(16, 'sundered')).toBe(4);
    expect(activeBuffSpecialIncrease(16, 'soulburn')).toBe(2);
    const row = getTemplate('ab-special-overdrive')?.levels?.['8'];
    expect(row?.mechanics?.modifySpecial?.amount).toBe(2);
    expect(row?.mechanics?.modifySpecial?.poolAmount).toBe(1);
  });

  it('Reaction uses its own narrower curve', () => {
    expect(reactionSpecialIncrease(7, 'expose')).toBe(1);
    expect(reactionSpecialIncrease(8, 'hex')).toBe(2);
    expect(reactionSpecialIncrease(8, 'disoriented')).toBe(1);
    expect(reactionSpecialIncrease(15, 'challenge')).toBe(1);
    expect(reactionSpecialIncrease(16, 'corrode')).toBe(3);
    expect(reactionSpecialIncrease(16, 'weaken')).toBe(2);
    const row = getTemplate('reaction-special-increase')?.levels?.['16'];
    expect(row?.mechanics?.modifySpecial?.amount).toBe(3);
    expect(row?.mechanics?.modifySpecial?.poolAmount).toBe(2);
  });

  it('Passive Special Aura stays +1', () => {
    const row = getTemplate('passive-special-aura')?.levels?.['8'];
    expect(row?.mechanics?.modifySpecial?.amount).toBe(1);
    expect(row?.mechanics?.modifySpecial?.poolAmount).toBeUndefined();
  });
});

describe('Parry Recovery and Passive Parry', () => {
  it('Parry Recovery is 1 per Power Level, not 2', () => {
    const low = getTemplate('ab-reinforced-parry')?.levels?.['1'];
    const high = getTemplate('ab-reinforced-parry')?.levels?.['16'];
    expect(low?.effect?.text).toContain('**1**');
    expect(high?.effect?.text).toContain('**16**');
    expect(low?.effect?.text).not.toContain('**2**');
  });

  it('Passive Parry follows the printed ceil(5 × Level / 2) table', () => {
    expect(passiveParryPoolForLevel(1)).toBe(3);
    expect(passiveParryPoolForLevel(4)).toBe(10);
    expect(passiveParryPoolForLevel(8)).toBe(20);
    expect(passiveParryPoolForLevel(12)).toBe(30);
    expect(passiveParryPoolForLevel(16)).toBe(40);
    expect(getTemplate('passive-parry')?.levels?.['16']?.effect?.text).toContain('**40**');
  });
});

describe('scales that were not compressed', () => {
  it('keeps Damage Negation, Health, Stress, and Passive Skill Value', () => {
    expect(passiveDamageNegationReserveForLevel(1)).toBe(4);
    expect(passiveDamageNegationReserveForLevel(16)).toBe(64);
    expect(STONE_POWERS['vitality.damageNegation'].tiers.map((t) => t.value)).toEqual([4, 8, 12]);
    expect(calculateHealthBarMax(7)).toBe(28);
    expect(calculateStressBarMax(4, 3)).toBe(14);
    expect(passiveSkillValue(6)).toBe(12);
  });

  it('keeps Split Attack as a pool division with no Attribute-80 cap', () => {
    const split = getTemplate('active-melee-weapon-split');
    expect(split?.levels?.['1']?.mechanics?.splitAttack).toBe(true);
    expect(JSON.stringify(split)).not.toMatch(/attribute.{0,12}80/i);
  });

  it('unlocks Minor Expressions only at 4 / 8 / 12 / 16 / 20', () => {
    expect([...MINOR_EXPRESSION_TIERS]).toEqual([4, 8, 12, 16, 20]);
    expect(tierThresholdForAttributeValue(3)).toBeNull();
    expect(tierThresholdForAttributeValue(4)).toBe(4);
    expect(tierThresholdForAttributeValue(11)).toBe(8);
    expect(tierThresholdForAttributeValue(20)).toBe(20);
  });

  it('uses the compressed Addiction Skill-pool penalties', () => {
    expect(ADDICTION_SKILL_DICE_PENALTIES).toEqual({
      oneDay: 1,
      oneWeek: 2,
      oneMonth: 4,
      threeMonths: 8,
    });
    const addiction = DISADVANTAGES.find((d) => d.id === 'addiction');
    expect(addiction?.effect).toContain('−1d8');
    expect(addiction?.effect).toContain('−8d8');
    expect(addiction?.effect).not.toMatch(/TN \d+/);
  });
});

describe('Not a Target support', () => {
  it('does not tell the player to pay a Tier 1 that does not exist', () => {
    const chain = ECHO_ARTIFACTS.ringchainOfKeptNames;
    const sight = chain.levelProgression.filter((row) => row.name.startsWith('Kept from Sight'));
    expect(sight.map((row) => row.effect).join('\n')).not.toMatch(/Tier 1 must still be paid/);
    expect(sight[0]?.effect).toContain('begins at Tier 2');
    expect(chain.extraStoneFunctions?.[0]?.supportStages).toEqual([1, 5, 9]);
    expect(STONE_POWERS['influence.notATarget'].startsAtTier).toBe(2);
  });
});
