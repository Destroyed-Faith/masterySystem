/**
 * Challenge Rolls regression — universal group progress (Core 2026-11-19).
 * Manual acceptance mirrors: shared target, Final TN, 4-Raise threshold,
 * failure = 0, one roll per participant, Combat-only Free Raises excluded.
 */
import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_PROGRESS_RAISE_THRESHOLD,
  MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION,
  TYPICAL_COMPLEX_CHALLENGE_TARGET,
  TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET,
  accumulateChallengeProgress,
  eligibleRaisesTowardChallengeProgress,
  isEligibleChallengeFreeRaise,
  resolveChallengeContribution,
  resolveChallengeContributionFromTaskLevel,
  typicalChallengeTarget,
} from '../src/rules/challenge-rolls.js';
import { resolveComparativeSkillCheck } from '../src/rules/comparative-skill-check.js';
import { finalSkillTn, skillTaskBaseTn } from '../src/rules/skill-raises.js';

describe('Challenge Rolls — targets and Standard Training TN', () => {
  it('uses typical shared targets 2 (complex) / 3 (very complex), not MR scaling', () => {
    expect(typicalChallengeTarget('complex')).toBe(TYPICAL_COMPLEX_CHALLENGE_TARGET);
    expect(typicalChallengeTarget('very-complex')).toBe(TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET);
    expect(TYPICAL_COMPLEX_CHALLENGE_TARGET).toBe(2);
    expect(TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET).toBe(3);
  });

  it('keeps Standard Training Base TN = Task Level × 4 and +4 per Paid Raise', () => {
    expect(skillTaskBaseTn(3)).toBe(12);
    expect(skillTaskBaseTn(4)).toBe(16);
    expect(finalSkillTn(12, 4)).toBe(28);
    expect(finalSkillTn(16, 0)).toBe(16);
  });
});

describe('Challenge Rolls — contribution successes', () => {
  it('grants 1 Success on pass without four progress Raises', () => {
    const r = resolveChallengeContributionFromTaskLevel({
      taskLevel: 4,
      rollTotal: 18,
      paidRaises: 0,
    });
    expect(r.finalTn).toBe(16);
    expect(r.metFinalTn).toBe(true);
    expect(r.successes).toBe(1);
  });

  it('grants 2 Successes on pass with four declared eligible Raises toward progress', () => {
    expect(CHALLENGE_PROGRESS_RAISE_THRESHOLD).toBe(4);
    const r = resolveChallengeContributionFromTaskLevel({
      taskLevel: 3,
      rollTotal: 31,
      paidRaises: 4,
      paidRaisesTowardProgress: 4,
    });
    expect(r.finalTn).toBe(28);
    expect(r.metFinalTn).toBe(true);
    expect(r.eligibleRaisesTowardProgress).toBe(4);
    expect(r.successes).toBe(MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION);
  });

  it('requires the declared Final TN — roll meeting only Base TN still fails', () => {
    const r = resolveChallengeContribution({
      baseTn: 12,
      rollTotal: 15,
      paidRaises: 4,
      paidRaisesTowardProgress: 4,
    });
    expect(r.finalTn).toBe(28);
    expect(r.metFinalTn).toBe(false);
    expect(r.successes).toBe(0);
  });

  it('grants 0 Successes on failure, including no bonus Success', () => {
    const r = resolveChallengeContributionFromTaskLevel({
      taskLevel: 4,
      rollTotal: 10,
      paidRaises: 0,
    });
    expect(r.successes).toBe(0);
  });

  it('caps at 2 Successes even with more than four Raises', () => {
    const r = resolveChallengeContribution({
      baseTn: 8,
      rollTotal: 40,
      paidRaises: 6,
      paidRaisesTowardProgress: 6,
    });
    expect(r.successes).toBe(2);
  });

  it('enforces one roll per participating character', () => {
    const r = resolveChallengeContribution({
      baseTn: 12,
      rollTotal: 20,
      paidRaises: 0,
      alreadyContributed: true,
    });
    expect(r.ok).toBe(false);
    expect(r.successes).toBe(0);
    expect(r.error).toMatch(/once per Challenge/i);
  });
});

describe('Challenge Rolls — Free Raises boundary', () => {
  it('excludes Combat-only Intellect Stone Free Raises from the progress threshold', () => {
    expect(isEligibleChallengeFreeRaise('intellect-stone-combat')).toBe(false);
    expect(isEligibleChallengeFreeRaise('profession-rank')).toBe(false);
    expect(isEligibleChallengeFreeRaise('explicit-challenge-roll')).toBe(true);

    const eligible = eligibleRaisesTowardChallengeProgress({
      paidRaisesTowardProgress: 2,
      freeRaisesTowardProgress: 4,
      freeRaiseSource: 'intellect-stone-combat',
    });
    expect(eligible).toBe(2);

    const withStoneFree = resolveChallengeContribution({
      baseTn: 12,
      rollTotal: 20,
      paidRaises: 2,
      paidRaisesTowardProgress: 2,
      freeRaisesTowardProgress: 4,
      freeRaiseSource: 'intellect-stone-combat',
    });
    // Pass with only 2 eligible progress Raises → 1 Success, not 2.
    expect(withStoneFree.successes).toBe(1);
    expect(withStoneFree.eligibleRaisesTowardProgress).toBe(2);
  });

  it('counts Free Raises only when a source explicitly permits Challenge Rolls', () => {
    const r = resolveChallengeContribution({
      baseTn: 12,
      rollTotal: 20,
      paidRaises: 0,
      paidRaisesTowardProgress: 0,
      freeRaisesTowardProgress: 4,
      freeRaiseSource: 'explicit-challenge-roll',
    });
    expect(r.finalTn).toBe(12); // Free Raises add no TN
    expect(r.successes).toBe(2);
  });
});

describe('Challenge Rolls — group progress', () => {
  it('accumulates distinct contributions toward the announced shared target', () => {
    const carpenter = resolveChallengeContributionFromTaskLevel({
      taskLevel: 3,
      rollTotal: 31,
      paidRaises: 4,
    });
    const engineer = resolveChallengeContributionFromTaskLevel({
      taskLevel: 4,
      rollTotal: 18,
      paidRaises: 0,
    });
    expect(carpenter.successes).toBe(2);
    expect(engineer.successes).toBe(1);

    const progress = accumulateChallengeProgress(
      [carpenter.successes, engineer.successes],
      typicalChallengeTarget('very-complex'),
    );
    expect(progress.accumulated).toBe(3);
    expect(progress.complete).toBe(true);
    expect(progress.remaining).toBe(0);
  });

  it('leaves the objective incomplete when the group falls short', () => {
    const progress = accumulateChallengeProgress([1, 0], TYPICAL_COMPLEX_CHALLENGE_TARGET);
    expect(progress.complete).toBe(false);
    expect(progress.remaining).toBe(1);
  });
});

describe('Challenge Rolls — boundaries vs Comparative and Challenge(X)', () => {
  it('leaves Comparative Training Checks without Raises', () => {
    const tie = resolveComparativeSkillCheck({ challengerTotal: 22, defenderTotal: 22 });
    expect(tie.tieFavorsDefender).toBe(true);
    expect(tie.challengerWins).toBe(false);
  });

  it('does not redefine Combat Challenge(X) pool reduction', async () => {
    const { challengePoolReduction } = await import('../src/system/pool-reduction.js');
    const actor = {
      system: {
        statusEffects: [
          { id: 'challenge', value: 4, sourceUuid: 'Actor.challenger', source: 'Boss' },
        ],
      },
    } as any;
    const hit = challengePoolReduction(actor, ['Actor.challenger']);
    const miss = challengePoolReduction(actor, ['Actor.other']);
    expect(hit.reduction).toBe(0);
    expect(miss.reduction).toBe(4);
  });
});
