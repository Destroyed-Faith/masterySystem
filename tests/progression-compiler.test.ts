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
      expect(r.type).toBe('Support');
      expect(r.effect).toContain('Stone Power Support');
      expect(r.effect).toContain('Might');
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
        chosenSpecial: { key: 'poisoned', tier: 3 },
      },
    ];
    const rows = deriveLevelProgressionFromPicks(picks);
    expect(rows[0].name).toContain('Poisoned');
    expect(rows[0].special.toLowerCase()).toContain('poison');
  });
});
