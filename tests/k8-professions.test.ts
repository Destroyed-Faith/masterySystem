import { describe, expect, it } from 'vitest';
import { computePerceptionTn } from '../src/combat/perception-gate.js';
import {
  applyProfessionMappingDrafts,
  planProfessionMapping,
} from '../src/migrations/profession-mapping-plan.js';
import { resolveComparativeSkillCheck, stealthBeatsObserver } from '../src/rules/comparative-skill-check.js';
import { safeHavenScarBarsRecovered } from '../src/rules/fear-health.js';
import { ritualTrainingModifiers } from '../src/rules/ritual-tn.js';
import { planSpecializationRoll } from '../src/rules/specialization-roll.js';
import {
  professionIdentityKey,
  readActorSpecializations,
  summonSkillDiceCap,
  validateSpecializationList,
} from '../src/rules/specializations.js';
import { skillAdvantageRerollMax } from '../src/rules/skill-advantage.js';

function actorWithPerceptionFlag(flag: Record<string, unknown>) {
  const flags: Record<string, any> = { 'mastery-system': { perceptionCombat: { ...flag } } };
  return {
    id: 'a',
    name: 'A',
    flags,
    system: { mastery: { rank: 3 }, health: { currentBar: 0, bars: [{ name: 'Healthy' }] } },
    items: [],
    getFlag(_s: string, key: string) {
      return flags['mastery-system']?.[key];
    },
  };
}

describe('K8 Professions', () => {
  it('stores a custom Profession without a catalogue id or Field', () => {
    const record = {
      id: professionIdentityKey('Night Courier'),
      name: 'Night Courier',
      origin: 'Ran messages through Karaveth after dark.',
      scope: 'City routes, quiet doors, and who pays for silence.',
      rank: 2,
    };
    expect(record.id).toBe('profession:night courier');
    const read = readActorSpecializations({ specializations: [record] });
    expect(read[0]).toMatchObject(record);
    expect(read[0]?.field).toBeUndefined();
    expect(validateSpecializationList([
      record,
      { id: professionIdentityKey('Woodcutter'), name: 'Woodcutter', origin: 'Grew up felling timber.', scope: 'Trees, camps, and hauling lumber.', rank: 2 },
      { id: professionIdentityKey('Courtier'), name: 'Courtier', origin: 'Served a minor house.', scope: 'Favors, ceremony, and palace gossip.', rank: 2 },
      { id: professionIdentityKey('Field Medic'), name: 'Field Medic', origin: 'Tended a company wounded.', scope: 'Practical wound care and safe-haven aftercare.', rank: 2 },
    ], { requireStartingBudget: true }).ok).toBe(true);
  });

  it('Rank 2 rerolls initial 1s–2s and does not add Pool or Keep', () => {
    expect(skillAdvantageRerollMax(2)).toBe(2);
    const plan = planSpecializationRoll({
      rank: 2,
      attributeValue: 4,
      masteryRank: 2,
      baseTn: 8,
    });
    expect(plan.ok).toBe(true);
    expect(plan.numDice).toBe(4);
    expect(plan.keepDice).toBe(2);
    expect(plan.rollDisadvantage).toBe(false);
    expect(plan.skillAdvantageRerollMax).toBe(2);
  });

  it('untrained work uses Attribute k MR, Disadvantage, and no Raises', () => {
    const plan = planSpecializationRoll({
      rank: 0,
      attributeValue: 4,
      masteryRank: 2,
      baseTn: 8,
      paidRaises: 1,
    });
    expect(plan.rollDisadvantage).toBe(true);
    expect(plan.ok).toBe(false);
    expect(plan.numDice).toBe(4);
    expect(plan.keepDice).toBe(2);
    expect(plan.skillAdvantageRerollMax).toBe(0);
  });

  it('a comparative tie favors the observer', () => {
    const tie = resolveComparativeSkillCheck({ challengerTotal: 24, defenderTotal: 24 });
    expect(tie.tieFavorsDefender).toBe(true);
    expect(tie.challengerWins).toBe(false);
    expect(stealthBeatsObserver(24, 21)).toBe(true);
    expect(stealthBeatsObserver(24, 24)).toBe(false);
  });

  it('uses the higher of concealment and Invisibility TN', () => {
    const actor = actorWithPerceptionFlag({
      hidden: true,
      stealthPerceptionTn: 24,
      invisibilityBonus: 6,
    });
    expect(computePerceptionTn(actor)).toBe(24);
    expect(computePerceptionTn(actor)).not.toBe(42);
  });

  it('Safe Haven aftercare follows one medical Profession rank', () => {
    expect(safeHavenScarBarsRecovered(2)).toBe(1);
    expect(safeHavenScarBarsRecovered(4)).toBe(2);
    expect(safeHavenScarBarsRecovered(7)).toBe(2);
    expect(safeHavenScarBarsRecovered(8)).toBe(3);
  });

  it('legacy summonSkillDiceCap helper remains deterministic (retired purchases)', () => {
    // Purchases are retired; helper kept for migration/compat math only.
    expect(summonSkillDiceCap({
      task: 'stealth',
      ownerMasteryRank: 2,
      matchingSpecializationRank: 2,
      scopeCoversTask: true,
    })).toBe(4);
    expect(summonSkillDiceCap({
      task: 'stealth',
      ownerMasteryRank: 2,
      matchingSpecializationRank: 8,
      scopeCoversTask: false,
    })).toBe(0);
  });

  it('a Ritual without a fitting Profession is not an untrained Disadvantage roll', () => {
    expect(ritualTrainingModifiers(0)).toEqual({ rollDisadvantage: false, skillAdvantageRerollMax: 0 });
    expect(ritualTrainingModifiers(4).rollDisadvantage).toBe(false);
    expect(ritualTrainingModifiers(4).skillAdvantageRerollMax).toBe(4);
  });

  it('does not invent Burglar from a stored Stealth rank', () => {
    const system = {
      specializations: [
        { id: 'finesse:stealth', name: 'Stealth', field: 'finesse', scope: 'Moving unseen.', rank: 4 },
      ],
    };
    const plan = planProfessionMapping(system);
    expect(plan.drafts).toHaveLength(1);
    expect(plan.drafts[0]).toMatchObject({ name: 'Stealth', rank: 4, keep: true });
    expect(plan.drafts.map((row) => row.name)).not.toContain('Burglar');

    const applied = applyProfessionMappingDrafts(system, plan.drafts);
    expect(applied.ok).toBe(true);
    const stealth = applied.specializations.find((row) => row.name === 'Stealth');
    expect(stealth).toMatchObject({ id: 'finesse:stealth', rank: 4, scope: 'Moving unseen.' });
    expect(applied.specializations.some((row) => row.name === 'Burglar')).toBe(false);
  });
});
