/**
 * Batch 9E — Judicator / Stonebound / Alchemist / Dragon Claws corrections.
 */
import { describe, expect, it } from 'vitest';
import {
  buildEchoProgressionPicks,
  getEchoArtifact,
} from '../src/utils/echo-artifacts.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { loadPowerSnapshotForArtifactOption } from '../src/combat/raise-resolution.js';
import { isSpecialOnlyTemplateId } from '../src/combat/damage-transfer.js';
import { getArtifactStoneSupportPrefill } from '../src/utils/artifact-stone-functions.js';

function rows(key: string) {
  const def = getEchoArtifact(key)!;
  return resolveFullLevelProgression(def.levelProgression, buildEchoProgressionPicks(def) as any);
}

function row(key: string, level: number) {
  return rows(key).find((r) => Number(r.level) === level)!;
}

function activated(key: string, level: number) {
  const tree = buildEchoArtifactTree(getEchoArtifact(key)!);
  const node = tree.nodes[level - 1];
  return {
    id: `${key}-l${level}`,
    type: 'artifact',
    name: node.itemData.name,
    system: { ...(node.itemData.system as any), equipped: true, binding: 'echo' },
    getFlag: (_ns: string, k: string) => (k === 'artifactActivated' ? true : undefined),
  };
}

describe('Batch 9E — Judicator Frame', () => {
  it('L3/6/9 are Resolve Healing Support Rank 2/3/4 (not Influence Recovery)', () => {
    for (const [lvl, rank] of [
      [3, 2],
      [6, 3],
      [9, 4],
    ] as const) {
      const r = row('judicatorFrame', lvl);
      expect(r.name).toMatch(/Self Healing Support/);
      expect(r.special).toBe('resolve.healing');
      expect(r.effect).toMatch(new RegExp(`Rank ${rank}`));
      expect(r.effect).toMatch(/yourself only/i);
      expect(r.effect).not.toMatch(/colorless|Influence|Regeneration/i);
    }
    const picks = buildEchoProgressionPicks(getEchoArtifact('judicatorFrame')!);
    expect(picks.find((p: any) => p.level === 3)?.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'resolve',
      stonePowerId: 'resolve.healing',
    });
    const actor = {
      id: 'a1',
      items: [activated('judicatorFrame', 6)],
    };
    expect(getArtifactStoneSupportPrefill(actor, 'resolve.healing', 'resolve')).toBe(3);
    expect(getArtifactStoneSupportPrefill(actor, 'influence.colorlessRecovery', 'influence')).toBe(0);
  });
});

describe('Batch 9E — Stonebound Soles', () => {
  it('Anchoring Stance is Active Buff Temporary HP 32/77/122 with MR duration', () => {
    const tpl = getTemplate('ab-temp-hp')!;
    for (const [lvl, thp, pl] of [
      [1, 32, 4],
      [4, 77, 10],
      [7, 122, 16],
    ] as const) {
      const r = row('stoneboundSoles', lvl);
      expect(r.powerTemplateId).toBe('ab-temp-hp');
      expect(r.effect).toMatch(new RegExp(`${thp} Temporary HP`));
      expect(r.effect).not.toMatch(/Immovable/i);
      expect(r.duration).toMatch(/Mastery Rank|MR Rounds/i);
      expect(String((tpl.levels as any)[String(pl)]?.effect?.text || '')).toMatch(
        new RegExp(`${thp}`),
      );
    }
    expect(rows('stoneboundSoles').every((r) => r.powerTemplateId !== 'ab-immovable-temp-hp')).toBe(
      true,
    );
  });
});

describe('Batch 9E — Alchemist Coat', () => {
  it('L2/5/8 are Potion Active Buff Empowerment, not Maximization', () => {
    const picks = buildEchoProgressionPicks(getEchoArtifact('alchemistCoat')!);
    expect(picks.find((p: any) => p.level === 2)?.powerTemplateId).toBe('empower-buff-damage');
    expect(picks.find((p: any) => p.level === 2)?.kind).toBe('power');
    expect((picks.find((p: any) => p.level === 2) as any)?.stoneFunction).toBeFalsy();

    for (const [lvl, pl, rounds] of [
      [2, 1, 1],
      [5, 2, 2],
      [8, 3, 3],
    ] as const) {
      const r = row('alchemistCoat', lvl);
      expect(r.name).toMatch(/Alchemist Stone/);
      expect(r.type).toMatch(/Artifact Function|Support/i);
      expect(r.effect).toMatch(new RegExp(`\\+${pl}`));
      expect(r.effect).toMatch(new RegExp(`\\+${rounds} Rounds`, 'i'));
      expect(r.effect).toMatch(/Red Potion|Black Potion/);
      expect(r.effect).not.toMatch(/Maximization|Extend Active Buff|pre-fill/i);
    }
    expect(getEchoArtifact('alchemistCoat')!.stoneFunction).toBeFalsy();
  });
});

describe('Batch 9E — Dragon Claws', () => {
  it('Rending Spiral II is Lacerate(9); I/III stay 5/10; special-only (no Power Dice)', async () => {
    expect(row('dragonClaws', 2).special).toBe('Lacerate(5)');
    expect(row('dragonClaws', 5).special).toBe('Lacerate(9)');
    expect(row('dragonClaws', 8).special).toBe('Lacerate(10)');
    expect(isSpecialOnlyTemplateId('active-melee-aoe-damage-t4')).toBe(true);

    const stageII = await loadPowerSnapshotForArtifactOption({
      artifactPowerTemplateId: 'active-melee-aoe-damage-t4',
      artifactChosenSpecialKey: 'lacerate',
      artifactRowLevel: 5,
      artifactIsSpell: false,
    } as any);
    expect(stageII?.snapshot.specials).toEqual([{ key: 'lacerate', rank: 9 }]);
    expect(stageII?.snapshot.damageDice ?? 0).toBe(0);
  });

  it('Tail Sweep is ST Push 8/20/32 + weapon path; no Power Dice; other special-only stay 0 damage', async () => {
    for (const [lvl, meters] of [
      [3, 8],
      [6, 20],
      [9, 32],
    ] as const) {
      const r = row('dragonClaws', lvl);
      expect(r.powerTemplateId).toBe('active-melee-control-push-pull');
      expect(r.effect).toMatch(new RegExp(`Push ${meters} m`));
      expect(r.effect).toMatch(/Weapon Damage/i);
      expect(r.effect).toMatch(/Artifact Special Rule/i);
      expect(String(r.aoe || '')).not.toMatch(/radius/i);
    }
    expect(isSpecialOnlyTemplateId('active-melee-control-push-pull')).toBe(false);
    expect(isSpecialOnlyTemplateId('active-melee-instant-special-t4')).toBe(true);

    const loaded = await loadPowerSnapshotForArtifactOption({
      artifactPowerTemplateId: 'active-melee-control-push-pull',
      artifactChosenSpecialKey: 'push',
      artifactRowLevel: 3,
      artifactIsSpell: false,
    } as any);
    expect(loaded?.snapshot.specials).toEqual(
      expect.arrayContaining([{ key: 'push', rank: 8 }]),
    );
    expect(loaded?.snapshot.damageDice ?? 0).toBe(0);
  });
});
