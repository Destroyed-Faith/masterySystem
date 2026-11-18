import { describe, expect, it } from 'vitest';
import {
  planSkillPointRetirement,
  readLegacySkillPointResidue,
} from '../src/migrations/legacy-skill-point-pool';
import { computeGroundTruthXp } from '../src/utils/xp-recalc.js';

describe('Skill Point retirement (migration-only)', () => {
  it('converts leftover unspent Skill Points to Free XP and clears the pool', () => {
    const system = {
      skillPoints: { unspent: 5, placed: { lore: 2 } },
      points: { xpFree: 3 },
      xp: { freeEarned: 3 },
    };
    expect(readLegacySkillPointResidue(system)).toEqual({ unspent: 5, placed: { lore: 2 } });
    const plan = planSkillPointRetirement(system);
    expect(plan.needed).toBe(true);
    expect(plan.convertedXp).toBe(5);
    expect(plan.updates).toMatchObject({
      'system.skillPoints': { unspent: 0, placed: {} },
      'system.points.xpFree': 8,
      'system.xp.freeEarned': 8,
    });
  });

  it('needs nothing when no residue is stored', () => {
    expect(planSkillPointRetirement({}).needed).toBe(false);
  });
});

describe('XP recalculation ignores legacy Skill data', () => {
  it('prices Profession ranks, never system.skills', () => {
    const attributes = { might: 4, agility: 4, vitality: 3, intellect: 3, resolve: 2, influence: 2, wits: 2 };
    const actor = {
      type: 'character',
      system: {
        attributes: Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k, { value: v }])),
        skills: { athletics: 6 },
        specializations: [],
        points: { xp: 20, xpFree: 0 },
        xp: {
          totalEarned: 20,
          totalSpent: 0,
          freeEarned: 0,
          freeSpent: 0,
          postCreationProgress: { attributes, powerLevels: {} },
        },
      },
      items: { filter: () => [] },
    };
    const result = computeGroundTruthXp(actor as any);
    expect(result.ok).toBe(true);
    expect(result.skillSpent).toBe(0);
  });
});
