/**
 * Batch 9B.1 — Witch Staff catalogue corrections (Root / Ruin / Blight).
 */
import { describe, expect, it } from 'vitest';
import {
  ECHO_ARTIFACTS,
  buildEchoProgressionPicks,
} from '../src/utils/echo-artifacts.js';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { bindPoolSpecialsOnRow } from '../src/utils/powers/pool-special-ranks.js';
import { instantSpecialRank } from '../src/utils/powers/instant-special-ranks.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { isSpecialOnlyTemplateId } from '../src/combat/damage-transfer.js';
import { loadPowerSnapshotForArtifactOption } from '../src/combat/raise-resolution.js';
import { artifactLevelToTemplateRank } from '../src/utils/artifact-spell-pick.js';
import type { RadialCombatOption } from '../src/radial-menu/types.js';

const STAFFS = ['witchStaffRoot', 'witchStaffRuin', 'witchStaffBlight'] as const;

function rowsFor(key: (typeof STAFFS)[number]) {
  const def = ECHO_ARTIFACTS[key];
  const picks = buildEchoProgressionPicks(def);
  return resolveFullLevelProgression(def.levelProgression, picks);
}

function rowAt(key: (typeof STAFFS)[number], level: number) {
  return rowsFor(key).find((r) => Number(r.level) === level)!;
}

describe('Batch 9B.1 — Witch Staff catalogue', () => {
  it('registers Binding Circle + Main Spell picks (no Special Overdrive / Damage Actives)', () => {
    for (const key of STAFFS) {
      const picks = buildEchoProgressionPicks(ECHO_ARTIFACTS[key]);
      const byLevel = Object.fromEntries(picks.map((p) => [p.level, p]));
      expect(byLevel[1]?.kind).toBe('stoneFunction');
      expect(byLevel[1]?.stoneFunction?.stonePowerId).toBe('intellect.raises');

      expect(byLevel[2]?.kind).toBe('power');
      expect(byLevel[2]?.displayName).toBe('Binding Circle');
      expect(byLevel[2]?.powerTemplateId).toBe('active-ranged-aoe-damage-t5');
      expect(byLevel[2]?.chosenSpecial?.key).toBe('root');
      expect(byLevel[2]?.isSpell).toBe(true);

      expect(byLevel[3]?.kind).toBe('power');
      expect(byLevel[3]?.displayName).toBe('Main Spell');
      expect(byLevel[3]?.isSpell).toBe(true);
      expect(String(byLevel[3]?.powerTemplateId)).toMatch(
        /^active-ranged-instant-special-t[346]$/,
      );
      expect(String(byLevel[3]?.powerTemplateId)).not.toMatch(/damage-t/);
      expect(byLevel[3]?.powerTemplateId).not.toBe('ab-special-overdrive');
    }
  });

  it('Main Spell Special keys are Weaken / Ruin / Blight by tradition', () => {
    expect(buildEchoProgressionPicks(ECHO_ARTIFACTS.witchStaffRoot)[2]?.chosenSpecial?.key).toBe(
      'weaken',
    );
    expect(buildEchoProgressionPicks(ECHO_ARTIFACTS.witchStaffRuin)[2]?.chosenSpecial?.key).toBe(
      'ruin',
    );
    expect(buildEchoProgressionPicks(ECHO_ARTIFACTS.witchStaffBlight)[2]?.chosenSpecial?.key).toBe(
      'blight',
    );
  });

  it('Binding Circle PL 4/10/16 → Root(3/5/7), range 20/44/68, radius 3/6/7', () => {
    for (const key of STAFFS) {
      const levels = [
        { L: 2, root: 3, range: '20 m', radius: '3' },
        { L: 5, root: 5, range: '44 m', radius: '6' },
        { L: 8, root: 7, range: '68 m', radius: '7' },
      ];
      for (const exp of levels) {
        const row = rowAt(key, exp.L);
        expect(row.name).toMatch(/Binding Circle/);
        expect(row.powerTemplateId).toBe('active-ranged-aoe-damage-t5');
        expect(row.chosenSpecialKey).toBe('root');
        expect(row.special).toMatch(new RegExp(`Root\\(${exp.root}\\)`));
        expect(String(row.range)).toContain(exp.range.replace(' m', ''));
        expect(String(row.aoe)).toMatch(new RegExp(`${exp.radius}\\s*m`));
        expect(String(row.effect)).toMatch(/no Power damage/i);
        expect(isSpecialOnlyTemplateId(row.powerTemplateId)).toBe(true);
      }
    }
  });

  it('Main Spell printed ranks match PH (Weaken 2/3/4, Ruin 6/10/13, Blight 7/12/15)', () => {
    const cases: Array<{
      key: (typeof STAFFS)[number];
      special: string;
      ranks: [number, number, number];
      templateId: string;
    }> = [
      {
        key: 'witchStaffRoot',
        special: 'Weaken',
        ranks: [2, 3, 4],
        templateId: 'active-ranged-instant-special-t6',
      },
      {
        key: 'witchStaffRuin',
        special: 'Ruin',
        ranks: [6, 10, 13],
        templateId: 'active-ranged-instant-special-t4',
      },
      {
        key: 'witchStaffBlight',
        special: 'Blight',
        ranks: [7, 12, 15],
        templateId: 'active-ranged-instant-special-t3',
      },
    ];
    for (const c of cases) {
      const stages = [
        { L: 3, rank: c.ranks[0], pl: 4 },
        { L: 6, rank: c.ranks[1], pl: 10 },
        { L: 9, rank: c.ranks[2], pl: 16 },
      ];
      for (const s of stages) {
        const row = rowAt(c.key, s.L);
        expect(row.name).toMatch(/Main Spell/);
        expect(row.powerTemplateId).toBe(c.templateId);
        expect(row.special).toMatch(new RegExp(`${c.special}\\(${s.rank}\\)`));
        expect(String(row.effect)).toMatch(new RegExp(`${c.special}\\(${s.rank}\\)`));
        expect(String(row.effect)).toMatch(/no Power damage/i);
        expect(isSpecialOnlyTemplateId(row.powerTemplateId)).toBe(true);
        // Instant Special catalogue ranks (Actives.md) must agree.
        expect(instantSpecialRank('ranged', c.special.toLowerCase(), s.pl)).toBe(s.rank);
      }
    }
  });

  it('keeps Witch Stone Rank 2/3/4 and Artifact Awakening unchanged', () => {
    for (const key of STAFFS) {
      expect(rowAt(key, 1).name).toMatch(/Witch Stone I/);
      expect(String(rowAt(key, 1).effect)).toMatch(/Rank 2/);
      expect(rowAt(key, 1).special).toBe('intellect.raises');
      expect(rowAt(key, 4).name).toMatch(/Witch Stone II/);
      expect(String(rowAt(key, 4).effect)).toMatch(/Rank 3/);
      expect(rowAt(key, 7).name).toMatch(/Witch Stone III/);
      expect(String(rowAt(key, 7).effect)).toMatch(/Rank 4/);
      expect(rowAt(key, 10).name).toBe('Artifact Awakening');
      expect(rowAt(key, 10).special).toMatch(/Awakening/);
    }
  });

  it('Binding Circle runtime snapshot is special-only Root with catalogue ranks', async () => {
    for (const artifactLevel of [2, 5, 8] as const) {
      const expectedRank = artifactLevel === 2 ? 3 : artifactLevel === 5 ? 5 : 7;
      const option = {
        artifactPowerTemplateId: 'active-ranged-aoe-damage-t5',
        artifactChosenSpecialKey: 'root',
        artifactRowLevel: artifactLevel,
        artifactIsSpell: true,
      } as RadialCombatOption;
      const loaded = await loadPowerSnapshotForArtifactOption(option);
      expect(loaded).toBeTruthy();
      expect(loaded!.snapshot.damageDice).toBe(0);
      const root = loaded!.snapshot.specials.find((s) => s.key === 'root');
      expect(root?.rank).toBe(expectedRank);
      const pl = Number(artifactLevelToTemplateRank(artifactLevel));
      const tpl = getTemplate('active-ranged-aoe-damage-t5')!;
      const bound = bindPoolSpecialsOnRow(
        structuredClone(tpl.levels![String(pl)]),
        'root',
        'active-ranged-aoe-damage-t5',
        pl,
      );
      expect(bound.specials?.[0]?.rank).toBe(expectedRank);
      expect(bound.aoe?.radiusM).toBe(artifactLevel === 2 ? 3 : artifactLevel === 5 ? 6 : 7);
    }
  });

  it('Main Spell runtime snapshots are special-only with zero damage dice', async () => {
    const cases = [
      { key: 'weaken', tid: 'active-ranged-instant-special-t6', L: 3, rank: 2 },
      { key: 'ruin', tid: 'active-ranged-instant-special-t4', L: 3, rank: 6 },
      { key: 'blight', tid: 'active-ranged-instant-special-t3', L: 3, rank: 7 },
    ] as const;
    for (const c of cases) {
      const option = {
        artifactPowerTemplateId: c.tid,
        artifactChosenSpecialKey: c.key,
        artifactRowLevel: c.L,
        artifactIsSpell: true,
      } as RadialCombatOption;
      const loaded = await loadPowerSnapshotForArtifactOption(option);
      expect(loaded!.snapshot.damageDice).toBe(0);
      expect(loaded!.snapshot.specials.some((s) => s.key === c.key && s.rank === c.rank)).toBe(
        true,
      );
    }
  });

  it('compiled pick table has exactly nine non-awakening stages per staff (3×3)', () => {
    for (const key of STAFFS) {
      const fromPicks = deriveLevelProgressionFromPicks(
        buildEchoProgressionPicks(ECHO_ARTIFACTS[key]) as any,
      );
      expect(fromPicks).toHaveLength(9);
      expect(fromPicks.filter((r) => /Binding Circle/i.test(r.name))).toHaveLength(3);
      expect(fromPicks.filter((r) => /Main Spell/i.test(r.name))).toHaveLength(3);
      expect(fromPicks.filter((r) => /Witch Stone/i.test(r.name))).toHaveLength(3);
      expect(fromPicks.some((r) => /Overdrive|Damage — Tier/i.test(r.name))).toBe(false);
    }
  });
});
