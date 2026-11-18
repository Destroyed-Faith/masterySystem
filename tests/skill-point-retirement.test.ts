import { describe, expect, it } from 'vitest';
import {
  allocateSkillPending,
  planSkillPointRetirement,
  readLegacySkillPointResidue,
  readSkillPointPool,
} from '../src/progression/skill-point-pool';

describe('Skill Point retirement', () => {
  it('readSkillPointPool always returns an empty pool', () => {
    expect(
      readSkillPointPool({
        skillPoints: { unspent: 12, placed: { athletics: 3 } },
      }),
    ).toEqual({ unspent: 0, placed: {} });
  });

  it('converts leftover unspent Skill Points to Free XP and clears the pool', () => {
    const system = {
      skillPoints: { unspent: 5, placed: { lore: 2 } },
      points: { xpFree: 3 },
      xp: { freeEarned: 3 },
    };
    expect(readLegacySkillPointResidue(system).unspent).toBe(5);
    const plan = planSkillPointRetirement(system);
    expect(plan.needed).toBe(true);
    expect(plan.convertedXp).toBe(5);
    expect(plan.updates).toMatchObject({
      'system.skillPoints': { unspent: 0, placed: {} },
      'system.points.xpFree': 8,
      'system.xp.freeEarned': 8,
    });
  });

  it('allocates pending Skill changes as XP only', () => {
    const allocation = allocateSkillPending({
      pendingMap: { athletics: 2 },
      currentRank: () => 4,
      skillBandCost: (rank) => rank,
    });
    expect(allocation.poolSpent).toBe(0);
    expect(allocation.perSkill.athletics).toMatchObject({
      poolSteps: 0,
      xpSteps: 2,
      xpNet: 5 + 6,
    });
  });
});
