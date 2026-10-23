import { describe, expect, it } from 'vitest';
import {
  STARTING_SPECIALIZATION_COUNT,
  STARTING_SPECIALIZATION_RANK,
  specializationIdentityKey,
  validateSpecializationList,
} from '../src/rules/index.js';
import { CREATION } from '../src/utils/constants.js';
import { planDf2026ActorMigration } from '../src/migrations/df-2026-rules-migration.js';

function fiveRank2() {
  return Array.from({ length: STARTING_SPECIALIZATION_COUNT }, (_, i) => ({
    id: specializationIdentityKey(`Spec ${i + 1}`, 'physical'),
    name: `Spec ${i + 1}`,
    field: 'physical' as const,
    scope: `Scope ${i + 1}`,
    rank: STARTING_SPECIALIZATION_RANK,
  }));
}

describe('DF 2026 creation gate (no Foundry)', () => {
  it('requires exactly five Rank-2 Specializations (20 Creation Points)', () => {
    expect(CREATION.STARTING_SPECIALIZATION_COUNT).toBe(5);
    expect(CREATION.STARTING_SPECIALIZATION_RANK).toBe(2);
    expect(CREATION.SKILL_POINTS).toBe(20);
    expect(validateSpecializationList(fiveRank2(), { requireStartingBudget: true }).ok).toBe(true);
    expect(
      validateSpecializationList(fiveRank2().slice(0, 4), { requireStartingBudget: true }).ok,
    ).toBe(false);
  });

  it('does not auto-convert legacy skills into Specs during migration', () => {
    const actor = {
      id: 'a1',
      name: 'Legacy',
      type: 'character',
      system: {
        mastery: { rank: 2 },
        skills: { stealth: 4, athletics: 4, lore: 4, persuasion: 4, survival: 4, medicine: 4, occultism: 4, crafting: 4, investigation: 4, empathy: 4 },
        minorExpressions: [],
        progression: {},
      },
      flags: {},
    };
    const { update, summary } = planDf2026ActorMigration(actor);
    expect(update).toBeTruthy();
    expect(update?.['system.specializations']).toBeUndefined();
    expect(summary.warnings.some((w) => /Specialization/i.test(w))).toBe(true);
  });
});
