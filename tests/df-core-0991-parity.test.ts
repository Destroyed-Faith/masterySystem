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
import { getRulesMasteryRank, masteryRankFromLifetimeXp } from '../src/utils/mastery-rank-sync.js';
import {
  canConvertToPermanentColorless,
  canPlacePermanentStone,
  emptyAssignments,
  permanentColorlessCap,
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
  appendSpellZone,
  createPersistentSpellZone,
  markZoneApplied,
  removeSpellZone,
  retainActiveSpellZones,
  spellZonesEntered,
  writeSpellZones,
  zoneAlreadyApplied,
  zoneApplicationOutcome,
  zoneCreationOutcome,
  type PersistentSpellZone,
} from '../src/combat/spell-zones.js';
import { activeBuffDurationRounds } from '../src/utils/active-buffs.js';
import { getSkillRollDicePool } from '../src/dice/roll-context-build.js';
import { getMasteryRank as basicAttackMasteryRank } from '../src/combat/basic-combat.js';
import { actorMasteryRank } from '../src/combat/special-application.js';
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

function spellZone(partial: Partial<PersistentSpellZone> & Pick<PersistentSpellZone, 'id' | 'castingTotal'>): PersistentSpellZone {
  return createPersistentSpellZone({
    name: partial.name ?? partial.id,
    casterId: 'caster',
    spellBaseTn: 22,
    sourceMasteryRank: 3,
    powerId: partial.id,
    durationNote: '3 rounds',
    createdRound: 1,
    centerX: 0,
    centerY: 0,
    radiusMeters: 4,
    ...partial,
  });
}

describe('persistent Spell zones', () => {
  it('stores one Casting result and resists later without a new roll or Stress', () => {
    expect(zoneCreationOutcome(10, 22)).toBe('fizzle');
    expect(zoneCreationOutcome(22, 22)).toBe('create');
    const zone = spellZone({ id: 'z', castingTotal: 30, name: 'Zone' });
    expect(zone.castingTotal).toBe(30);
    expect(zone.powerId).toBe('z');
    expect(zone.expiresAfterRound).toBe(3);
    expect(zoneApplicationOutcome(zone.castingTotal, 22)).toBe('affect');
    expect(zoneApplicationOutcome(zone.castingTotal, 40)).toBe('resist');
    const once = markZoneApplied(zone, 'combat:1', 'goblin');
    expect(zoneAlreadyApplied(once, 'combat:1', 'goblin')).toBe(true);
    expect(zoneAlreadyApplied(once, 'combat:2', 'goblin')).toBe(false);
    expect(zone.castingTotal).toBe(30);
  });

  it('keeps a separate Casting result on every zone from the same caster', () => {
    const zoneA = spellZone({ id: 'a', name: 'Zone A', castingTotal: 31, centerX: 0, powerId: 'power-a' });
    const zoneB = spellZone({
      id: 'b',
      name: 'Zone B',
      castingTotal: 47,
      centerX: 100,
      powerId: 'power-b',
      createdRound: 2,
    });
    const both = appendSpellZone([zoneA], zoneB);
    expect(both.map((zone) => zone.castingTotal)).toEqual([31, 47]);
    expect(zoneA.castingTotal).toBe(31);

    const enteredA = spellZonesEntered(both, {
      x: 0,
      y: 0,
      roundKey: 'combat:2',
      creatureId: 'goblin',
      spellResistance: 0,
      distanceMeters: (x) => Math.abs(x),
    });
    expect(enteredA).toEqual([
      expect.objectContaining({ zoneId: 'a', castingTotal: 31, outcome: 'affect', finalTn: 22 }),
    ]);

    const enteredB = spellZonesEntered(both, {
      x: 100,
      y: 0,
      roundKey: 'combat:2',
      creatureId: 'goblin',
      spellResistance: 0,
      distanceMeters: (x) => Math.abs(x - 100),
    });
    expect(enteredB).toEqual([
      expect.objectContaining({ zoneId: 'b', castingTotal: 47, outcome: 'affect', finalTn: 22 }),
    ]);
    expect(both.find((zone) => zone.id === 'a')?.castingTotal).toBe(31);
  });

  it('does not scan the scene for a zone that has no stored center', () => {
    let scans = 0;
    const hits = spellZonesEntered(
      [spellZone({ id: 'loose', castingTotal: 40, centerX: null, centerY: null, radiusMeters: 0 })],
      {
        x: 0,
        y: 0,
        roundKey: 'combat:1',
        creatureId: 'goblin',
        spellResistance: 0,
        distanceMeters: () => {
          scans += 1;
          return 0;
        },
      },
    );
    expect(hits).toEqual([]);
    expect(scans).toBe(0);
  });

  it('removing or expiring one zone leaves the other Casting result', () => {
    const zoneA = spellZone({ id: 'a', castingTotal: 31, durationNote: '1 rounds', createdRound: 1 });
    const zoneB = spellZone({ id: 'b', castingTotal: 47, durationNote: null, createdRound: 1 });
    expect(zoneA.expiresAfterRound).toBe(1);
    expect(zoneB.expiresAfterRound).toBeNull();
    const removed = removeSpellZone([zoneA, zoneB], 'a');
    expect(removed.map((zone) => [zone.id, zone.castingTotal])).toEqual([['b', 47]]);
    const expired = retainActiveSpellZones([zoneA, zoneB], 2);
    expect(expired.map((zone) => [zone.id, zone.castingTotal])).toEqual([['b', 47]]);
  });

  it('compares the stored zone result to Spell Resistance at the moment of entry', () => {
    const zone = spellZone({ id: 'a', castingTotal: 31 });
    const low = spellZonesEntered([zone], {
      x: 0,
      y: 0,
      roundKey: 'combat:1',
      creatureId: 'goblin',
      spellResistance: 0,
      distanceMeters: () => 0,
    });
    const high = spellZonesEntered([zone], {
      x: 0,
      y: 0,
      roundKey: 'combat:1',
      creatureId: 'goblin',
      spellResistance: 20,
      distanceMeters: () => 0,
    });
    expect(low[0]).toMatchObject({ castingTotal: 31, finalTn: 22, outcome: 'affect' });
    expect(high[0]).toMatchObject({ castingTotal: 31, finalTn: 42, outcome: 'resist' });
    expect(zone.castingTotal).toBe(31);
  });

  it('replaces the stored zone list instead of merging over an earlier Casting result', async () => {
    const zoneA = spellZone({ id: 'a', castingTotal: 31 });
    const zoneB = spellZone({ id: 'b', castingTotal: 47 });
    const actor: any = {
      flags: { 'mastery-system': { spellZones: [zoneA] } },
      async unsetFlag() {
        delete this.flags['mastery-system'].spellZones;
      },
      async setFlag(_scope: string, _key: string, value: PersistentSpellZone[]) {
        const existing = this.flags['mastery-system'].spellZones;
        if (Array.isArray(existing)) {
          const merged = existing.map((zone: PersistentSpellZone, index: number) => ({
            ...zone,
            ...(value[index] ?? {}),
          }));
          this.flags['mastery-system'].spellZones = merged.concat(value.slice(existing.length));
          return;
        }
        this.flags['mastery-system'].spellZones = value;
      },
    };
    await writeSpellZones(actor, appendSpellZone(readZones(actor), zoneB));
    expect(actor.flags['mastery-system'].spellZones.map((zone: PersistentSpellZone) => zone.castingTotal)).toEqual([31, 47]);
    await writeSpellZones(actor, removeSpellZone(actor.flags['mastery-system'].spellZones, 'a'));
    expect(actor.flags['mastery-system'].spellZones).toHaveLength(1);
    expect(actor.flags['mastery-system'].spellZones[0].castingTotal).toBe(47);
  });
});

function readZones(actor: any): PersistentSpellZone[] {
  return actor.flags['mastery-system'].spellZones ?? [];
}

describe('Lifetime XP is the only mechanical Mastery Rank', () => {
  const mismatched = {
    system: {
      mastery: { rank: 2 },
      progression: { lifetimeXp: 100 },
      attributes: { might: { value: 4 } },
    },
  };

  it('resolves a stored MR2 with 100 Lifetime XP as MR3', () => {
    expect(getRulesMasteryRank(mismatched)).toBe(3);
    expect(castingBaseTnForMasteryRank(getRulesMasteryRank(mismatched))).toBe(22);
    expect(speciallessSpellLimit(getRulesMasteryRank(mismatched))).toBe(3);
    expect(stoneConcentrationCap(2, 2, 100)).toBe(6);
    expect(permanentColorlessCap(getRulesMasteryRank(mismatched))).toBe(3);
    expect(activeBuffDurationRounds(mismatched)).toBe(3);
    expect(getSkillRollDicePool(mismatched as any, 'not-a-skill', 'might').keepDice).toBe(3);
    expect(basicAttackMasteryRank(mismatched)).toBe(3);
    expect(actorMasteryRank(mismatched)).toBe(3);
  });

  it('uses Lifetime XP for the attribute cap and the Permanent Colorless cap', () => {
    const assignments = { ...emptyAssignments(), might: 5 };
    expect(canPlacePermanentStone({
      attribute: 'might',
      assignments,
      totalPermanent: 7,
      storedRank: 2,
      lifetimeXp: 100,
    }).ok).toBe(true);
    expect(canPlacePermanentStone({
      attribute: 'might',
      assignments,
      totalPermanent: 7,
      storedRank: 2,
      lifetimeXp: 0,
    }).ok).toBe(false);
    expect(canConvertToPermanentColorless({
      assignments: emptyAssignments(),
      totalPermanent: 6,
      permanentColorless: 2,
      storedRank: 2,
      lifetimeXp: 100,
    })).toMatchObject({ ok: true, masteryRank: 3, cap: 3 });
    expect(canConvertToPermanentColorless({
      assignments: emptyAssignments(),
      totalPermanent: 6,
      permanentColorless: 2,
      storedRank: 2,
    }).ok).toBe(false);
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
