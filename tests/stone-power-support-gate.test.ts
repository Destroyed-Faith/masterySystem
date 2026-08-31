import { describe, expect, it } from 'vitest';
import {
  TIER2_START_STONE_POWER_IDS,
  cumulativeStoneCostForTier,
  firstEffectiveStonePowerTier,
  stonePowerSkipsFirstTier,
  stonePowerSupportPrefillApplies,
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

describe('Stone Power Support cannot activate Tier 2', () => {
  it('Crit: first payment is T2 for 2 Stones; T2 support does not apply yet', () => {
    const first = resolveStonePowerActivation('agility.crit', 0, 2);
    expect(first.supportApplies).toBe(false);
    expect(first.tier).toBe(2);
    expect(first.cost).toBe(2);

    const second = resolveStonePowerActivation('agility.crit', 1, 2);
    expect(second.supportApplies).toBe(true);
    expect(second.tier).toBe(3);
    expect(second.cost).toBe(4);

    const third = resolveStonePowerActivation('agility.crit', 1, 4);
    expect(third.supportApplies).toBe(true);
    expect(third.tier).toBe(4);
    expect(third.cost).toBe(4);
  });

  it('gates every T2-start ability the same way', () => {
    for (const id of TIER2_START_STONE_POWER_IDS) {
      expect(stonePowerSupportPrefillApplies(id, 0)).toBe(false);
      expect(stonePowerSupportPrefillApplies(id, 1)).toBe(true);
      const first = resolveStonePowerActivation(id, 0, 2);
      expect(first.tier).toBe(2);
      expect(first.cost).toBe(2);
      expect(first.supportApplies).toBe(false);
    }
  });

  it('Healing (real T1) still requires the player to pay the first published tier', () => {
    const first = resolveStonePowerActivation('resolve.healing', 0, 2);
    expect(first.supportApplies).toBe(false);
    expect(first.tier).toBe(1);
    expect(first.cost).toBe(1);
    const second = resolveStonePowerActivation('resolve.healing', 1, 3);
    expect(second.supportApplies).toBe(true);
    expect(second.tier).toBe(3);
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
