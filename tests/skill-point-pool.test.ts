import { describe, expect, it } from 'vitest';
import {
  allocateSkillPending,
  readSkillPointPool,
  skillPointPoolUpdate,
} from '../src/progression/skill-point-pool';
import { skillBandCost } from '../src/utils/constants';
import { computeGroundTruthXp } from '../src/utils/xp-recalc';

const ranks: Record<string, number> = { athletics: 4, lore: 0, stealth: 2 };
const currentRank = (key: string) => ranks[key] ?? 0;

describe('unspent Skill Point pool', () => {
  it('reads a missing pool as empty', () => {
    expect(readSkillPointPool({})).toEqual({ unspent: 0, placed: {} });
    expect(readSkillPointPool({ skillPoints: { unspent: '3', placed: { lore: 2, junk: 0 } } })).toEqual({
      unspent: 3,
      placed: { lore: 2 },
    });
  });

  it('pays pending ranks with Skill Points first and only the rest with XP', () => {
    const alloc = allocateSkillPending({
      pendingMap: { lore: 3, athletics: 1 },
      currentRank,
      pool: { unspent: 2, placed: {} },
      skillBandCost,
    });
    expect(alloc.poolSpent).toBe(2);
    expect(alloc.poolAfter).toBe(0);
    // Lore was clicked first: ranks 1 and 2 from the pool, rank 3 costs XP.
    expect(alloc.perSkill.lore).toMatchObject({ poolSteps: 2, xpSteps: 1, xpNet: skillBandCost(3) });
    // Athletics 4 → 5 is fully XP.
    expect(alloc.perSkill.athletics).toMatchObject({ poolSteps: 0, xpSteps: 1, xpNet: skillBandCost(5) });
    expect(alloc.xpNet).toBe(skillBandCost(3) + skillBandCost(5));
  });

  it('costs no XP while the pool covers every pending rank', () => {
    const alloc = allocateSkillPending({
      pendingMap: { lore: 4, stealth: 2 },
      currentRank,
      pool: { unspent: 10, placed: {} },
      skillBandCost,
    });
    expect(alloc.xpNet).toBe(0);
    expect(alloc.poolSpent).toBe(6);
    expect(alloc.poolAfter).toBe(4);
  });

  it('returns ranks placed from the pool to the pool instead of refunding XP', () => {
    const alloc = allocateSkillPending({
      pendingMap: { athletics: -3 },
      currentRank,
      pool: { unspent: 0, placed: { athletics: 2 } },
      skillBandCost,
    });
    expect(alloc.perSkill.athletics).toMatchObject({ poolReturned: 2, xpRefundSteps: 1 });
    // The remaining rank (4 → 2 already returned, so rank 2) refunds XP.
    expect(alloc.perSkill.athletics.xpNet).toBe(-skillBandCost(2));
    expect(alloc.poolReturned).toBe(2);
    expect(alloc.poolAfter).toBe(2);
  });

  it('writes the pool and per-skill placement after a batch', () => {
    const pool = { unspent: 3, placed: { athletics: 2 } };
    const alloc = allocateSkillPending({
      pendingMap: { lore: 2, athletics: -2 },
      currentRank,
      pool,
      skillBandCost,
    });
    const update = skillPointPoolUpdate(pool, alloc);
    expect(update['system.skillPoints.unspent']).toBe(3 - 2 + 2);
    expect(update['system.skillPoints.placed.lore']).toBe(2);
    expect(update['system.skillPoints.placed.-=athletics']).toBeNull();
  });

  it('is not counted as XP by the ground-truth XP recalculation', () => {
    const attrs = { might: 2, agility: 2, vitality: 2, intellect: 2, resolve: 2, influence: 2, wits: 2 };
    const actor = {
      items: { filter: () => [] },
      system: {
        attributes: Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, { value: v }])),
        skills: { lore: 6 },
        skillPoints: { unspent: 0, placed: { lore: 4 } },
        points: { xp: 10, xpFree: 0 },
        xp: {
          totalEarned: 12,
          freeEarned: 0,
          totalSpent: 2,
          freeSpent: 0,
          postCreationProgress: {
            attributes: { ...attrs },
            skills: { lore: 0 },
            skillsSpent: {},
            powerLevels: {},
          },
        },
      },
    };
    const result = computeGroundTruthXp(actor);
    expect(result.ok).toBe(true);
    // Ranks 1–4 came from Skill Points; only ranks 5 and 6 are XP.
    expect(result.skillSpent).toBe(skillBandCost(5) + skillBandCost(6));
  });
});
