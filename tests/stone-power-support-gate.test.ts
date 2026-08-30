import { describe, expect, it } from 'vitest';
import {
  BLANK_T1_STONE_POWER_IDS,
  firstEffectiveStonePowerTier,
  stonePowerHasBlankFirstTier,
  stonePowerSupportPrefillApplies,
} from '../src/stones/stone-powers';
import { resolveStonePowerActivation } from '../src/stones/stone-activation';
import { auditBlankT1StonePowerSupports } from '../src/utils/artifact-stone-support-audit';

describe('blank-T1 first effective tier', () => {
  it('lists the seven attribute ramp abilities and treats Extra Attack the same', () => {
    expect([...BLANK_T1_STONE_POWER_IDS]).toEqual([
      'might.parry',
      'agility.crit',
      'vitality.damageNegation',
      'intellect.spellAction',
      'resolve.damageReduction',
      'influence.notATarget',
      'wits.phasing',
    ]);
    for (const id of BLANK_T1_STONE_POWER_IDS) {
      expect(stonePowerHasBlankFirstTier(id)).toBe(true);
      expect(firstEffectiveStonePowerTier(id)).toBe(2);
    }
    expect(stonePowerHasBlankFirstTier('generic.extraAttack')).toBe(true);
    expect(firstEffectiveStonePowerTier('generic.extraAttack')).toBe(2);
    expect(firstEffectiveStonePowerTier('resolve.healing')).toBe(1);
  });
});

describe('Stone Power Support cannot activate the first effective tier', () => {
  it('Crit: paying only T1 never produces Crit even when an artifact prefills T2', () => {
    const first = resolveStonePowerActivation('agility.crit', 0, 2);
    expect(first.supportApplies).toBe(false);
    expect(first.tier).toBe(1);
    expect(first.cost).toBe(1);

    const second = resolveStonePowerActivation('agility.crit', 1, 2);
    expect(second.supportApplies).toBe(false);
    expect(second.tier).toBe(2);
    expect(second.cost).toBe(2);

    const third = resolveStonePowerActivation('agility.crit', 2, 4);
    expect(third.supportApplies).toBe(true);
    expect(third.tier).toBe(4);
    expect(third.cost).toBe(4);
  });

  it('gates every blank-T1 attribute ability the same way', () => {
    for (const id of BLANK_T1_STONE_POWER_IDS) {
      expect(stonePowerSupportPrefillApplies(id, 0)).toBe(false);
      expect(stonePowerSupportPrefillApplies(id, 1)).toBe(false);
      expect(stonePowerSupportPrefillApplies(id, 2)).toBe(true);
      expect(resolveStonePowerActivation(id, 0, 2).tier).toBe(1);
    }
  });

  it('Healing (real T1) still requires the player to pay the first effective tier', () => {
    const first = resolveStonePowerActivation('resolve.healing', 0, 2);
    expect(first.supportApplies).toBe(false);
    expect(first.tier).toBe(1);
    expect(first.cost).toBe(1);
    const second = resolveStonePowerActivation('resolve.healing', 1, 3);
    expect(second.supportApplies).toBe(true);
    expect(second.tier).toBe(3);
  });
});

describe('blank-T1 support catalog follow-up', () => {
  it('flags Elorian Focus, Ringchain, and any other first-effective support without changing tables', () => {
    const hits = auditBlankT1StonePowerSupports();
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
