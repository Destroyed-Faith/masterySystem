import { describe, expect, it } from 'vitest';
import {
  TIER2_START_STONE_POWER_IDS,
  cumulativeStoneCostForTier,
  effectiveStoneSupportPrefillTier,
  firstEffectiveStonePowerTier,
  stonePowerSkipsFirstTier,
  stonePowerSupportPrefillApplies,
  stoneSupportPrefillLanes,
  STONE_POWERS,
} from '../src/stones/stone-powers';
import { critChargesProfile } from '../src/stones/stone-powers';
import { resolveStonePowerActivation } from '../src/stones/stone-activation';
import { auditTier2StartStonePowerSupports } from '../src/utils/artifact-stone-support-audit';
import { getArtifactStoneSupportPrefill } from '../src/utils/artifact-stone-functions';
import { ECHO_ARTIFACTS } from '../src/utils/echo-artifacts';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts';

describe('T2-start abilities have no Tier 1', () => {
  it('lists the eight abilities and stores no T1 slot', () => {
    expect([...TIER2_START_STONE_POWER_IDS]).toEqual([
      'might.parry',
      'agility.crit',
      'vitality.damageNegation',
      'intellect.spellAction',
      'resolve.damageReduction',
      'influence.notATarget',
      'wits.phasing',
      'generic.extraAttack',
    ]);
    for (const id of TIER2_START_STONE_POWER_IDS) {
      const power = STONE_POWERS[id];
      expect(stonePowerSkipsFirstTier(id)).toBe(true);
      expect(firstEffectiveStonePowerTier(id)).toBe(2);
      expect(power.startsAtTier).toBe(2);
      expect(power.tiers).toHaveLength(3);
      expect(power.effect).not.toContain('T1 (1)');
      expect(power.effect).toContain('T2 (2)');
      expect(power.effect).toContain('T3 (4)');
      expect(power.effect).toContain('T4 (8)');
      expect(power.tiers.some((t) => t.label == null || /ramp step/i.test(t.description))).toBe(false);
    }
    expect(firstEffectiveStonePowerTier('resolve.healing')).toBe(1);
    expect(stonePowerSkipsFirstTier('resolve.healing')).toBe(false);
  });

  it('uses cumulative costs 2 / 6 / 14', () => {
    expect(cumulativeStoneCostForTier(2, 2)).toBe(2);
    expect(cumulativeStoneCostForTier(3, 2)).toBe(6);
    expect(cumulativeStoneCostForTier(4, 2)).toBe(14);
  });
});

describe('Stone Power Support prefills sit above the first published tier', () => {
  it('Crit + printed T2 (Elorian Focus I) lifts to T3; player still pays 2 Stones', () => {
    expect(effectiveStoneSupportPrefillTier('agility.crit', 2)).toBe(3);
    expect(stoneSupportPrefillLanes('agility.crit', 2)).toEqual([3, 4, 5, 6]);
    expect(stonePowerSupportPrefillApplies('agility.crit', 2)).toBe(true);

    const first = resolveStonePowerActivation('agility.crit', 0, 2);
    expect(first.supportApplies).toBe(true);
    expect(first.tier).toBe(3);
    expect(first.cost).toBe(2);

    const second = resolveStonePowerActivation('agility.crit', 1, 2);
    expect(second.supportApplies).toBe(true);
    expect(second.tier).toBe(3);
    expect(second.cost).toBe(4);

    const high = resolveStonePowerActivation('agility.crit', 1, 4);
    expect(high.supportApplies).toBe(true);
    expect(high.tier).toBe(4);
    expect(high.cost).toBe(4);
  });

  it('a Tier 4 prefill cannot skip unpaid Crit tiers (none → T2 pays, support gives T3 → T4)', () => {
    const first = resolveStonePowerActivation('agility.crit', 0, 4);
    expect(first.supportApplies).toBe(true);
    expect(first.tier).toBe(3);
    expect(first.cost).toBe(2);

    const second = resolveStonePowerActivation('agility.crit', 1, 4);
    expect(second.tier).toBe(4);
    expect(second.cost).toBe(4);

    const third = resolveStonePowerActivation('agility.crit', 2, 4);
    expect(third.tier).toBe(4);
    expect(third.cost).toBe(8);
  });

  it('never prefills the first published T2 box on T2-start abilities', () => {
    for (const id of TIER2_START_STONE_POWER_IDS) {
      expect(stoneSupportPrefillLanes(id, 2)).toEqual([3, 4, 5, 6]);
      expect(stoneSupportPrefillLanes(id, 2)).not.toContain(1);
      expect(stoneSupportPrefillLanes(id, 2)).not.toContain(2);
      const first = resolveStonePowerActivation(id, 0, 2);
      expect(first.tier).toBe(3);
      expect(first.cost).toBe(2);
      expect(first.supportApplies).toBe(true);

      const jump = resolveStonePowerActivation(id, 0, 4);
      expect(jump.tier).toBe(3);
      expect(jump.cost).toBe(2);
    }
  });

  it('Healing (real T1): player pays the anchor, T2 is prefilled', () => {
    expect(effectiveStoneSupportPrefillTier('resolve.healing', 2)).toBe(2);
    expect(stoneSupportPrefillLanes('resolve.healing', 2)).toEqual([1, 2]);
    const first = resolveStonePowerActivation('resolve.healing', 0, 2);
    expect(first.supportApplies).toBe(true);
    expect(first.tier).toBe(2);
    expect(first.cost).toBe(1);
    const second = resolveStonePowerActivation('resolve.healing', 1, 3);
    expect(second.supportApplies).toBe(true);
    expect(second.tier).toBe(3);
    expect(second.cost).toBe(2);
  });
});

describe('T2-start support catalog follow-up', () => {
  it('no longer flags Elorian (prints Tier 3); Ringchain keeps its printed-T2 lift flag', () => {
    const hits = auditTier2StartStonePowerSupports();
    const keys = hits.map((h) => h.artifactKey);
    expect(keys).not.toContain('elorianStride');
    expect(keys).toContain('ringchainOfKeptNames');
    const ringchain = hits.find((h) => h.artifactKey === 'ringchainOfKeptNames');
    expect(ringchain?.stonePowerId).toBe('influence.notATarget');
    expect(ringchain?.firstPrefillTier).toBe(2);
  });
});

function elorianActor(level: number) {
  return {
    id: 'actor-elorian',
    items: [
      {
        type: 'artifact',
        name: 'Elorian Stride',
        getFlag: () => undefined,
        system: {
          currentLevel: level,
          binding: 'echo',
          equipped: true,
          extraStoneFunctions: ECHO_ARTIFACTS.elorianStride.extraStoneFunctions ?? [],
        },
      },
    ],
  };
}

describe('Elorian Focus (Crit Stone Power Support)', () => {
  it('stores the printed stages: Tier 3 from artifact level 3, Tier 4 from level 6', () => {
    const fn = ECHO_ARTIFACTS.elorianStride.extraStoneFunctions?.[0];
    expect(fn?.stonePowerId).toBe('agility.crit');
    expect(fn?.supportStages).toEqual([3, 3, 6]);
    expect(getArtifactStoneSupportPrefill(elorianActor(2), 'agility.crit', 'agility')).toBe(0);
    expect(getArtifactStoneSupportPrefill(elorianActor(3), 'agility.crit', 'agility')).toBe(3);
    expect(getArtifactStoneSupportPrefill(elorianActor(5), 'agility.crit', 'agility')).toBe(3);
    expect(getArtifactStoneSupportPrefill(elorianActor(6), 'agility.crit', 'agility')).toBe(4);
    expect(getArtifactStoneSupportPrefill(elorianActor(9), 'agility.crit', 'agility')).toBe(4);
  });

  it('Elorian Focus II (level 6, prefill 4): pay T2 → T3, pay T3 → T4', () => {
    const prefill = getArtifactStoneSupportPrefill(elorianActor(6), 'agility.crit', 'agility');
    expect(prefill).toBe(4);
    const first = resolveStonePowerActivation('agility.crit', 0, prefill);
    expect(first.tier).toBe(3);
    expect(first.cost).toBe(2);
    const second = resolveStonePowerActivation('agility.crit', 1, prefill);
    expect(second.tier).toBe(4);
    expect(second.cost).toBe(4);
  });

  it('Elorian Focus III (level 9) is an Artifact Function, not Tier 5', () => {
    const row = ECHO_ARTIFACTS.elorianStride.levelProgression.find((r) => r.level === 9);
    expect(row?.name).toBe('Elorian Focus III');
    expect(row?.type).toBe('Artifact Function');
    expect(row?.effect).toContain('one additional attack');
    expect(row?.effect).toContain('full normal Stone cost');
    expect(row?.effect).not.toMatch(/Tier 1|Tier 5/);

    expect(critChargesProfile(4, 8, 9)).toBe(4);
    expect(critChargesProfile(4, 4, 9)).toBe(3);
    expect(critChargesProfile(4, 8, 8)).toBe(3);
    expect(critChargesProfile(2, 2, 9)).toBe(1);
    expect(critChargesProfile(1, 1, 9)).toBe(0);
  });

  it('Heartseeker Killing Focus shares the same guarded Crit path', () => {
    const fn = GENERAL_ARTIFACTS.heartseeker?.stoneFunction;
    expect(fn?.kind).toBe('stonePowerSupport');
    expect(fn?.stonePowerId).toBe('agility.crit');
    const first = resolveStonePowerActivation('agility.crit', 0, 4);
    expect(first.tier).toBe(3);
    expect(first.cost).toBe(2);
  });
});
