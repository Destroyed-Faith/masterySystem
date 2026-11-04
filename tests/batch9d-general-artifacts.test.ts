/**
 * Batch 9D — General Item Artifacts: L10 Artifact Awakening + remapped templates.
 */
import { describe, expect, it } from 'vitest';
import {
  GENERAL_ARTIFACTS,
  getGeneralArtifact,
} from '../src/utils/general-artifacts.js';
import { buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';

function rowsFor(key: string) {
  const def = getGeneralArtifact(key)!;
  return resolveFullLevelProgression(
    def.levelProgression,
    buildEchoProgressionPicks(def) as any,
  );
}

describe('Batch 9D — all 11 General Artifacts L10', () => {
  it('every General Artifact ends Level 10 with Artifact Awakening', () => {
    const keys = Object.keys(GENERAL_ARTIFACTS);
    expect(keys).toHaveLength(11);
    for (const key of keys) {
      const l10 = rowsFor(key).find((r: any) => r.level === 10);
      expect(l10?.name, key).toBe('Artifact Awakening');
      expect(String(l10?.effect || ''), key).toMatch(/Artifact Awakening/i);
    }
  });
});

describe('Batch 9D — remapped catalogue templates', () => {
  it('Soul Sigil Uncanny Soul is Reaction Temporary HP', () => {
    const row = rowsFor('soulSigil').find((r: any) => r.level === 2);
    expect(row?.name).toMatch(/Uncanny Soul/);
    expect(row?.powerTemplateId).toBe('reaction-temp-hp');
  });

  it('Frostbound Frost Throw is Instant Special Slow; Anvil is Melee Weapon AoE', () => {
    const frost = rowsFor('frostboundReturningAxe').find((r: any) => r.level === 2);
    const anvil = rowsFor('frostboundReturningAxe').find((r: any) => r.level === 3);
    expect(frost?.powerTemplateId).toBe('active-ranged-instant-special-t4');
    expect(frost?.chosenSpecialKey).toBe('slow');
    expect(anvil?.name).toMatch(/Ivaldi's Anvil/);
    expect(anvil?.powerTemplateId).toBe('active-melee-weapon-aoe');
  });

  it('Shadowgrave uses Grave Call + Deathly Reprisal (no Hands of the Grave)', () => {
    const rows = rowsFor('shadowgraveArmor');
    expect(rows.find((r: any) => r.level === 2)?.name).toMatch(/Grave Call/);
    expect(rows.find((r: any) => r.level === 2)?.powerTemplateId).toBe(
      'active-melee-control-push-pull',
    );
    expect(rows.find((r: any) => r.level === 3)?.name).toMatch(/Deathly Reprisal/);
    expect(rows.some((r: any) => /Hands of the Grave/i.test(r.name))).toBe(false);
  });

  it('Staff of the Dark uses Instant Hex + Damage Transfer + Instant Soulburn', () => {
    const rows = rowsFor('staffOfTheDark');
    expect(rows.find((r: any) => r.level === 1)?.powerTemplateId).toBe(
      'active-ranged-instant-special-t5',
    );
    expect(rows.find((r: any) => r.level === 1)?.chosenSpecialKey).toBe('hex');
    expect(rows.find((r: any) => r.level === 2)?.powerTemplateId).toBe(
      'active-ranged-single-target-damage-transfer',
    );
    expect(rows.find((r: any) => r.level === 3)?.powerTemplateId).toBe(
      'active-ranged-instant-special-t6',
    );
    expect(rows.find((r: any) => r.level === 3)?.chosenSpecialKey).toBe('soulburn');
  });

  it('Starfallen uses Force Reversal / Crystalized Root / Crystal Rain', () => {
    const rows = rowsFor('starfallenForceshield');
    expect(rows.find((r: any) => r.level === 1)?.name).toMatch(/Force Reversal/);
    expect(rows.find((r: any) => r.level === 2)?.chosenSpecialKey).toBe('root');
    expect(rows.find((r: any) => r.level === 3)?.name).toMatch(/Crystal Rain/);
    expect(rows.some((r: any) => /Reflection/i.test(r.name))).toBe(false);
  });

  it('Moonlight Shadow stays LEGACY Damage Aura; L10 is Awakening', () => {
    const rows = rowsFor('moonlightGreatsword');
    const shadow = rows.find((r: any) => r.level === 3);
    expect(shadow?.name).toMatch(/Moonlight Shadow/);
    expect(shadow?.powerTemplateId).toBe('ab-damage-aura');
    expect(rows.find((r: any) => r.level === 10)?.name).toBe('Artifact Awakening');
  });
});
