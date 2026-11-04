import { describe, expect, it } from 'vitest';
import {
  LIFETIME_STONE_CAP_TOTAL,
  LIFETIME_STONE_CAP_XP,
  MR_ADVANCEMENT,
  attributeBandCost,
  getDivineScale,
} from '../src/utils/constants.js';
import {
  getRulesMasteryRank,
  masteryRankFromLifetimeXp,
  suggestedMasteryRank,
} from '../src/utils/mastery-rank-sync.js';
import {
  PRINT_LIFETIME_XP_SPAN,
  permanentStonesFromLifetimeXp,
  stoneConcentrationCap,
} from '../src/progression/v099-rules.js';
import { specializationXpCostFromTo } from '../src/rules/skill-raises.js';
import {
  canIncreaseAgainInStep,
  emptyStep,
  isBumped,
  recordBump,
} from '../src/utils/xp-step-rule.js';

describe('Batch 2 B07 — Lifetime XP Mastery Rank milestones', () => {
  it('matches Core 2026-11-04 MR thresholds and stone totals', () => {
    expect(MR_ADVANCEMENT.map((r) => [r.lifetimeXp, r.mr, r.stones])).toEqual([
      [0, 2, 2],
      [100, 3, 7],
      [250, 4, 14],
      [500, 5, 27],
      [900, 6, 47],
      [1400, 7, 72],
      [2000, 8, 102],
    ]);
  });

  it.each([
    [0, 2],
    [99, 2],
    [100, 3],
    [249, 3],
    [250, 4],
    [499, 4],
    [500, 5],
    [899, 5],
    [900, 6],
    [1399, 6],
    [1400, 7],
    [1999, 7],
    [2000, 8],
    [2200, 8],
    [5000, 8],
  ])('Lifetime XP %i suggests MR %i', (xp, mr) => {
    expect(masteryRankFromLifetimeXp(xp)).toBe(mr);
  });

  it('does not auto-migrate stored mastery.rank when Lifetime XP suggests a higher MR', () => {
    const actor = {
      system: {
        mastery: { rank: 3 },
        progression: { lifetimeXp: 500 },
      },
    };
    expect(suggestedMasteryRank(actor)).toBe(5);
    expect(getRulesMasteryRank(actor)).toBe(3);
    expect(actor.system.mastery.rank).toBe(3);
  });

  it('keeps Banked XP / earned Stones consistent with the Lifetime Stone Cap', () => {
    expect(LIFETIME_STONE_CAP_XP).toBe(2200);
    expect(LIFETIME_STONE_CAP_TOTAL).toBe(112);
    expect(PRINT_LIFETIME_XP_SPAN).toBe(2200);
    expect(permanentStonesFromLifetimeXp(0)).toBe(2);
    expect(permanentStonesFromLifetimeXp(100)).toBe(7);
    expect(permanentStonesFromLifetimeXp(2000)).toBe(102);
    expect(permanentStonesFromLifetimeXp(2200)).toBe(112);
    expect(permanentStonesFromLifetimeXp(5000)).toBe(112);
    expect(getDivineScale(102)).toBe('Lesser God');
    expect(getDivineScale(112)).toBe('Apex God');
  });

  it('scales Attribute Stone concentration with Lifetime-derived MR', () => {
    expect(stoneConcentrationCap(14, 99, 250)).toBe(8); // MR4 → 8
    expect(stoneConcentrationCap(102, 2, 2000)).toBe(16); // MR8 → 16
  });
});

describe('Batch 2 B08 — consecutive Upgrade Step purchases', () => {
  it('charges every intermediate Specialization rank (2 → 4 = 6 + 8)', () => {
    expect(specializationXpCostFromTo(2, 4)).toBe(14);
    expect(specializationXpCostFromTo(2, 3)).toBe(6);
    expect(specializationXpCostFromTo(3, 4)).toBe(8);
  });

  it('charges every intermediate Attribute band when raised consecutively', () => {
    // Example: 4 → 6 costs band(5) + band(6) = 4 + 4
    expect(attributeBandCost(5) + attributeBandCost(6)).toBe(8);
  });

  it('does not block a second increase of the same entity in one step', () => {
    let step = emptyStep();
    step = recordBump(step, 'skill', 'spec-blade');
    expect(isBumped(step, 'skill', 'spec-blade')).toBe(true);
    expect(canIncreaseAgainInStep(step, 'skill', 'spec-blade')).toBe(true);
    step = recordBump(step, 'attribute', 'might');
    step = recordBump(step, 'attribute', 'might');
    step = recordBump(step, 'power', 'pow-1');
    step = recordBump(step, 'artifact', 'art-1');
    expect(canIncreaseAgainInStep(step, 'attribute', 'might')).toBe(true);
    expect(canIncreaseAgainInStep(step, 'power', 'pow-1')).toBe(true);
    expect(canIncreaseAgainInStep(step, 'artifact', 'art-1')).toBe(true);
    expect(step.skills).toEqual(['spec-blade']);
    expect(step.attributes).toEqual(['might']);
  });
});
