/**
 * Batch 9G.3 — Heart of Winter Frostwave = Melee AoE Special: Slow PL 4/8/16.
 */
import { describe, expect, it } from 'vitest';
import { getGeneralArtifact } from '../src/utils/general-artifacts.js';
import { buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import {
  meleeAoeInstantSlowRank,
  meleeAoeInstantSlowRadiusM,
} from '../src/utils/powers/instant-special-ranks.js';
import { bindPoolSpecialsOnRow } from '../src/utils/powers/pool-special-ranks.js';
import { isSpecialOnlyTemplateId } from '../src/combat/damage-transfer.js';

function rows() {
  const def = getGeneralArtifact('heartOfWinter')!;
  return resolveFullLevelProgression(def.levelProgression, buildEchoProgressionPicks(def) as any);
}

function frostwave(level: number) {
  return rows().find((r) => Number(r.level) === level)!;
}

describe('Batch 9G.3 — Heart of Winter Frostwave', () => {
  it('catalogue Instant AoE Slow PL 4/8/16 = Slow(5)/Slow(7)/Slow(10) radii 3/5/7', () => {
    expect(meleeAoeInstantSlowRank(4)).toBe(5);
    expect(meleeAoeInstantSlowRadiusM(4)).toBe(3);
    expect(meleeAoeInstantSlowRank(8)).toBe(7);
    expect(meleeAoeInstantSlowRadiusM(8)).toBe(5);
    expect(meleeAoeInstantSlowRank(16)).toBe(10);
    expect(meleeAoeInstantSlowRadiusM(16)).toBe(7);
    expect(meleeAoeInstantSlowRank(10)).toBe(9);
  });

  it('grants PL 4 / 8 / 16 (not PL 10 on middle unlock)', () => {
    const pick = buildEchoProgressionPicks(getGeneralArtifact('heartOfWinter')!).find(
      (p: any) => p.level === 3,
    ) as any;
    expect(pick.stagePowerLevels).toEqual(['4', '8', '16']);
    expect(pick.powerTemplateId).toBe('active-melee-aoe-damage-t4');
    expect(pick.chosenSpecial?.key).toBe('slow');
  });

  it('L3/6/9 print Slow(5)/Slow(7)/Slow(10), radii 3/5/7, and replace prior stages', () => {
    const stages = [
      { L: 3, name: 'Frostwave I', slow: 5, radius: 3, pl: 4 },
      { L: 6, name: 'Frostwave II', slow: 7, radius: 5, pl: 8 },
      { L: 9, name: 'Frostwave III', slow: 10, radius: 7, pl: 16 },
    ];
    for (const s of stages) {
      const row = frostwave(s.L);
      expect(row.name).toBe(s.name);
      expect(row.powerTemplateId).toBe('active-melee-aoe-damage-t4');
      expect(row.special).toMatch(new RegExp(`Slow\\(${s.slow}\\)`));
      expect(row.special).not.toMatch(/Slow\(9\)/);
      expect(String(row.aoe || '')).toMatch(new RegExp(`Radius\\s*${s.radius}\\s*m`, 'i'));
      expect(row.effect).toMatch(new RegExp(`Slow\\(${s.slow}\\)`));
      expect(row.effect).toMatch(new RegExp(`PL ${s.pl}`));
      expect(row.effect).toMatch(/no direct|no damage/i);
      expect(row.effect).not.toMatch(/\+\d+d8/);
      expect(row.effect).toMatch(/no direct Power, Weapon, or Spell Focus Damage/i);
      expect(isSpecialOnlyTemplateId(row.powerTemplateId!)).toBe(true);

      const tpl = getTemplate('active-melee-aoe-damage-t4')!;
      const bound = bindPoolSpecialsOnRow(
        structuredClone((tpl.levels as any)[String(s.pl)]),
        'slow',
        'active-melee-aoe-damage-t4',
        s.pl,
      );
      expect(bound.specials?.find((x: any) => x.key === 'slow')?.rank).toBe(s.slow);
      expect(bound.aoe?.radiusM).toBe(s.radius);
      expect(Number(bound.damage?.dice ?? bound.mechanics?.damageDice ?? 0)).toBe(0);
    }
    expect(frostwave(6).effect).toMatch(/replaces Frostwave I/i);
    expect(frostwave(9).effect).toMatch(/replaces Frostwave II/i);
    expect(frostwave(6).special).not.toMatch(/Slow\(9\)/);
    expect(frostwave(6).effect).not.toMatch(/Slow\(9\)/);
  });

  it('leaves Frozen Reserve, Glacial Intercept, and Awakening intact', () => {
    const by = new Map(rows().map((r) => [r.level, r]));
    expect(by.get(1)?.name).toMatch(/Frozen Reserve/);
    expect(by.get(2)?.name).toMatch(/Glacial Intercept/);
    expect(by.get(2)?.powerTemplateId).toBe('reaction-ally-armor');
    expect(by.get(10)?.name).toBe('Artifact Awakening');
    const tree = buildEchoArtifactTree(getGeneralArtifact('heartOfWinter')!);
    const sys = tree.nodes[5].itemData.system as any;
    const fw = sys.levelProgression.find((r: any) => /Frostwave II/i.test(String(r.name)));
    expect(fw?.special).toMatch(/Slow\(7\)/);
    expect(String(fw?.aoe || '')).toMatch(/Radius\s*5\s*m/i);
  });
});
