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
import { resolveStonePowerActivation } from '../src/stones/stone-activation';
import { auditTier2StartStonePowerSupports } from '../src/utils/artifact-stone-support-audit';

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

  it('never prefills the first published T2 box on T2-start abilities', () => {
    for (const id of TIER2_START_STONE_POWER_IDS) {
      expect(stoneSupportPrefillLanes(id, 2)).toEqual([3, 4, 5, 6]);
      expect(stoneSupportPrefillLanes(id, 2)).not.toContain(1);
      expect(stoneSupportPrefillLanes(id, 2)).not.toContain(2);
      const first = resolveStonePowerActivation(id, 0, 2);
      expect(first.tier).toBe(3);
      expect(first.cost).toBe(2);
      expect(first.supportApplies).toBe(true);
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
  it('flags Elorian Focus, Ringchain, and any other first-tier support without changing tables', () => {
    const hits = auditTier2StartStonePowerSupports();
    const keys = hits.map((h) => h.artifactKey);
    expect(keys).toContain('elorianStride');
    expect(keys).toContain('ringchainOfKeptNames');
    const elorian = hits.find((h) => h.artifactKey === 'elorianStride');
    expect(elorian?.stonePowerId).toBe('agility.crit');
    expect(elorian?.firstPrefillTier).toBe(2);
    expect(elorian?.firstEffectiveTier).toBe(2);
    const ringchain = hits.find((h) => h.artifactKey === 'ringchainOfKeptNames');
    expect(ringchain?.stonePowerId).toBe('influence.notATarget');
    expect(ringchain?.firstPrefillTier).toBe(2);
  });
});
