/**
 * DF Core v0.9.9.1 parity. These lock the rules the 0.9.589 pass left open.
 */
import { describe, expect, it } from 'vitest';
import {
  activeTemplateCanBeSpell,
  canLearnAnotherSpeciallessSpell,
  countSpeciallessSpells,
  powerIdentityKey,
  speciallessSpellLimit,
} from '../src/utils/power-catalog.js';
import { masteryRankFromLifetimeXp } from '../src/utils/mastery-rank-sync.js';
import {
  permanentStonesFromLifetimeXp,
  stoneConcentrationCap,
} from '../src/progression/v099-rules.js';
import { highestExtraAttackGrant } from '../src/combat/action-economy.js';
import { computeParryRecovery } from '../src/combat/parry-recovery.js';
import { buildReflectionFormula } from '../src/combat/parry.js';
import { evaluateReactionEligibility, reactionMayRepeatThisRound } from '../src/combat/reaction-eligibility.js';
import { aoeCreatureNormalTn } from '../src/combat/aoe-melee-resolution.js';
import { castingBaseTnForMasteryRank } from '../src/combat/spell-roll-handler.js';
import { spellResistanceAfterPenetration } from '../src/combat/target-defenses.js';
import {
  noteSplitSpellRoll,
  resetSplitSpellRolls,
  splitSpellShouldStress,
} from '../src/combat/split-spell-stress.js';
import {
  markZoneApplied,
  zoneAlreadyApplied,
  zoneApplicationOutcome,
  zoneCreationOutcome,
} from '../src/combat/spell-zones.js';
import { critAppliesToAttackRoll } from '../src/combat/critical-resolution.js';
import { applySpecialBoostToLabel } from '../src/combat/special-boost.js';

const ctx = {
  phase: 'defender' as const,
  hit: false,
  rangeToAttackerM: 1,
};

describe('special-less Spell cap', () => {
  it('allows a ranged heal with no Special and rejects melee', () => {
    expect(activeTemplateCanBeSpell('active-ranged-single-heal')).toBe(true);
    expect(activeTemplateCanBeSpell('active-melee-single-heal')).toBe(false);
  });

  it('caps special-less Spells at Mastery Rank and ignores Spells that have a Special', () => {
    expect(speciallessSpellLimit(2)).toBe(2);
    expect(speciallessSpellLimit(8)).toBe(8);
    const items = [
      { system: { isSpell: true } },
      { system: { isSpell: true, chosenSpecial: { key: 'hex' } } },
      { system: { isSpell: false } },
    ];
    expect(countSpeciallessSpells(items)).toBe(1);
    expect(canLearnAnotherSpeciallessSpell(1, 2)).toBe(true);
    expect(canLearnAnotherSpeciallessSpell(2, 2)).toBe(false);
  });

  it('does not treat Spell Delivery as a second Power identity', () => {
    const martial = powerIdentityKey({ templateId: 'active-ranged-single-heal', chosenSpecial: null });
    const spell = powerIdentityKey({ templateId: 'active-ranged-single-heal', chosenSpecial: null });
    expect(spell).toBe(martial);
    expect(powerIdentityKey({
      templateId: 'active-ranged-damage-t4',
      chosenSpecial: { key: 'hex' },
    })).not.toBe(powerIdentityKey({
      templateId: 'active-ranged-damage-t4',
      chosenSpecial: { key: 'mark' },
    }));
  });
});

describe('Lifetime XP Mastery Rank and Stones', () => {
  it.each([
    [0, 2],
    [99, 2],
    [100, 3],
    [199, 3],
    [200, 4],
    [399, 4],
    [400, 5],
    [599, 5],
    [600, 6],
    [799, 6],
    [800, 7],
    [999, 7],
    [1000, 8],
    [2200, 8],
  ])('%i Lifetime XP is MR %i', (xp, mr) => {
    expect(masteryRankFromLifetimeXp(xp)).toBe(mr);
  });

  it.each([
    [0, 2],
    [100, 7],
    [200, 12],
    [400, 22],
    [600, 32],
    [800, 42],
    [1000, 52],
    [2200, 112],
  ])('%i Lifetime XP grants %i permanent Stones', (xp, stones) => {
    expect(permanentStonesFromLifetimeXp(xp)).toBe(stones);
  });

  it('caps one Attribute at Lifetime-XP Mastery Rank × 2', () => {
    expect(stoneConcentrationCap(permanentStonesFromLifetimeXp(99), 8)).toBe(4);
    expect(stoneConcentrationCap(permanentStonesFromLifetimeXp(100), 2)).toBe(6);
    expect(stoneConcentrationCap(permanentStonesFromLifetimeXp(200), 8)).toBe(8);
    expect(stoneConcentrationCap(permanentStonesFromLifetimeXp(1000), 2)).toBe(16);
  });
});

describe('Extra Attack sources do not stack', () => {
  it('keeps the highest grant', () => {
    expect(highestExtraAttackGrant([2, 1])).toBe(2);
    expect(highestExtraAttackGrant([0, 4, 1])).toBe(4);
    expect(1 + highestExtraAttackGrant([2, 1])).toBe(3);
  });
});

describe('Spell resolution helpers', () => {
  it('uses Spell Base TN and Mental Power Base TN = Spell Base + 4', () => {
    expect(castingBaseTnForMasteryRank(1)).toBe(6);
    expect(castingBaseTnForMasteryRank(8)).toBe(62);
    expect(castingBaseTnForMasteryRank(3, { mental: true })).toBe(26);
  });

  it('willing targets contribute 0 Spell Resistance and leave the base TN', () => {
    const defender = { system: { combat: { spellResistanceTotal: 12 } } };
    expect(aoeCreatureNormalTn({
      defender,
      isSpell: true,
      spellBaseTn: 22,
      willing: true,
    })).toBe(22);
    expect(aoeCreatureNormalTn({
      defender,
      isSpell: true,
      spellBaseTn: 22,
      willing: false,
    })).toBe(34);
  });

  it('Spell Penetration cannot reduce resistance below 0 or touch the base', () => {
    const target = { system: { combat: { spellResistanceTotal: 4 } } };
    const caster = { getFlag: () => ({ stoneBonuses: { spellPenetration: 16 } }) };
    expect(spellResistanceAfterPenetration(target, caster)).toBe(0);
    const base = 22;
    expect(base + spellResistanceAfterPenetration(target, caster)).toBe(22);
  });

  it('compares one AoE Casting result to each creature Final Spell TN', () => {
    const roll = 30;
    const soft = aoeCreatureNormalTn({
      defender: { system: { combat: { spellResistanceTotal: 0 } } },
      isSpell: true,
      spellBaseTn: 22,
    });
    const hard = aoeCreatureNormalTn({
      defender: { system: { combat: { spellResistanceTotal: 12 } } },
      isSpell: true,
      spellBaseTn: 22,
    });
    expect(roll >= soft).toBe(true);
    expect(roll >= hard).toBe(false);
  });
});

describe('split Spell stress', () => {
  it('stresses only when every split Casting Roll is below Spell Base TN', () => {
    resetSplitSpellRolls();
    expect(splitSpellShouldStress([10, 12], 22)).toBe(true);
    expect(splitSpellShouldStress([22, 10], 22)).toBe(false);
    expect(noteSplitSpellRoll('pair-a', 10, 22)).toBe('pending');
    expect(noteSplitSpellRoll('pair-a', 12, 22)).toBe('stress');
    resetSplitSpellRolls();
    expect(noteSplitSpellRoll('pair-b', 10, 22)).toBe('pending');
    expect(noteSplitSpellRoll('pair-b', 30, 22)).toBe('clear');
  });
});

describe('persistent Spell zones', () => {
  it('stores one Casting result and resists later without a new roll or Stress', () => {
    expect(zoneCreationOutcome(10, 22)).toBe('fizzle');
    expect(zoneCreationOutcome(22, 22)).toBe('create');
    const zone = {
      id: 'z',
      name: 'Zone',
      casterId: 'c',
      spellBaseTn: 22,
      castingTotal: 30,
      appliedByRound: {},
    };
    expect(zoneApplicationOutcome(zone.castingTotal, 22)).toBe('affect');
    expect(zoneApplicationOutcome(zone.castingTotal, 40)).toBe('resist');
    const once = markZoneApplied(zone, 'combat:1', 'goblin');
    expect(zoneAlreadyApplied(once, 'combat:1', 'goblin')).toBe(true);
    expect(zoneAlreadyApplied(once, 'combat:2', 'goblin')).toBe(false);
    expect(zone.castingTotal).toBe(30);
  });
});

describe('Parry Recovery and reflection', () => {
  it('refunds spent Parry up to the round cap without passing the entry pool', () => {
    const martial = computeParryRecovery({
      spent: 5,
      pool: 0,
      entryPool: 5,
      recoveredThisRound: 0,
      maxRecoverPerRound: 4,
    });
    expect(martial.regained).toBe(4);
    expect(martial.pool).toBe(4);
    const spell = computeParryRecovery({
      spent: 3,
      pool: martial.pool,
      entryPool: 5,
      recoveredThisRound: martial.recoveredThisRound,
      maxRecoverPerRound: 4,
    });
    expect(spell.regained).toBe(0);
    expect(spell.pool).toBe(4);
  });

  it('opens Attack Reflection for both deliveries and keeps Weapon Damage martial-only', () => {
    const weapon = { name: 'Reaction: Parry + Weapon Damage', system: { templateId: 'reaction-riposte' } };
    const reflection = { name: 'Reaction: Parry + Attack Reflection', system: { templateId: 'reaction-parry-reflection' } };
    expect(evaluateReactionEligibility(weapon, {
      ...ctx,
      hasParryThisHit: true,
      parryDelivery: 'martial',
      attackType: 'melee',
    }).shown).toBe(true);
    expect(evaluateReactionEligibility(weapon, {
      ...ctx,
      spellFullyCountered: true,
      parryDelivery: 'spell',
      attackType: 'ranged',
    }).shown).toBe(false);
    expect(evaluateReactionEligibility(reflection, {
      ...ctx,
      hasParryThisHit: true,
      parryDelivery: 'martial',
      attackType: 'melee',
    }).shown).toBe(true);
    expect(evaluateReactionEligibility(reflection, {
      ...ctx,
      spellFullyCountered: true,
      parryDelivery: 'spell',
      attackType: 'ranged',
    }).shown).toBe(true);
    expect(evaluateReactionEligibility(reflection, {
      ...ctx,
      spellFullyCountered: true,
      parryDelivery: 'spell',
      isAoE: true,
    }).shown).toBe(false);
    expect(evaluateReactionEligibility(reflection, {
      ...ctx,
      hasParryThisHit: true,
      parryDelivery: 'martial',
      spellFullyCountered: false,
    }).shown).toBe(true);
    expect(evaluateReactionEligibility(reflection, {
      ...ctx,
      hasParryThisHit: false,
      parryDelivery: 'martial',
      spellFullyCountered: true,
    }).shown).toBe(false);
    expect(reactionMayRepeatThisRound(weapon)).toBe(true);
    expect(reactionMayRepeatThisRound(reflection)).toBe(false);
  });

  it('reflects Spell Power damage and not weapon damage', () => {
    const attacker = { items: [{ type: 'weapon', system: { equipped: true, damage: '9d8' } }] };
    expect(buildReflectionFormula(0, attacker, '+2d8', { spell: true, powerDamageDice: 4 })).toBe('4d8+2d8');
    expect(buildReflectionFormula(0, attacker, '+2d8')).toBe('9d8+2d8');
  });
});

describe('Crit, Raise Focus scope, and Special Boost', () => {
  it('applies Crit to damaging attacks and Spells, not to non-damaging Spells', () => {
    expect(critAppliesToAttackRoll({ spell: false, damageDice: 0 })).toBe(true);
    expect(critAppliesToAttackRoll({ spell: true, damageDice: 3 })).toBe(true);
    expect(critAppliesToAttackRoll({ spell: true, damageDice: 0 })).toBe(false);
  });

  it('adds Special Boost to numeric Specials from either delivery', () => {
    expect(applySpecialBoostToLabel('Hex(2)', 4)).toBe('Hex(6)');
    expect(applySpecialBoostToLabel('Prone', 4)).toBe('Prone');
  });
});
