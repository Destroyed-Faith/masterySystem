/**
 * Authored artifact `stageEffectTexts` must not carry their own copies of
 * canonical Power values. Every Special rank, damage die and metre / HP / bar
 * number in an authored text must match the catalog row the compiler builds
 * for that pick, unless the whole text is printed verbatim in the PH.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as compiler from '../src/artifacts/progression-compiler.js';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts.js';
import { getTemplate } from '../src/utils/powers/index.js';
import { isLimitedPowerTemplateId } from '../src/combat/limited-charge.js';
import {
  breathDamageRadiusMeters,
  breathPowerDamageDice,
  breathRuinRadiusMeters,
  breathRuinValue,
} from '../src/utils/breath-weapon.js';
import { aoeSpecialRadiusM, aoeSpecialRank } from '../src/utils/powers/instant-special-ranks.js';

const norm = (s: string) => s.replace(/\*\*/g, '').replace(/\s+/g, ' ').toLowerCase();
const PH = norm(readFileSync('docs/Rules/Canonical/Players_Handbook.md', 'utf8'));
const LIMITED_DAMAGE_MULTIPLIER = 4;

type Finding = { where: string; problem: string };

function auditAuthoredTexts(): Finding[] {
  const findings: Finding[] = [];
  for (const defs of [ECHO_ARTIFACTS, GENERAL_ARTIFACTS] as Array<Record<string, any>>) {
    for (const def of Object.values(defs)) {
      if (!def.progressionPickSpecs) continue;
      const picks = buildEchoProgressionPicks(def) as any[];
      const rows = deriveLevelProgressionFromPicks(picks) as any[];
      for (const pick of picks) {
        if (!pick.stageEffectTexts?.length || !pick.powerTemplateId) continue;
        const tpl = getTemplate(pick.powerTemplateId) as any;
        pick.stageEffectTexts.forEach((txt: string, s: number) => {
          const level = pick.level + 3 * s;
          const where = `${def.key} L${level} ${pick.powerTemplateId}`;
          if (PH.includes(norm(txt))) return;
          const pl = String(pick.stagePowerLevels?.[s] ?? ['4', '10', '16'][s]);
          const lr = tpl?.levels?.[pl];
          if (!lr) {
            findings.push({ where, problem: `template has no PL ${pl}` });
            return;
          }
          const row = rows.find((r) => r.level === level && r.powerTemplateId === pick.powerTemplateId);
          const isBreath = pick.artifactFunctionId === 'dragon-breath';
          const rowSpecial = String(row?.special || '').toLowerCase();
          for (const m of txt.matchAll(/\b([A-Z][a-zA-Z ]*?)\((\d+)\)/g)) {
            const token = `${m[1].trim()}(${m[2]})`;
            if (isBreath && m[1].trim() === 'Ruin' && Number(m[2]) === breathRuinValue(level)) continue;
            if (!rowSpecial.includes(token.toLowerCase())) {
              findings.push({ where, problem: `${token} not in catalog row "${row?.special ?? ''}"` });
            }
          }
          const tplDice = String(lr.mechanics?.damageRider?.flat || lr.effect?.dice || '').replace(/^\+/, '');
          const diceMatch = tplDice.match(/^(\d+)d(\d+)$/);
          for (const m of txt.matchAll(/(\d+)d(\d+)/g)) {
            if (!diceMatch) {
              findings.push({ where, problem: `${m[0]} but template prints no damage dice` });
              continue;
            }
            const n = Number(m[1]);
            const base = Number(diceMatch[1]);
            const ok =
              m[2] === diceMatch[2] &&
              (n === base ||
                (isLimitedPowerTemplateId(pick.powerTemplateId) && n === base * LIMITED_DAMAGE_MULTIPLIER));
            if (!ok) findings.push({ where, problem: `${m[0]} differs from template ${tplDice}` });
          }
          const tplText = `${lr.effect?.text || ''} ${JSON.stringify(lr)}`;
          const stripped = txt.replace(/\b[IVX]+\b/g, '');
          for (const m of stripped.matchAll(/(\d+)\s*(m\b|Temporary HP|Scarred|HP|Health Bars?|bars?)/gi)) {
            const n = Number(m[1]);
            if (new RegExp(`\\b${n}\\b`).test(tplText)) continue;
            if (isBreath && /m/i.test(m[2]) && (n === breathRuinRadiusMeters(level) || n === breathDamageRadiusMeters(level))) continue;
            findings.push({ where, problem: `"${m[0]}" not printed by the template row` });
          }
        });
      }
    }
  }
  return findings;
}

describe('artifact authored effect texts carry no private Power values', () => {
  it('every number in a non-PH authored text matches the catalog row', () => {
    expect(auditAuthoredTexts()).toEqual([]);
  });

  it('Dragon Head Breath reads its dice, cones and Ruin ranks from the catalog', () => {
    const weaponAoe = getTemplate('active-melee-weapon-aoe') as any;
    for (const [level, pl] of [[1, 4], [4, 10], [7, 16]] as const) {
      const row = weaponAoe.levels[String(pl)];
      expect(breathDamageRadiusMeters(level)).toBe(row.aoe.radiusM);
      expect(`+${breathPowerDamageDice(level)}d8`).toBe(row.mechanics.damageRider.flat);
      expect(breathRuinValue(level)).toBe(aoeSpecialRank('melee', 'ruin', pl));
      expect(breathRuinRadiusMeters(level)).toBe(aoeSpecialRadiusM('melee', 'ruin', pl));
    }
  });

  it('the private weapon-AoE Special rank table stays removed', () => {
    const exported = Object.keys(compiler);
    expect(exported).not.toContain('WEAPON_AOE_PICK_SPECIAL_RANKS');
    expect(exported).not.toContain('injectOptionalWeaponAoeChosenSpecial');
    expect(exported).not.toContain('optionalWeaponAoeSpecialRank');
  });
});
