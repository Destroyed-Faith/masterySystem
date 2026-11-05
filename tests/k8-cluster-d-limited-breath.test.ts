/**
 * K8.d — Limited / Breath identity-primary with pre-K9 missing-ID name bridges.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearIdentityShadowLog,
  compareIdentityDecision,
  getIdentityShadowLog,
} from '../src/utils/identity-shadow.js';
import {
  isLimitedAttackDeclaration,
  isLimitedPowerTemplateId,
} from '../src/combat/limited-charge.js';
import { progressionRowRangeAoe } from '../src/utils/breath-weapon.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';

describe('K8.d Limited / Breath', () => {
  beforeEach(() => clearIdentityShadowLog());

  it('isLimitedAttackDeclaration prefers Limited template ids', () => {
    expect(
      isLimitedAttackDeclaration({
        templateId: 'active-melee-limited-single',
      }),
    ).toBe(true);
    expect(
      isLimitedAttackDeclaration({
        templateId: 'active-melee-weapon-aoe',
      }),
    ).toBe(false);
  });

  it('prefer identity: structured Limited wins over false legacy peer', () => {
    const decided = compareIdentityDecision(
      'executor.claimsLimited',
      false,
      () => isLimitedPowerTemplateId('active-ranged-limited-aoe'),
      { templateId: 'active-ranged-limited-aoe' },
      { prefer: 'identity' },
    );
    expect(decided).toBe(true);
  });

  it('prefer identity: unresolved falls back to legacy by default', () => {
    const decided = compareIdentityDecision(
      'executor.breathMode',
      'damage' as const,
      () => ({ kind: 'unresolved', reason: 'breath-mode-missing' }),
      {},
      { prefer: 'identity' },
    );
    expect(decided).toBe('damage');
  });

  it('prefer identity: unresolvedFallsBackToLegacy false surfaces unresolved', () => {
    const decided = compareIdentityDecision(
      'executor.breathMode',
      'damage' as const,
      () => ({ kind: 'unresolved', reason: 'breath-mode-missing' }),
      {},
      { prefer: 'identity', unresolvedFallsBackToLegacy: false },
    );
    expect(decided).toEqual({ kind: 'unresolved', reason: 'breath-mode-missing' });
  });

  it('breath display uses artifactFunctionId without name', () => {
    const out = progressionRowRangeAoe({
      name: 'Custom Label',
      level: 1,
      artifactFunctionId: 'dragon-breath',
      range: 'Self',
      aoe: 'old',
    });
    expect(out.aoe).toMatch(/Damage: Cone 3 m/);
    expect(out.aoe).toMatch(/Ruin: Cone 3 m/);
  });

  it('Ruin Breath radial option keeps K3 identity and ruin mode flags', () => {
    const head = {
      id: 'dh-k8d',
      type: 'artifact',
      name: 'Dragon Head',
      system: {
        equipped: true,
        binding: 'echo',
        currentLevel: 1,
        naturalWeapon: { name: 'Bite', weaponType: 'melee', hands: 0 },
        artifactWeapon: { damage: '1d8', name: 'Bite', isNatural: true },
        levelProgression: [
          {
            level: 1,
            name: 'Breath Weapon I',
            type: 'Melee AoE',
            powerTemplateId: 'active-melee-weapon-aoe',
            artifactFunctionId: 'dragon-breath',
            rank: 4,
          },
        ],
      },
      getFlag: (s: string, k: string) =>
        s === 'mastery-system' && k === 'artifactActivated' ? true : undefined,
    };
    const opts = buildArtifactRadialOptions({
      id: 'a1',
      system: { mastery: { rank: 3 } },
      items: [head],
      getFlag: () => undefined,
    });
    const ruin = opts.find((o) => /Ruin Breath/i.test(o.name));
    expect(ruin?.artifactFunctionId).toBe('dragon-breath');
    expect(ruin?.artifactPowerTemplateId).toBe('active-melee-weapon-aoe');
    expect((ruin as any)?.dragonHeadBreathMode).toBe('ruin');
  });

  it('default prefer remains legacy (C1 sites unchanged)', () => {
    clearIdentityShadowLog();
    const decided = compareIdentityDecision('test.legacyDefault', 'legacy', () => 'identity');
    expect(decided).toBe('legacy');
    expect(getIdentityShadowLog()[0]?.equal).toBe(false);
  });
});
