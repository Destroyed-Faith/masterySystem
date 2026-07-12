import { describe, expect, it } from 'vitest';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import { getTemplate } from '../src/utils/powers/index.js';
import type { ArtifactProgressionPick } from '../src/types/item.js';

describe('deriveLevelProgressionFromPicks', () => {
  it('expands a power pick into three staged rows at L / L+3 / L+6 (PL 4/10/16)', () => {
    const picks: ArtifactProgressionPick[] = [
      { level: 1, kind: 'power', powerTemplateId: 'movement-safe-movement' },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows.map((r) => r.level)).toEqual([1, 4, 7]);

    const tpl = getTemplate('movement-safe-movement')!;
    // Stage I/II/III pull the catalog Power's PL 4 / 10 / 16 effect text verbatim.
    expect(rows[0].name).toBe(`${tpl.templateName} I`);
    expect(rows[0].effect).toBe(tpl.levels['4'].effect.text);
    expect(rows[1].name).toBe(`${tpl.templateName} II`);
    expect(rows[1].effect).toBe(tpl.levels['10'].effect.text);
    expect(rows[2].name).toBe(`${tpl.templateName} III`);
    expect(rows[2].effect).toBe(tpl.levels['16'].effect.text);
    // The per-stage text differs (the whole point: you see the scaling change).
    expect(rows[0].effect).not.toBe(rows[1].effect);
  });

  it('maps pick levels 1/2/3 to artifact levels 1-9', () => {
    const picks: ArtifactProgressionPick[] = [
      { level: 1, kind: 'power', powerTemplateId: 'movement-safe-movement' },
      { level: 2, kind: 'power', powerTemplateId: 'movement-flight' },
      { level: 3, kind: 'power', powerTemplateId: 'movement-leap' },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows.map((r) => r.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // No Level 10 Ultimate row.
    expect(rows.some((r) => r.level === 10)).toBe(false);
  });

  it('expands a stone-function pick into three support rows', () => {
    const picks: ArtifactProgressionPick[] = [
      {
        level: 1,
        kind: 'stoneFunction',
        stoneFunction: { kind: 'stonePowerSupport', attribute: 'might', stonePowerId: 'might.meleeDamage' },
      },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows.map((r) => r.level)).toEqual([1, 4, 7]);
    for (const r of rows) {
      expect(r.type).toBe('Stone Power Support');
      expect(r.duration).toBe('Instant');
      expect(r.effect).toContain('Supports the');
      expect(r.effect).toContain('Might');
      expect(r.effect).toContain('pre-fills Tier');
      expect(r.effect).toContain('has no effect');
    }
    expect(rows.map((r) => r.name)).toEqual(['Stone Support I', 'Stone Support II', 'Stone Support III']);
  });

  it('emits nothing for empty / none picks', () => {
    expect(deriveLevelProgressionFromPicks([])).toEqual([]);
    expect(deriveLevelProgressionFromPicks([{ level: 1, kind: 'none' }])).toEqual([]);
    // Unknown templateId is skipped (no crash, no rows).
    expect(
      deriveLevelProgressionFromPicks([{ level: 1, kind: 'power', powerTemplateId: 'does-not-exist' }]),
    ).toEqual([]);
  });

  it('binds chosenSpecial and uses Special-first display names for martial picks', () => {
    const picks: ArtifactProgressionPick[] = [
      {
        level: 1,
        kind: 'power',
        delivery: 'melee-aoe',
        powerTemplateId: 'active-melee-aoe-damage-t4',
        chosenSpecial: { key: 'mark', tier: 4 },
      },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows).toHaveLength(3);
    expect(rows[0].name).toBe('Melee AoE Special Damage (Mark) I');
    expect(rows[0].special.toLowerCase()).toContain('mark');
    expect(rows[0].special).not.toBe('SPECIAL');
  });

  it('binds chosenSpecial for catalog persistent zone picks', () => {
    const picks: ArtifactProgressionPick[] = [
      {
        level: 1,
        kind: 'power',
        powerTemplateId: 'active-ranged-zone-t3',
        chosenSpecial: { key: 'blight', tier: 3 },
      },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows[0].name).toContain('Blight');
    expect(rows[0].special.toLowerCase()).toContain('blight');
  });

  it('propagates Active-as-Spell flags from a ranged pick into staged rows', () => {
    const picks: ArtifactProgressionPick[] = [
      {
        level: 2,
        kind: 'power',
        powerTemplateId: 'active-ranged-aoe-smite-attack',
        isSpell: true,
        castingAttribute: 'resolve',
        spellResolution: 'spellAttack',
      },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r.isSpell).toBe(true);
      expect(r.castingAttribute).toBe('resolve');
      expect(r.spellResolution).toBe('spellAttack');
      expect(r.powerTemplateId).toBe('active-ranged-aoe-smite-attack');
      expect(r.special).toContain('Spell');
    }
  });

  it('binds optional Specials on weapon AoE picks with staged ranks', () => {
    const picks: ArtifactProgressionPick[] = [
      {
        level: 2,
        kind: 'power',
        powerTemplateId: 'active-melee-weapon-aoe',
        chosenSpecial: { key: 'lacerate', tier: 4 },
        displayName: 'Rending Spiral',
      },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows.map((r) => r.level)).toEqual([2, 5, 8]);
    expect(rows[0].special).toBe('Lacerate(3)');
    expect(rows[1].special).toBe('Lacerate(5)');
    expect(rows[2].special).toBe('Lacerate(7)');
  });

  it('honors custom stage power levels and numerals (Oracle Field I / III / V)', () => {
    const picks: ArtifactProgressionPick[] = [
      {
        level: 1,
        kind: 'power',
        powerTemplateId: 'ab-armor-aura',
        displayName: 'Oracle Field',
        stagePowerLevels: ['1', '3', '5'],
        stageNumerals: ['I', 'III', 'V'],
      },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    const tpl = getTemplate('ab-armor-aura')!;
    expect(rows.map((r) => r.name)).toEqual(['Oracle Field I', 'Oracle Field III', 'Oracle Field V']);
    expect(rows[0].effect).toBe(tpl.levels['1'].effect.text);
    expect(rows[1].effect).toBe(tpl.levels['3'].effect.text);
    expect(rows[2].effect).toBe(tpl.levels['5'].effect.text);
    expect(rows[0].aoe).toContain('2');
    expect(rows[1].aoe).toContain('6');
    expect(rows[2].aoe).toContain('10');
  });

  it('supports per-stage template ids on one pick (Serpent Evasion + Mobility Extension)', () => {
    const picks: ArtifactProgressionPick[] = [
      {
        level: 2,
        kind: 'power',
        powerTemplateId: 'ab-evade',
        displayName: 'Serpent Evasion',
        stageTemplateIds: ['ab-evade', 'extend-buff-mobility', 'extend-buff-mobility'],
        stageNames: ['Serpent Evasion I', 'Mobility Buff Extension II', 'Mobility Buff Extension III'],
      },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows.map((r) => r.name)).toEqual([
      'Serpent Evasion I',
      'Mobility Buff Extension II',
      'Mobility Buff Extension III',
    ]);
    expect(rows[0].powerTemplateId).toBe('ab-evade');
    expect(rows[1].powerTemplateId).toBe('extend-buff-mobility');
    expect(rows[0].effect).toContain('Evade');
    expect(rows[1].effect).toContain('Evade or Movement');
  });
});
