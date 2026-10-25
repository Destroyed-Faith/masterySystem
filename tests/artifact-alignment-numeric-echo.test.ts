/**
 * Numeric Echo Artifact verification (2026-10-25).
 *
 * For every registry Echo Artifact, every catalog-backed progression stage
 * must print the same Armor / damage-d8 / radius numbers as the live template
 * at that Power Level. Authored / Core-override rows are checked separately.
 *
 * Do not treat name/type-only scans as numeric PASS.
 */
import { describe, expect, it } from 'vitest';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import type { ArtifactProgressionPick, PowerLevelRow } from '../src/types/item.js';

function armorFromText(s: string): number | null {
  const m = String(s || '').match(/\+(\d+)\s*Armor\b/i);
  return m ? Number(m[1]) : null;
}

function d8FromText(s: string): number | null {
  const m = String(s || '').match(/\+(\d+)\s*d8\b/i);
  return m ? Number(m[1]) : null;
}

function radiusMetersFromText(s: string): number | null {
  const m = String(s || '').match(/(\d+)\s*m\b/i);
  return m ? Number(m[1]) : null;
}

function templateArmor(lr: PowerLevelRow | undefined): number | null {
  const mech = lr?.mechanics as { armor?: number } | undefined;
  if (typeof mech?.armor === 'number') return mech.armor;
  return armorFromText(String(lr?.effect?.text || ''));
}

function templateD8(lr: PowerLevelRow | undefined): number | null {
  const flat = String((lr?.mechanics as any)?.damageRider?.flat || lr?.effect?.dice || '');
  const fromFlat = d8FromText(flat.startsWith('+') ? flat : `+${flat}`);
  if (fromFlat != null) return fromFlat;
  return d8FromText(String(lr?.effect?.text || ''));
}

function templateRadius(lr: PowerLevelRow | undefined): number | null {
  const aoe = lr?.aoe as { radiusM?: number; m?: number } | null | undefined;
  if (typeof aoe?.radiusM === 'number') return aoe.radiusM;
  if (typeof aoe?.m === 'number') return aoe.m;
  return radiusMetersFromText(String(lr?.effect?.text || ''));
}

function stagePowerLevels(pick: ArtifactProgressionPick): string[] {
  const custom = pick.stagePowerLevels;
  if (Array.isArray(custom) && custom.length === 3) return custom.map(String);
  return ['4', '10', '16'];
}

describe('Draconic Roar — catalogue Armor Aura (not Core stale +12/+28/+44)', () => {
  it('compiled Roar stages are +4 / +10 / +16 Armor at 8 / 20 / 32 m', () => {
    const def = ECHO_ARTIFACTS.dragonHead;
    const picks = buildEchoProgressionPicks(def);
    const roar = picks.find((p) => /draconic\s*roar/i.test(String(p.displayName || '')));
    expect(roar?.powerTemplateId).toBe('ab-armor-aura');
    expect(roar?.stagePowerLevels).toEqual(['4', '10', '16']);

    const rows = deriveLevelProgressionFromPicks(picks as any)
      .filter((r) => /Draconic Roar/i.test(String(r.name || '')))
      .sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
    expect(rows).toHaveLength(3);

    const expected = [
      { armor: 4, radius: 8 },
      { armor: 10, radius: 20 },
      { armor: 16, radius: 32 },
    ];
    for (let i = 0; i < 3; i++) {
      expect(armorFromText(String(rows[i].effect))).toBe(expected[i].armor);
      expect(radiusMetersFromText(String(rows[i].aoe))).toBe(expected[i].radius);
      // Stale Core curve must not reappear.
      expect(armorFromText(String(rows[i].effect))).not.toBe([12, 28, 44][i]);
    }

    const aura = getTemplate('ab-armor-aura');
    expect(templateArmor(aura?.levels?.['4'])).toBe(4);
    expect(templateArmor(aura?.levels?.['10'])).toBe(10);
    expect(templateArmor(aura?.levels?.['16'])).toBe(16);
  });
});

describe('Every Echo Artifact — catalog-backed numeric stages', () => {
  for (const [key, def] of Object.entries(ECHO_ARTIFACTS)) {
    it(`${key}: each power pick stage matches template Armor / d8 / radius`, () => {
      const picks = buildEchoProgressionPicks(def);
      const fromPicks = deriveLevelProgressionFromPicks(picks as any);

      for (const pick of picks) {
        if (pick.kind !== 'power' || !pick.powerTemplateId) continue;
        // Breath / other Core-authored effect overrides are verified elsewhere.
        const hasEffectOverride =
          Array.isArray(pick.stageEffectTexts) && pick.stageEffectTexts.some((t) => String(t || '').trim());

        const pls = stagePowerLevels(pick);
        const display = String(pick.displayName || pick.powerTemplateId);
        const stageRows = fromPicks
          .filter((r) => String(r.powerTemplateId || '') === pick.powerTemplateId)
          .filter((r) => {
            const base = display.replace(/\s+[IVX]+$/i, '').trim();
            return new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(String(r.name || ''));
          })
          .sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));

        // Some artifacts share a template across picks; fall back to level slots.
        const rows =
          stageRows.length === 3
            ? stageRows
            : fromPicks
                .filter((r) => String(r.powerTemplateId || '') === pick.powerTemplateId)
                .sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0))
                .slice(0, 3);

        expect(rows.length, `${key}/${display} stage count`).toBeGreaterThanOrEqual(1);

        const tpl = getTemplate(pick.powerTemplateId);
        expect(tpl, `${key} missing template ${pick.powerTemplateId}`).toBeTruthy();

        for (let s = 0; s < Math.min(3, rows.length); s++) {
          const pl = pls[s];
          const lr = tpl?.levels?.[pl];
          expect(lr, `${key}/${display} PL ${pl}`).toBeTruthy();

          const catArmor = templateArmor(lr);
          const catD8 = templateD8(lr);
          const catRadius = templateRadius(lr);

          if (catArmor != null) {
            expect(armorFromText(String(rows[s].effect)), `${key}/${rows[s].name} armor`).toBe(catArmor);
          }
          if (!hasEffectOverride && catD8 != null) {
            // Effect overrides (Breath) print dual modes; skip d8 when overridden.
            const printed = d8FromText(String(rows[s].effect));
            if (printed != null) {
              expect(printed, `${key}/${rows[s].name} d8`).toBe(catD8);
            }
          }
          if (!hasEffectOverride && catRadius != null) {
            const aoeR = radiusMetersFromText(String(rows[s].aoe));
            const effectR = radiusMetersFromText(String(rows[s].effect));
            const printed = aoeR ?? effectR;
            if (printed != null) {
              expect(printed, `${key}/${rows[s].name} radius`).toBe(catRadius);
            }
          }
        }
      }
    });
  }
});

describe('Every Echo Artifact — full L1–10 table presence', () => {
  for (const [key, def] of Object.entries(ECHO_ARTIFACTS)) {
    it(`${key}: resolveFullLevelProgression yields staged levels + Awakening L10`, () => {
      const picks = buildEchoProgressionPicks(def);
      const table = resolveFullLevelProgression(def.levelProgression, picks as any);
      const levels = [...new Set(table.map((r) => Number(r.level) || 0))].sort((a, b) => a - b);
      // Primal Vestment has no L1 pick (Body exception: Flesh Remembers L2 + Rage Unbound L3 only).
      if (key === 'primalVestment') {
        expect(levels).toEqual([2, 3, 5, 6, 8, 9, 10]);
      } else {
        for (let lvl = 1; lvl <= 9; lvl++) {
          expect(levels.includes(lvl), `${key} missing artifact level ${lvl}`).toBe(true);
        }
        expect(levels.includes(10), `${key} missing L10`).toBe(true);
      }
      const l10 = table.find((r) => Number(r.level) === 10);
      expect(l10?.name).toMatch(/Artifact Awakening/i);

      // Every non-ultimate row that cites a catalog template must carry numeric
      // effect or aoe text (not empty placeholders).
      for (const row of table) {
        if (Number(row.level) === 10) continue;
        if (!row.powerTemplateId) continue;
        const blob = `${row.effect || ''} ${row.aoe || ''} ${row.special || ''}`;
        expect(blob.trim().length, `${key} L${row.level} ${row.name} empty numeric text`).toBeGreaterThan(0);
      }
    });
  }
});

describe('Oracle Field — catalogue Armor Aura PL 1/3/5', () => {
  it('compiled Field stages are +1 / +3 / +5 Armor', () => {
    const def = ECHO_ARTIFACTS.oracleFrame;
    const picks = buildEchoProgressionPicks(def);
    const rows = deriveLevelProgressionFromPicks(picks as any)
      .filter((r) => /Oracle Field/i.test(String(r.name || '')))
      .sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
    expect(rows.map((r) => armorFromText(String(r.effect)))).toEqual([1, 3, 5]);
    expect(rows.map((r) => radiusMetersFromText(String(r.aoe)))).toEqual([2, 6, 10]);
  });
});
