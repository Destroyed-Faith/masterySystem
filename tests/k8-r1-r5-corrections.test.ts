/**
 * K0–K9 audit corrections: R1 Titan Growth, R2 Phasing tid, R3 reaction kinds,
 * R5 Moonlight Judgment bridge, R4 unknown-template diagnosis.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearIdentityShadowLog,
  compareIdentityDecision,
} from '../src/utils/identity-shadow.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';
import { isSanctionedPhasingName, resolvePowerMechanics } from '../src/utils/power-mechanics.js';
import {
  isReflectionReaction,
  isRiposteReaction,
  reactionMayRepeatThisRound,
} from '../src/combat/reaction-kind.js';
import { isLimitedPowerTemplateId } from '../src/combat/limited-charge.js';

describe('R1 Titan Growth stays Transformation utility until GM decision', () => {
  beforeEach(() => clearIdentityShadowLog());

  it('titan-growth row builds as utility/transformation with costsAction, not active-buff', () => {
    const flags = {
      echoArtifactKey: 'titanScars',
      artifactActivated: true,
      echoBound: 'giants',
    };
    const item = {
      id: 'titan-l1',
      type: 'artifact',
      name: 'Titan Scars - Level 1',
      flags: { 'mastery-system': flags },
      getFlag: (_ns: string, key: string) => (flags as any)[key],
      system: {
        level: 1,
        currentLevel: 1,
        equipped: true,
        binding: 'echo',
        levelProgression: [
          {
            level: 1,
            name: 'Titan Growth I',
            type: 'Transformation',
            artifactFunctionId: 'titan-growth',
            special: 'Artifact Function: Transformation (Growth 1)',
          },
        ],
      },
    };
    const opts = buildArtifactRadialOptions({ items: [item] }) as any[];
    const growth = opts.find((o) => o.artifactFunctionId === 'titan-growth');
    expect(growth).toBeTruthy();
    expect(growth.powerType).toBe('utility');
    expect(growth.tags).toContain('transformation');
    expect(growth.costsAction).toBe(true);
    expect(growth.artifactPowerTemplateId).toBeUndefined();
    expect(getSegmentIdForOption(growth)).toBe('utility');
  });

  it('Lor-Keth W1 shape (wrong tid + Titan Growth name) still matches name holdout', () => {
    // Stored identity is Active Buff (ab-armor-temp-hp); name holdout still routes to Growth.
    const option = {
      id: 'x',
      name: 'Titan Growth I',
      artifactPowerTemplateId: 'ab-armor-temp-hp',
      artifactRowSpecial: 'Active Buff: Armor + Temp HP',
    };
    const isTitanGrowth =
      (option as any).artifactFunctionId === 'titan-growth' ||
      /titan\s*growth/i.test(String(option.name || '')) ||
      String(option.artifactRowSpecial || '')
        .toLowerCase()
        .includes('transformation (growth');
    expect(isTitanGrowth).toBe(true);
  });
});

describe('R2 Phasing sanction receives templateId', () => {
  beforeEach(() => clearIdentityShadowLog());

  it('sanctioned templateId wins even with a non-whitelist display name', () => {
    expect(isSanctionedPhasingName('Custom Label', 'passive', 'passive-ghostform')).toBe(true);
    expect(isSanctionedPhasingName('Custom Label', 'buff', 'ab-phasing')).toBe(true);
    expect(isSanctionedPhasingName('Custom Label', 'reaction', 'reaction-phasing')).toBe(true);
  });

  it('wrong templateId fails closed even when name looks like Ghostform', () => {
    expect(isSanctionedPhasingName('Ghostform', 'passive', 'ab-armor')).toBe(false);
  });

  it('missing templateId keeps name bridge', () => {
    expect(isSanctionedPhasingName('Ghostform', 'passive', null)).toBe(true);
    expect(isSanctionedPhasingName('Phasing', 'passive')).toBe(true);
  });
});

describe('R3 unified reaction predicates', () => {
  beforeEach(() => clearIdentityShadowLog());

  it('riposte / reflection / repeatable agree for catalog ids', () => {
    const riposte = { name: 'Riposte', system: { templateId: 'reaction-riposte' } };
    const reflection = {
      name: 'Attack Reflection',
      system: { templateId: 'reaction-parry-reflection' },
    };
    const other = { name: 'Armor', system: { templateId: 'reaction-armor' } };

    expect(isRiposteReaction(riposte)).toBe(true);
    expect(isReflectionReaction(riposte)).toBe(false);
    expect(reactionMayRepeatThisRound(riposte)).toBe(true);

    expect(isReflectionReaction(reflection)).toBe(true);
    expect(isRiposteReaction(reflection)).toBe(false);
    expect(reactionMayRepeatThisRound(reflection)).toBe(false);

    expect(isRiposteReaction(other)).toBe(false);
    expect(isReflectionReaction(other)).toBe(false);
    expect(reactionMayRepeatThisRound(other)).toBe(false);
  });

  it('reflection eligibility does not treat unrelated *-reflection* templateIds as Attack Reflection', () => {
    const fake = { name: 'Mirror Ward', system: { templateId: 'reaction-mirror-reflection' } };
    // Identity-primary: only reaction-parry-reflection counts.
    expect(isReflectionReaction(fake)).toBe(false);
  });

  it('missing-ID name bridges stay aligned for riposte repeat', () => {
    const named = { name: 'Parry + Weapon Damage', system: {} };
    expect(isRiposteReaction(named)).toBe(true);
    expect(reactionMayRepeatThisRound(named)).toBe(true);
  });
});

describe('R5 Moonlight Judgment name bridge cannot override conflicting templateId', () => {
  beforeEach(() => clearIdentityShadowLog());

  it('structured non-Limited templateId blocks the name bridge (claimsLimited identity path)', () => {
    const optionName = 'Moonlight Judgment I';
    const templateId = 'ab-armor';
    const structuredClaimsLimited =
      false || isLimitedPowerTemplateId(templateId);
    const limitedNameBridge =
      /moonlight\s*judgment/i.test(optionName) || /undead\s*tracer/i.test(optionName);
    const legacyClaimsLimited = structuredClaimsLimited || limitedNameBridge;
    const claimsLimited = compareIdentityDecision(
      'executor.claimsLimited',
      legacyClaimsLimited,
      () => structuredClaimsLimited || (!templateId && limitedNameBridge),
      { name: optionName, templateId },
      { prefer: 'identity' },
    );
    expect(claimsLimited).toBe(false);

    const isMoonlightJudgment =
      (isLimitedPowerTemplateId(templateId) && /limited-aoe/i.test(templateId)) ||
      (!templateId && limitedNameBridge);
    expect(isMoonlightJudgment).toBe(false);
  });

  it('Limited AoE template still qualifies as Moonlight Judgment without relying on name', () => {
    const templateId = 'active-ranged-limited-aoe';
    const isMoonlightJudgment =
      (isLimitedPowerTemplateId(templateId) && /limited-aoe/i.test(templateId)) ||
      (!templateId && false);
    expect(isMoonlightJudgment).toBe(true);
  });

  it('name bridge remains when templateId is absent', () => {
    const templateId = '';
    const limitedNameBridge = /moonlight\s*judgment/i.test('Moonlight Judgment I');
    const isMoonlightJudgment =
      (isLimitedPowerTemplateId(templateId) && /limited-aoe/i.test(templateId)) ||
      (!templateId && limitedNameBridge);
    expect(isMoonlightJudgment).toBe(true);
  });
});

describe('R4 unknown templateId is diagnosed', () => {
  beforeEach(() => {
    clearIdentityShadowLog();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('warns and returns null for unknown templateId (no silent name recovery)', () => {
    const mech = resolvePowerMechanics({
      name: 'Broken Power',
      system: { templateId: 'does-not-exist-zzz', rank: 4 },
    });
    expect(mech).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown or unranked templateId "does-not-exist-zzz"'),
    );
  });
});
