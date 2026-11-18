import { describe, expect, it } from 'vitest';
import { skillBandCost } from '../src/utils/constants';
import { computeGroundTruthXp } from '../src/utils/xp-recalc.js';
import {
  allocateSkillPending,
  planSkillPointRetirement,
  readLegacySkillPointResidue,
  readSkillPointPool,
  skillPointPoolUpdate,
} from '../src/progression/skill-point-pool';

describe('Skill Point pool (retired)', () => {
  it('readSkillPointPool always returns empty', () => {
    expect(readSkillPointPool({})).toEqual({ unspent: 0, placed: {} });
    expect(
      readSkillPointPool({ skillPoints: { unspent: '3', placed: { lore: 2 } } }),
    ).toEqual({ unspent: 0, placed: {} });
    expect(readLegacySkillPointResidue({ skillPoints: { unspent: 3, placed: { lore: 2 } } })).toEqual({
      unspent: 3,
      placed: { lore: 2 },
    });
  });

  it('allocates pending ranks with XP only', () => {
    const alloc = allocateSkillPending({
      pendingMap: { lore: 3 },
      currentRank: () => 0,
      skillBandCost,
    });
    expect(alloc.poolSpent).toBe(0);
    expect(alloc.poolAfter).toBe(0);
    expect(alloc.perSkill.lore).toMatchObject({ poolSteps: 0, xpSteps: 3 });
    expect(alloc.xpNet).toBe(skillBandCost(1) + skillBandCost(2) + skillBandCost(3));
  });

  it('refunds decreased ranks as XP', () => {
    const alloc = allocateSkillPending({
      pendingMap: { athletics: -3 },
      currentRank: () => 4,
      skillBandCost,
    });
    expect(alloc.perSkill.athletics).toMatchObject({ poolReturned: 0, xpRefundSteps: 3 });
    expect(alloc.perSkill.athletics.xpNet).toBe(
      -(skillBandCost(4) + skillBandCost(3) + skillBandCost(2)),
    );
  });

  it('skillPointPoolUpdate clears the retired pool', () => {
    const update = skillPointPoolUpdate({ unspent: 0, placed: {} }, {
      poolSpent: 0,
      poolReturned: 0,
      poolAfter: 0,
      xpNet: 0,
      perSkill: {},
    });
    expect(update).toEqual({ 'system.skillPoints': { unspent: 0, placed: {} } });
  });

  it('retirement converts residue to Free XP', () => {
    const plan = planSkillPointRetirement({
      skillPoints: { unspent: 4, placed: { lore: 1 } },
      points: { xpFree: 1 },
      xp: { freeEarned: 1 },
    });
    expect(plan.needed).toBe(true);
    expect(plan.convertedXp).toBe(4);
    expect(plan.updates['system.points.xpFree']).toBe(5);
  });

  it('XP recalculation treats ranks above snapshot as XP (no Skill Point baseline)', () => {
    const actor = {
      type: 'character',
      system: {
        attributes: {
          might: { value: 4 },
          agility: { value: 4 },
          vitality: { value: 3 },
          intellect: { value: 3 },
          resolve: { value: 2 },
          influence: { value: 2 },
          wits: { value: 2 },
        },
        skills: { athletics: 6 },
        skillPoints: { unspent: 0, placed: { athletics: 4 } },
        points: { xp: 20, xpFree: 0 },
        xp: {
          totalEarned: 20,
          totalSpent: 0,
          freeEarned: 0,
          freeSpent: 0,
          postCreationProgress: {
            attributes: {
              might: 4,
              agility: 4,
              vitality: 3,
              intellect: 3,
              resolve: 2,
              influence: 2,
              wits: 2,
            },
            skills: { athletics: 4 },
            skillsSpent: {},
            powerLevels: {},
          },
        },
      },
      items: { filter: () => [] },
    };
    const result = computeGroundTruthXp(actor as any);
    expect(result.ok).toBe(true);
    expect(result.skillSpent).toBe(skillBandCost(5) + skillBandCost(6));
  });
});
