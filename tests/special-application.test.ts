import { describe, expect, it } from 'vitest';
import {
  addSpecialApplication,
  applyNaturalRecoveryToValue,
  changeNaturalRecoveryAllocation,
  clampSpecialApplication,
  emptySpecialRoundApps,
  formatApplicationLimitNote,
  greedyNaturalRecoveryPlan,
  isNegativeDiminishingSpecialId,
  listNaturalRecoveryOptions,
  pickNaturalRecoveryTarget,
  remainingSpecialApplication,
  resolveNaturalRecoveryPlan,
  setNaturalRecoveryAllocations,
  setNaturalRecoverySkipped,
  specialApplicationLimit,
  syncSpecialRoundApps,
} from '../src/combat/special-application.js';

describe('special application limit', () => {
  it('is 4 × Mastery Rank', () => {
    expect(specialApplicationLimit(1)).toBe(4);
    expect(specialApplicationLimit(2)).toBe(8);
    expect(specialApplicationLimit(3)).toBe(12);
  });

  it('does not count leftover stacks from a previous Round', () => {
    const combat = { id: 'c1', round: 2 };
    const actor = {
      system: { mastery: { rank: 2 } },
      flags: {
        'mastery-system': {
          specialRoundApps: { combatId: 'c1', round: 1, counts: { lacerate: 8 } },
        },
      },
    };
    const result = clampSpecialApplication(actor, 'lacerate', 5, combat);
    expect(result.applied).toBe(5);
    expect(result.ignored).toBe(0);
    expect(result.usedThisRound).toBe(5);
  });

  it('ignores points beyond 4 × MR from all sources this Round', () => {
    const combat = { id: 'c1', round: 1 };
    const actor = {
      system: { mastery: { rank: 2 } },
      flags: {
        'mastery-system': {
          specialRoundApps: { combatId: 'c1', round: 1, counts: { ruin: 6 } },
        },
      },
    };
    const result = clampSpecialApplication(actor, 'ruin', 5, combat);
    expect(result.applied).toBe(2);
    expect(result.ignored).toBe(3);
    expect(result.limit).toBe(8);
    expect(result.usedThisRound).toBe(8);
    expect(formatApplicationLimitNote('ruin', 3, 8, 2)).toMatch(/Ruin/);
    expect(formatApplicationLimitNote('ruin', 3, 8, 2)).toMatch(/3/);
  });

  it('leaves non-diminishing Specials and out-of-combat applications uncapped', () => {
    const actor = { system: { mastery: { rank: 1 } } };
    expect(clampSpecialApplication(actor, 'root', 9, { id: 'c1', round: 1 }).applied).toBe(9);
    expect(clampSpecialApplication(actor, 'ruin', 9, null).applied).toBe(9);
  });

  it('resets the internal count when the Round changes', () => {
    const prev = emptySpecialRoundApps({ id: 'c1', round: 1 });
    const used = addSpecialApplication(prev, 'slow', 4);
    expect(remainingSpecialApplication(used, 'slow', 4)).toBe(0);
    const next = syncSpecialRoundApps(used, { id: 'c1', round: 2 });
    expect(remainingSpecialApplication(next, 'slow', 4)).toBe(4);
  });
});

describe('natural special recovery', () => {
  it('reduces a Special by the assigned amount and loses leftover on that Special', () => {
    expect(applyNaturalRecoveryToValue(5, 2)).toEqual({ after: 3, reduced: 2 });
    expect(applyNaturalRecoveryToValue(1, 3)).toEqual({ after: 0, reduced: 1 });
  });

  it('picks the highest-value negative Special and never Regeneration', () => {
    expect(isNegativeDiminishingSpecialId('regeneration')).toBe(false);
    expect(isNegativeDiminishingSpecialId('ruin')).toBe(true);
    const pick = pickNaturalRecoveryTarget([
      { id: 'regeneration', value: 9 },
      { id: 'slow', value: 3 },
      { id: 'ruin', value: 4 },
    ]);
    expect(pick).toEqual({ id: 'ruin', value: 4 });
  });

  it('spends leftover MR on the next-highest Special when no plan was stored', () => {
    expect(
      greedyNaturalRecoveryPlan(
        [
          { id: 'regeneration', value: 9 },
          { id: 'slow', value: 1 },
          { id: 'ruin', value: 5 },
        ],
        3,
      ),
    ).toEqual([
      { id: 'ruin', before: 5, after: 2, reduced: 3 },
    ]);
    expect(
      greedyNaturalRecoveryPlan(
        [
          { id: 'slow', value: 1 },
          { id: 'ruin', value: 5 },
        ],
        3,
      ),
    ).toEqual([
      { id: 'ruin', before: 5, after: 2, reduced: 3 },
    ]);
    expect(
      greedyNaturalRecoveryPlan(
        [
          { id: 'slow', value: 1 },
          { id: 'blight', value: 1 },
        ],
        3,
      ),
    ).toEqual([
      { id: 'blight', before: 1, after: 0, reduced: 1 },
      { id: 'slow', before: 1, after: 0, reduced: 1 },
    ]);
  });

  it('uses the Stone Powers split instead of the highest remaining Special', async () => {
    const combat = { id: 'c1', round: 1 };
    const actor: any = {
      system: {
        mastery: { rank: 2 },
        statusEffects: [{ id: 'slow', value: 2 }, { id: 'ruin', value: 5 }],
      },
      flags: {},
    };
    await setNaturalRecoveryAllocations(actor, combat, { slow: 2 });
    const entries = [
      { id: 'slow', value: 2 },
      { id: 'ruin', value: 5 },
    ];
    expect(resolveNaturalRecoveryPlan(actor, entries, combat, 2)).toEqual([
      { id: 'slow', before: 2, after: 0, reduced: 2 },
    ]);
    expect(listNaturalRecoveryOptions(actor, combat).map((o) => [o.id, o.allocated])).toEqual([
      ['ruin', 0],
      ['slow', 2],
    ]);
  });

  it('lets the player split MR across several Specials', async () => {
    const combat = { id: 'c1', round: 1 };
    const actor: any = {
      system: {
        mastery: { rank: 2 },
        statusEffects: [{ id: 'slow', value: 2 }, { id: 'ruin', value: 5 }],
      },
      flags: {},
    };
    await changeNaturalRecoveryAllocation(actor, combat, 'slow', 1);
    await changeNaturalRecoveryAllocation(actor, combat, 'ruin', 1);
    expect(resolveNaturalRecoveryPlan(actor, [
      { id: 'slow', value: 2 },
      { id: 'ruin', value: 5 },
    ], combat, 2)).toEqual([
      { id: 'ruin', before: 5, after: 4, reduced: 1 },
      { id: 'slow', before: 2, after: 1, reduced: 1 },
    ]);
  });

  it('skips recovery when the player chose None', async () => {
    const combat = { id: 'c1', round: 1 };
    const actor: any = {
      system: { mastery: { rank: 1 }, statusEffects: [{ id: 'ruin', value: 4 }] },
      flags: {},
    };
    await setNaturalRecoverySkipped(actor, combat);
    expect(resolveNaturalRecoveryPlan(actor, [{ id: 'ruin', value: 4 }], combat, 1)).toEqual([]);
  });

  it('does not redistribute leftover when a stored Special is already gone', async () => {
    const combat = { id: 'c1', round: 1 };
    const actor: any = { flags: { 'mastery-system': { naturalSpecialRecovery: {
      combatId: 'c1', round: 1, chosen: true, allocations: { slow: 2 },
    } } } };
    expect(resolveNaturalRecoveryPlan(actor, [{ id: 'ruin', value: 4 }], combat, 2)).toEqual([]);
  });

  it('falls back to a highest-first spend when no choice was stored', () => {
    const actor = { system: { statusEffects: [{ id: 'slow', value: 2 }, { id: 'ruin', value: 5 }] } };
    expect(resolveNaturalRecoveryPlan(actor, [
      { id: 'slow', value: 2 },
      { id: 'ruin', value: 5 },
    ], { id: 'c1', round: 1 }, 2)).toEqual([
      { id: 'ruin', before: 5, after: 3, reduced: 2 },
    ]);
  });

  it('still honors a legacy single-target flag', () => {
    const combat = { id: 'c1', round: 1 };
    const actor: any = {
      flags: {
        'mastery-system': {
          naturalSpecialRecovery: { combatId: 'c1', round: 1, chosen: true, specialId: 'slow' },
        },
      },
    };
    expect(resolveNaturalRecoveryPlan(actor, [
      { id: 'slow', value: 2 },
      { id: 'ruin', value: 5 },
    ], combat, 2)).toEqual([
      { id: 'slow', before: 2, after: 0, reduced: 2 },
    ]);
  });
});
