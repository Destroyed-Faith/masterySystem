/**
 * Stone Power Support under the universal four-Rank model.
 *
 * Support pre-fills exactly one named Rank: that Rank costs no Stones, every
 * lower Rank is activated and paid normally, and Support never skips unpaid
 * lower Ranks. Elorian Focus (Crit) and the Ringchain's Kept from Sight
 * (Not a Target) provide Rank 2 / 3 / 4 at their printed Artifact Levels.
 */
import { describe, expect, it } from 'vitest';
import {
  PREMIUM_STONE_POWER_IDS,
  STONE_POWERS,
  cumulativeStoneCostForRank,
  effectiveStoneSupportPrefillTier,
  stonePowerRankCost,
  stonePowerSupportPrefillApplies,
  stoneSupportPrefillLanes,
  stonePaymentLanesForTier,
  stonePaymentLaneCount,
} from '../src/stones/stone-powers';
import { resolveStonePowerActivation } from '../src/stones/stone-activation';
import { getArtifactStoneSupportPrefill } from '../src/utils/artifact-stone-functions';
import { ECHO_ARTIFACTS } from '../src/utils/echo-artifacts';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts';

describe('four-Rank cost structure', () => {
  it('every Ability publishes Ranks 1–4 and nothing above', () => {
    for (const power of Object.values(STONE_POWERS)) {
      expect(power.tiers).toHaveLength(4);
      expect(stonePowerRankCost(power.id, 5)).toBe(0);
    }
  });

  it('Premium cumulative costs are 2 / 6 / 12 / 20', () => {
    expect(cumulativeStoneCostForRank('agility.crit', 1)).toBe(2);
    expect(cumulativeStoneCostForRank('agility.crit', 2)).toBe(6);
    expect(cumulativeStoneCostForRank('agility.crit', 3)).toBe(12);
    expect(cumulativeStoneCostForRank('agility.crit', 4)).toBe(20);
  });

  it('Normal cumulative costs are 1 / 3 / 7 / 15', () => {
    expect(cumulativeStoneCostForRank('resolve.healing', 1)).toBe(1);
    expect(cumulativeStoneCostForRank('resolve.healing', 2)).toBe(3);
    expect(cumulativeStoneCostForRank('resolve.healing', 3)).toBe(7);
    expect(cumulativeStoneCostForRank('resolve.healing', 4)).toBe(15);
  });

  it('payment lanes follow the cost curve (Normal 15, Premium 20)', () => {
    expect(stonePaymentLaneCount('resolve.healing')).toBe(15);
    expect(stonePaymentLaneCount('agility.crit')).toBe(20);
    expect(stonePaymentLanesForTier('resolve.healing', 1)).toEqual([0]);
    expect(stonePaymentLanesForTier('resolve.healing', 4)).toEqual([7, 8, 9, 10, 11, 12, 13, 14]);
    expect(stonePaymentLanesForTier('agility.crit', 1)).toEqual([0, 1]);
    expect(stonePaymentLanesForTier('agility.crit', 3)).toEqual([6, 7, 8, 9, 10, 11]);
    expect(stonePaymentLanesForTier('agility.crit', 4)).toEqual([12, 13, 14, 15, 16, 17, 18, 19]);
    expect(stonePaymentLanesForTier('agility.crit', 5)).toEqual([]);
  });
});

describe('Support pre-fills exactly the named Rank', () => {
  it('the supported Rank costs no Stones; lower Ranks keep their normal costs', () => {
    // Crit with Rank 3 support: R1 pays 2, R2 pays 4, R3 free, R4 pays 8.
    expect(resolveStonePowerActivation('agility.crit', 0, 3)).toMatchObject({ tier: 1, cost: 2, legal: true });
    expect(resolveStonePowerActivation('agility.crit', 1, 3)).toMatchObject({ tier: 2, cost: 4, legal: true });
    expect(resolveStonePowerActivation('agility.crit', 2, 3)).toMatchObject({ tier: 3, cost: 0, legal: true });
    expect(resolveStonePowerActivation('agility.crit', 3, 3)).toMatchObject({ tier: 4, cost: 8, legal: true });
    expect(resolveStonePowerActivation('agility.crit', 4, 3).legal).toBe(false);
  });

  it('Rank 4 support requires Ranks 1–3 to be paid normally (never skips)', () => {
    // With Rank 4 support, the first three activations pay 2 / 4 / 6 and land
    // on Ranks 1 / 2 / 3 — support never jumps the sequence.
    expect(resolveStonePowerActivation('agility.crit', 0, 4)).toMatchObject({ tier: 1, cost: 2 });
    expect(resolveStonePowerActivation('agility.crit', 1, 4)).toMatchObject({ tier: 2, cost: 4 });
    expect(resolveStonePowerActivation('agility.crit', 2, 4)).toMatchObject({ tier: 3, cost: 6 });
    expect(resolveStonePowerActivation('agility.crit', 3, 4)).toMatchObject({ tier: 4, cost: 0 });
  });

  it('works the same for every Premium Ability', () => {
    for (const id of PREMIUM_STONE_POWER_IDS) {
      const first = resolveStonePowerActivation(id, 0, 2);
      expect(first.tier).toBe(1);
      expect(first.cost).toBe(2);
      const second = resolveStonePowerActivation(id, 1, 2);
      expect(second.tier).toBe(2);
      expect(second.cost).toBe(0);
    }
  });

  it('Normal Abilities: Rank 2 support keeps Rank 1 at cost 1', () => {
    expect(resolveStonePowerActivation('resolve.healing', 0, 2)).toMatchObject({ tier: 1, cost: 1 });
    expect(resolveStonePowerActivation('resolve.healing', 1, 2)).toMatchObject({ tier: 2, cost: 0 });
    expect(resolveStonePowerActivation('resolve.healing', 2, 2)).toMatchObject({ tier: 3, cost: 4 });
  });

  it('no support: full normal sequence', () => {
    expect(resolveStonePowerActivation('agility.crit', 0, 0)).toMatchObject({ tier: 1, cost: 2, supportApplies: false });
    expect(resolveStonePowerActivation('agility.crit', 3, 0)).toMatchObject({ tier: 4, cost: 8 });
  });

  it('gold lanes mark exactly the pre-filled Rank', () => {
    expect(stoneSupportPrefillLanes('agility.crit', 3)).toEqual([6, 7, 8, 9, 10, 11]);
    expect(stoneSupportPrefillLanes('agility.crit', 0)).toEqual([]);
    expect(effectiveStoneSupportPrefillTier('agility.crit', 9)).toBe(4);
    expect(stonePowerSupportPrefillApplies('agility.crit', 2)).toBe(true);
    expect(stonePowerSupportPrefillApplies('agility.crit', 0)).toBe(false);
  });
});

function echoActor(key: string, level: number) {
  return {
    id: `actor-${key}`,
    items: [
      {
        type: 'artifact',
        name: key,
        getFlag: (_ns: string, k: string) => (k === 'echoArtifactKey' ? key : undefined),
        system: {
          currentLevel: level,
          binding: 'echo',
          equipped: true,
          extraStoneFunctions: (ECHO_ARTIFACTS as any)[key]?.extraStoneFunctions ?? [],
        },
      },
    ],
  };
}

describe('Elorian Focus — Crit Rank 2 / 3 / 4 at Artifact Levels 3 / 6 / 9', () => {
  it('stores the printed stages', () => {
    const fn = ECHO_ARTIFACTS.elorianStride.extraStoneFunctions?.[0];
    expect(fn?.stonePowerId).toBe('agility.crit');
    expect(fn?.supportStages).toEqual([3, 6, 9]);
  });

  it('prefills Rank 2 from level 3, Rank 3 from level 6, Rank 4 from level 9', () => {
    const at = (lvl: number) =>
      getArtifactStoneSupportPrefill(echoActor('elorianStride', lvl), 'agility.crit', 'agility');
    expect(at(2)).toBe(0);
    expect(at(3)).toBe(2);
    expect(at(5)).toBe(2);
    expect(at(6)).toBe(3);
    expect(at(8)).toBe(3);
    expect(at(9)).toBe(4);
  });

  it('the level progression rows use the printed Core text', () => {
    const rows = ECHO_ARTIFACTS.elorianStride.levelProgression;
    const focus = rows.filter((r) => r.name.startsWith('Elorian Focus'));
    expect(focus.map((r) => r.level)).toEqual([3, 6, 9]);
    expect(focus[0]?.effect).toBe('Pre-fill Rank 2. Rank 1 must still be paid normally.');
    expect(focus[1]?.effect).toBe('Pre-fill Rank 3. Ranks 1 and 2 must still be paid normally.');
    expect(focus[2]?.effect).toBe('Pre-fill Rank 4. Ranks 1, 2, and 3 must still be paid normally.');
    for (const row of focus) {
      expect(row.type).toBe('Stone Power Support');
      expect(row.effect).not.toMatch(/Tier/);
    }
  });

  it('complete Crit sequence with Elorian Focus III: 2 / 4 / 6 / 0', () => {
    const prefill = getArtifactStoneSupportPrefill(echoActor('elorianStride', 9), 'agility.crit', 'agility');
    expect(prefill).toBe(4);
    const costs = [0, 1, 2, 3].map((uses) => resolveStonePowerActivation('agility.crit', uses, prefill).cost);
    expect(costs).toEqual([2, 4, 6, 0]);
    expect(resolveStonePowerActivation('agility.crit', 4, prefill).legal).toBe(false);
  });
});

describe('Ringchain — Not a Target Rank 2 / 3 / 4 at Artifact Levels 1 / 5 / 9', () => {
  it('stores the printed stages', () => {
    const fn = ECHO_ARTIFACTS.ringchainOfKeptNames.extraStoneFunctions?.[0];
    expect(fn?.stonePowerId).toBe('influence.notATarget');
    expect(fn?.supportStages).toEqual([1, 5, 9]);
  });

  it('prefills Rank 2 from level 1, Rank 3 from level 5, Rank 4 from level 9', () => {
    const at = (lvl: number) =>
      getArtifactStoneSupportPrefill(echoActor('ringchainOfKeptNames', lvl), 'influence.notATarget', 'influence');
    expect(at(1)).toBe(2);
    expect(at(4)).toBe(2);
    expect(at(5)).toBe(3);
    expect(at(8)).toBe(3);
    expect(at(9)).toBe(4);
  });

  it('the level progression rows use the printed Core text (no Tier language)', () => {
    const rows = ECHO_ARTIFACTS.ringchainOfKeptNames.levelProgression;
    const sight = rows.filter((r) => r.name.startsWith('Kept from Sight'));
    expect(sight.map((r) => r.level)).toEqual([1, 5, 9]);
    expect(sight[0]?.effect).toBe('Pre-fill Rank 2. Rank 1 must still be paid normally.');
    expect(sight[1]?.effect).toBe('Pre-fill Rank 3. Ranks 1 and 2 must still be paid normally.');
    expect(sight[2]?.effect).toBe('Pre-fill Rank 4. Ranks 1, 2, and 3 must still be paid normally.');
    for (const row of sight) {
      expect(row.type).toBe('Stone Power Support');
      expect(row.effect).not.toMatch(/Tier/);
    }
  });

  it('Not a Target with Kept from Sight II: pay R1+R2, R3 free, pay R4', () => {
    const prefill = getArtifactStoneSupportPrefill(
      echoActor('ringchainOfKeptNames', 5),
      'influence.notATarget',
      'influence',
    );
    expect(prefill).toBe(3);
    const costs = [0, 1, 2, 3].map((uses) => resolveStonePowerActivation('influence.notATarget', uses, prefill).cost);
    expect(costs).toEqual([2, 4, 0, 8]);
  });
});

describe('Heartseeker — Killing Focus shares the guarded Crit path', () => {
  it('supports agility.crit and cannot skip unpaid Ranks', () => {
    const fn = GENERAL_ARTIFACTS.heartseeker?.stoneFunction;
    expect(fn?.kind).toBe('stonePowerSupport');
    expect(fn?.stonePowerId).toBe('agility.crit');
    const first = resolveStonePowerActivation('agility.crit', 0, 4);
    expect(first.tier).toBe(1);
    expect(first.cost).toBe(2);
  });
});
