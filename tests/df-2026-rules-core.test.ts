import { describe, expect, it } from 'vitest';
import {
  CORE_RITUALS,
  DF_2026_RULES_SCHEMA_VERSION,
  ECHO_IMPRINTS,
  emergencyMedicineBaseTn,
  fearGainFromResolveCheck,
  finalSkillTn,
  finalSpellTn,
  getSkillRaiseAllowance,
  isIncapacitated,
  passiveSkillSucceeds,
  passiveSkillValue,
  planRitualRaises,
  ritualBaseTn,
  ritualSealedStoneCost,
  safeHavenScarBarsRecovered,
  skillTaskBaseTn,
  spellBaseTnFromPowerLevel,
  STARTING_SPECIALIZATION_COUNT,
  STARTING_SPECIALIZATION_RANK,
  SKILL_CREATION_POINTS,
  summonSkillDiceCap,
  summonTaskSlotCount,
  validateEchoImprintSelections,
  validateSkillRaiseAllocation,
  validateSpecializationList,
  zoneCreationTn,
  diceAfterFear,
} from '../src/rules/index.js';

describe('DF 2026 rules schema', () => {
  it('exposes schema version', () => {
    expect(DF_2026_RULES_SCHEMA_VERSION).toBe('2026.10.23');
  });

  it('has exactly 28 Echo Imprints (4 per Attribute)', () => {
    expect(ECHO_IMPRINTS).toHaveLength(28);
    for (const attr of ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits']) {
      expect(ECHO_IMPRINTS.filter((e) => e.attribute === attr)).toHaveLength(4);
    }
  });

  it('has exactly 16 Core Rituals', () => {
    expect(CORE_RITUALS).toHaveLength(16);
    expect(CORE_RITUALS.map((r) => r.id)).toContain('read-resonance');
    expect(CORE_RITUALS.map((r) => r.id)).toContain('augury-signs-of-tomorrow');
    expect(CORE_RITUALS.map((r) => r.id)).not.toContain('healing');
  });
});

describe('Skill Raises', () => {
  it('Rank 4 allows 3 Paid + 1 Free', () => {
    expect(getSkillRaiseAllowance(4)).toEqual({ maxPaid: 3, maxFree: 1, maxTotal: 4 });
  });

  it('Blacksmithing Rank4 Scope2+Speed1 on BaseTN8 → TN16', () => {
    const base = skillTaskBaseTn(2);
    expect(base).toBe(8);
    const check = validateSkillRaiseAllocation(4, 2, 1);
    expect(check.ok).toBe(true);
    expect(finalSkillTn(base, check.paid)).toBe(16);
  });

  it('same three Raises at Rank3 → three Paid → TN20', () => {
    const check = validateSkillRaiseAllocation(3, 3, 0);
    expect(check.ok).toBe(true);
    expect(finalSkillTn(8, 3)).toBe(20);
  });

  it('Passive Skill Value Attribute8 passes TN16 not TN20', () => {
    expect(passiveSkillValue(8)).toBe(16);
    expect(passiveSkillSucceeds(8, 16)).toBe(true);
    expect(passiveSkillSucceeds(8, 20)).toBe(false);
  });

  it('starting budget is five Rank-2 Specializations / 20 Creation Points', () => {
    expect(STARTING_SPECIALIZATION_COUNT).toBe(5);
    expect(STARTING_SPECIALIZATION_RANK).toBe(2);
    expect(SKILL_CREATION_POINTS).toBe(20);
    const ok = validateSpecializationList(
      Array.from({ length: 5 }, (_, i) => ({
        name: `Spec ${i}`,
        field: 'physical',
        scope: 'test',
        rank: 2,
      })),
      { requireStartingBudget: true },
    );
    // duplicate field+name normalized differently — Spec 0..4 are unique
    expect(ok.ok).toBe(true);
  });
});

describe('Spell TN', () => {
  it('uses Power Level × 4', () => {
    expect(spellBaseTnFromPowerLevel(2)).toBe(8);
    expect(spellBaseTnFromPowerLevel(4)).toBe(16);
    expect(spellBaseTnFromPowerLevel(6)).toBe(24);
    expect(spellBaseTnFromPowerLevel(16)).toBe(64);
  });

  it('adds SR and Paid Combat Raises', () => {
    expect(finalSpellTn({ powerLevel: 4, spellResistance: 4 })).toBe(20);
    expect(finalSpellTn({ powerLevel: 4, spellResistance: 4, paidCombatRaises: 1 })).toBe(24);
  });

  it('zone Creation TN includes Paid Raises', () => {
    expect(zoneCreationTn(4, 1)).toBe(20);
  });
});

describe('Rituals', () => {
  it('Base TN floors at Task Level 3', () => {
    expect(ritualBaseTn(1)).toBe(12);
    expect(ritualBaseTn(3)).toBe(12);
    expect(ritualBaseTn(4)).toBe(16);
    expect(ritualBaseTn(6)).toBe(24);
  });

  it('Sealed Stones scale on total Raises; Free reduces TN only', () => {
    expect(ritualSealedStoneCost(0)).toBe(1);
    expect(ritualSealedStoneCost(2)).toBe(2);
    expect(ritualSealedStoneCost(4)).toBe(3);
    const withSpec = planRitualRaises({ taskLevel: 3, namedTier: 2, specializationRank: 4 });
    expect(withSpec.freeRaises).toBe(1);
    expect(withSpec.paidRaises).toBe(1);
    expect(withSpec.finalTn).toBe(16);
    expect(withSpec.sealedStones).toBe(2);
    const noSpec = planRitualRaises({ taskLevel: 3, namedTier: 2, specializationRank: 0 });
    expect(noSpec.paidRaises).toBe(2);
    expect(noSpec.finalTn).toBe(20);
    expect(noSpec.sealedStones).toBe(2);
  });
});

describe('Fear / Health / Summons', () => {
  it('Fear bands', () => {
    expect(fearGainFromResolveCheck(7)).toBe(2);
    expect(fearGainFromResolveCheck(8)).toBe(1);
    expect(fearGainFromResolveCheck(15)).toBe(1);
    expect(fearGainFromResolveCheck(16)).toBe(0);
  });

  it('Fear pool floor keeps two rolled dice', () => {
    expect(diceAfterFear(6, 10)).toBe(2);
    expect(diceAfterFear(4, 1)).toBe(3);
  });

  it('Incapacitated when all bars scarred; Emergency Medicine TN = MR×4', () => {
    expect(isIncapacitated({ availableBars: 6, scarredBars: 6 })).toBe(true);
    expect(isIncapacitated({ availableBars: 6, scarredBars: 5 })).toBe(false);
    expect(emergencyMedicineBaseTn(4)).toBe(16);
    expect(safeHavenScarBarsRecovered(null)).toBe(1);
    expect(safeHavenScarBarsRecovered(4)).toBe(2);
    expect(safeHavenScarBarsRecovered(8)).toBe(3);
  });

  it('Summon slots and dice caps', () => {
    expect(summonTaskSlotCount(1)).toBe(2);
    expect(summonTaskSlotCount(3)).toBe(4);
    expect(summonSkillDiceCap({ task: 'perception', ownerMasteryRank: 2 })).toBe(4);
    expect(summonSkillDiceCap({ task: 'stealth', ownerMasteryRank: 2, matchingSpecializationRank: 2 })).toBe(4);
    expect(summonSkillDiceCap({ task: 'tracking', ownerMasteryRank: 2, matchingSpecializationRank: 1 })).toBe(2);
  });
});

describe('Echo Imprint eligibility', () => {
  it('enforces Attribute 4+ and max = MR', () => {
    const bad = validateEchoImprintSelections({
      selectedIds: ['mage-hand', 'catfall', 'glamour'],
      masteryRank: 2,
      attributes: { intellect: 4, agility: 4, influence: 4 },
    });
    expect(bad.ok).toBe(false);
    const good = validateEchoImprintSelections({
      selectedIds: ['mage-hand', 'catfall'],
      masteryRank: 2,
      attributes: { intellect: 4, agility: 4 },
    });
    expect(good.ok).toBe(true);
  });
});
