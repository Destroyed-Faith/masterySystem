/**
 * Artefacts catalogue (2026-10-25) + Core Titan Scars alignment.
 */
import { describe, expect, it } from 'vitest';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts.js';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { weaponDamageForLevel } from '../src/utils/artifact-base-derive.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import {
  growthGeometry,
  titanScarsMaxGrowth,
  transformationUsesPerRest,
} from '../src/combat/transformation-growth.js';
import { BASE_VALUE_TABLES } from '../src/artifacts/echo-artifact-tree-builder.js';

describe('Moonlight Greatsword — Artefacts 2026-10-25', () => {
  const def = GENERAL_ARTIFACTS.moonlightGreatsword;
  const picks = buildEchoProgressionPicks(def as any);
  const table = resolveFullLevelProgression(def.levelProgression, picks as any);

  it('weapon damage is 4d8 base + 1d8 per level (5d8…14d8)', () => {
    expect(weaponDamageForLevel(1, 'twoHandedWeapon')).toBe('5d8');
    expect(weaponDamageForLevel(2, 'twoHandedWeapon')).toBe('6d8');
    expect(weaponDamageForLevel(10, 'twoHandedWeapon')).toBe('14d8');
    const bv = BASE_VALUE_TABLES.moonlightGreatsword;
    expect(String(bv.find((b) => b.slot === 'a')?.valueAt(1))).toBe('5d8');
    expect(String(bv.find((b) => b.slot === 'a')?.valueAt(10))).toBe('14d8');
  });

  it('Base B is Spell Focus (+4d8) from L4; Base C Expose(4) then Expose(5) at L10', () => {
    const focus = BASE_VALUE_TABLES.moonlightGreatsword.find((b) => b.type === 'spellFocus');
    const expose = BASE_VALUE_TABLES.moonlightGreatsword.find((b) => b.label === 'Expose');
    expect(focus?.unlock).toBe(4);
    expect(focus?.valueAt(4)).toBe(4);
    expect(expose?.unlock).toBe(7);
    expect(expose?.valueAt(7)).toBe(4);
    expect(expose?.valueAt(10)).toBe(5);
  });

  it('does not map Judgment to Requiem or L10 True Moonlight Ultimate', () => {
    const judgment = picks.find((p) => p.level === 2);
    expect(judgment?.powerTemplateId).toBe('active-ranged-weapon-aoe');
    expect(judgment?.isSpell).toBe(true);
    expect(String(judgment?.chosenSpecial?.key || '')).not.toMatch(/requiem/i);
    const l10 = table.find((r) => Number(r.level) === 10);
    expect(l10?.name).toMatch(/Artifact Awakening/i);
    expect(l10?.name).not.toMatch(/True Moonlight/i);
  });

  it('Mending / Judgment / Shadow use canonical templates at PL 4/10/16', () => {
    expect(picks[0].powerTemplateId).toBe('active-ranged-single-heal');
    expect(picks[1].powerTemplateId).toBe('active-ranged-weapon-aoe');
    expect(picks[2].powerTemplateId).toBe('ab-damage-aura');
    expect(getTemplate('active-ranged-single-heal')?.levels?.['4']?.effect?.dice).toMatch(/5d8/);
    expect(getTemplate('active-ranged-single-heal')?.levels?.['10']?.effect?.dice).toMatch(/12d8/);
    expect(getTemplate('active-ranged-single-heal')?.levels?.['16']?.effect?.dice).toMatch(/20d8/);
    const aoe4 = getTemplate('active-ranged-weapon-aoe')?.levels?.['4'];
    const aoe10 = getTemplate('active-ranged-weapon-aoe')?.levels?.['10'];
    const aoe16 = getTemplate('active-ranged-weapon-aoe')?.levels?.['16'];
    expect(aoe4?.aoe?.radiusM).toBe(3);
    expect(aoe10?.aoe?.radiusM).toBe(6);
    expect(aoe16?.aoe?.radiusM).toBe(8);
    expect(String(aoe4?.effect?.dice || aoe4?.mechanics?.damageRider?.flat)).toMatch(/3d8/);
    expect(String(aoe10?.effect?.dice || aoe10?.mechanics?.damageRider?.flat)).toMatch(/4d8/);
    expect(String(aoe16?.effect?.dice || aoe16?.mechanics?.damageRider?.flat)).toMatch(/8d8/);
  });
});

describe('Titan Scars — Core Transformation Growth', () => {
  const def = ECHO_ARTIFACTS.titanScars;
  const picks = buildEchoProgressionPicks(def);
  const fromPicks = deriveLevelProgressionFromPicks(picks as any);
  const table = resolveFullLevelProgression(def.levelProgression, picks as any);

  it('does not use ab-growth-form Active Buff', () => {
    expect(picks[0].kind).toBe('authored');
    expect(picks[0].powerTemplateId).toBeUndefined();
    expect(JSON.stringify(picks)).not.toMatch(/ab-growth-form/);
  });

  it('Growth I/II/III at L1/4/7 with Core geometry', () => {
    const g1 = table.find((r) => Number(r.level) === 1);
    const g2 = table.find((r) => Number(r.level) === 4);
    const g3 = table.find((r) => Number(r.level) === 7);
    expect(g1?.name).toMatch(/Titan Growth I/);
    expect(g1?.type).toMatch(/Transformation/i);
    expect(g1?.effect).toMatch(/Growth 1/);
    expect(g2?.effect).toMatch(/Growth 2/);
    expect(g3?.effect).toMatch(/Growth 3/);
    expect(growthGeometry(1).occupiedHexes).toBe(7);
    expect(growthGeometry(2).occupiedHexes).toBe(19);
    expect(growthGeometry(3).occupiedHexes).toBe(37);
    expect(growthGeometry(1).reachBonusM).toBe(2);
    expect(growthGeometry(2).rangeDoubled).toBe(true);
    expect(titanScarsMaxGrowth(2)).toBe(1);
    expect(titanScarsMaxGrowth(4)).toBe(2);
    expect(titanScarsMaxGrowth(7)).toBe(3);
    expect(transformationUsesPerRest(3)).toBe(3);
  });

  it('Might / Remove Scar Stone Power Support at L2/5/8 and L3/6/9', () => {
    expect(picks[1].kind).toBe('stoneFunction');
    expect((picks[1].stoneFunction as any)?.stonePowerId).toBe('might.meleeDamage');
    expect(picks[2].kind).toBe('stoneFunction');
    expect((picks[2].stoneFunction as any)?.stonePowerId).toBe('vitality.removeScar');
    expect(fromPicks.find((r) => r.level === 2)?.name).toMatch(/Titan Might/);
    expect(fromPicks.find((r) => r.level === 3)?.name).toMatch(/Titan Healing/);
  });

  it('Level 10 is Artifact Awakening, not True Titan Scars Ultimate', () => {
    const l10 = table.find((r) => Number(r.level) === 10);
    expect(l10?.name).toMatch(/Artifact Awakening/i);
    expect(l10?.name).not.toMatch(/True Titan/);
  });
});

describe('Missing Echo Artifacts registered', () => {
  it('registers Primal Vestment and Hollow Crown', () => {
    expect(ECHO_ARTIFACTS.primalVestment?.key).toBe('primalVestment');
    expect(ECHO_ARTIFACTS.hollowCrown?.key).toBe('hollowCrown');
    expect(ECHO_ARTIFACTS.primalVestment?.slot).toBe('body');
    expect(ECHO_ARTIFACTS.hollowCrown?.slot).toBe('head');
  });
});
