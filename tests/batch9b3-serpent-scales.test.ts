/**
 * Batch 9B.3 — Serpent Scales catalogue corrections (PH ~2853–2862).
 */
import { describe, expect, it } from 'vitest';
import {
  buildEchoProgressionPicks,
  getEchoArtifact,
} from '../src/utils/echo-artifacts.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { artifactLevelToTemplateRank } from '../src/utils/artifact-spell-pick.js';
import {
  getArtifactStoneSupportPrefill,
} from '../src/utils/artifact-stone-functions.js';

function activeItemFromNode(node: any) {
  const system = { ...(node.itemData.system as any), binding: 'echo' };
  return {
    id: 'serpent-scales-item',
    name: 'Serpent Scales',
    type: 'artifact',
    system,
    getFlag: (scope: string, key: string) =>
      scope === 'mastery-system' && key === 'artifactActivated' ? true : undefined,
  };
}

function actorWith(item: any) {
  return { id: 'actor-1', items: [item] };
}

function fullRows() {
  const def = getEchoArtifact('wyrmScalesLight')!;
  return resolveFullLevelProgression(def.levelProgression, buildEchoProgressionPicks(def) as any);
}

function rowAt(level: number) {
  return fullRows().find((r) => Number(r.level) === level)!;
}

describe('Batch 9B.3 — Serpent Scales', () => {
  it('prints the full PH progression L1–10', () => {
    const expected = [
      [1, 'Dragon Wings I'],
      [2, 'Serpent Evasion I'],
      [3, 'Evasion Stone Support I'],
      [4, 'Dragon Wings II'],
      [5, 'Serpent Evasion II'],
      [6, 'Evasion Stone Support II'],
      [7, 'Dragon Wings III'],
      [8, 'Serpent Evasion III'],
      [9, 'Evasion Stone Support III'],
      [10, 'Artifact Awakening'],
    ] as const;
    for (const [lvl, name] of expected) {
      expect(rowAt(lvl).name).toBe(name);
    }
    expect(fullRows().some((r) => /Mobility Extension/i.test(r.name))).toBe(false);
  });

  it('Serpent Evasion is Active Buff: Evade at PL 4/10/16 with +8/+20/+32', () => {
    const stages = [
      { L: 2, pl: 4, evade: 8 },
      { L: 5, pl: 10, evade: 20 },
      { L: 8, pl: 16, evade: 32 },
    ];
    const tpl = getTemplate('ab-evade')!;
    for (const s of stages) {
      const row = rowAt(s.L);
      expect(row.powerTemplateId).toBe('ab-evade');
      expect(row.type).toMatch(/Active Buff/i);
      expect(row.effect).toMatch(new RegExp(`\\+${s.evade} Evade`));
      expect(Number(artifactLevelToTemplateRank(s.L))).toBe(s.pl);
      const levelRow = tpl.levels![String(s.pl)] as any;
      expect(String(levelRow.effect?.text || '')).toMatch(new RegExp(`\\+${s.evade} Evade`));
    }
  });

  it('Dragon Wings remain Flight 6/15/24 m at PL 4/10/16', () => {
    const stages = [
      { L: 1, m: 6 },
      { L: 4, m: 15 },
      { L: 7, m: 24 },
    ];
    for (const s of stages) {
      const row = rowAt(s.L);
      expect(row.powerTemplateId).toBe('movement-flight');
      expect(row.effect).toMatch(new RegExp(`${s.m}\\s*m`));
    }
  });

  it('Agility Evade Stone Support prefills Rank 2/3/4 at L3/6/9', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('wyrmScalesLight')!);
    const prefill = (level: number) =>
      getArtifactStoneSupportPrefill(
        actorWith(activeItemFromNode(tree.nodes[level - 1])),
        'agility.evade',
        'agility',
      );
    expect(prefill(2)).toBe(0);
    expect(prefill(3)).toBe(2);
    expect(prefill(6)).toBe(3);
    expect(prefill(9)).toBe(4);
  });

  it('tree grants only ab-evade for Serpent Evasion stages (no extend-buff-mobility)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('wyrmScalesLight')!);
    for (const level of [2, 5, 8]) {
      const rows = (tree.nodes[level - 1].itemData.system as any).levelProgression as any[];
      const evasion = rows.find((r: any) => /Serpent Evasion/i.test(r.name));
      expect(evasion?.powerTemplateId).toBe('ab-evade');
      expect(rows.some((r: any) => r.powerTemplateId === 'extend-buff-mobility')).toBe(false);
    }
  });
});
