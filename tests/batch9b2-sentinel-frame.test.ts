/**
 * Batch 9B.2 — Sentinel Frame catalogue corrections (PH ~2579–2594).
 */
import { describe, expect, it } from 'vitest';
import {
  ECHO_ARTIFACTS,
  buildEchoProgressionPicks,
  getEchoArtifact,
} from '../src/utils/echo-artifacts.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import {
  getArtifactStoneFunctions,
  getArtifactStoneSupportPrefill,
  getArtifactStonePoolExtraByAttribute,
} from '../src/utils/artifact-stone-functions.js';
import { artifactLevelToTemplateRank } from '../src/utils/artifact-spell-pick.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { HL_HEAL_RANGED_POOL } from '../src/utils/powers/templates/actives.js';

function activeItemFromNode(node: any, name: string) {
  const system = { ...(node.itemData.system as any), binding: 'echo' };
  return {
    id: `${name}-item`,
    name,
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
  const def = getEchoArtifact('sentinelFrame')!;
  return resolveFullLevelProgression(def.levelProgression, buildEchoProgressionPicks(def) as any, {
    preferAuthored: true,
  });
}

function rowAt(level: number) {
  return fullRows().find((r) => Number(r.level) === level)!;
}

describe('Batch 9B.2 — Sentinel Frame progression', () => {
  it('uses authored PH table (not pick-slot remapping)', () => {
    const def = ECHO_ARTIFACTS.sentinelFrame;
    expect(def.useAuthoredLevelProgression).toBe(true);
    const expected = [
      [1, 'Single Restoration I'],
      [2, 'Resolve Core I'],
      [3, 'Healing Support I'],
      [4, 'Single Restoration II'],
      [5, 'Special Negation Support I'],
      [6, 'Resolve Core II'],
      [7, 'Single Restoration III'],
      [8, 'Healing Support II'],
      [9, 'Special Negation Support II'],
      [10, 'Artifact Awakening'],
    ] as const;
    for (const [lvl, name] of expected) {
      expect(rowAt(lvl).name).toBe(name);
    }
  });

  it('Single Restoration is PL 4/10/16, fixed 8 m, shared pool 2/6/10', () => {
    const stages = [
      { L: 1, pl: 4, bars: 2 },
      { L: 4, pl: 10, bars: 6 },
      { L: 7, pl: 16, bars: 10 },
    ];
    for (const s of stages) {
      const row = rowAt(s.L);
      expect(row.range).toBe('8 m');
      expect(row.powerTemplateId).toBe('active-ranged-health-level-heal');
      expect(row.special).toMatch(new RegExp(`PL ${s.pl}`));
      expect(row.special).toMatch(/Artifact Range 8 m/);
      expect(row.effect).toMatch(new RegExp(`${s.bars} full Scarred Health Bars`));
      expect(row.effect).not.toMatch(/\d+d8/);
      const pl = Number(artifactLevelToTemplateRank(s.L));
      expect(pl).toBe(s.pl);
      expect(HL_HEAL_RANGED_POOL[pl - 1]).toBe(s.bars);
    }
  });

  it('wires Resolve Core poolStages 2→4 and Healing / Special Negation supports', () => {
    const picks = buildEchoProgressionPicks(ECHO_ARTIFACTS.sentinelFrame);
    const byLevel = Object.fromEntries(picks.map((p) => [p.level, p]));

    expect(byLevel[1]?.powerTemplateId).toBe('active-ranged-health-level-heal');
    expect(byLevel[1]?.displayName).toBe('Single Restoration');

    expect(byLevel[2]?.kind).toBe('stoneFunction');
    expect(byLevel[2]?.stoneFunction).toMatchObject({
      kind: 'stonePool',
      attribute: 'resolve',
      poolStages: [2, 6, 11],
    });

    expect(byLevel[3]?.stoneFunction).toMatchObject({
      kind: 'stonePowerSupport',
      attribute: 'resolve',
      stonePowerId: 'resolve.healing',
      supportStages: [3, 8, 8],
    });

    const extras = ECHO_ARTIFACTS.sentinelFrame.extraStoneFunctions || [];
    expect(extras).toHaveLength(1);
    expect(extras[0]).toMatchObject({
      level: 5,
      name: 'Special Negation Support',
      stonePowerId: 'resolve.ward',
      supportStages: [5, 5, 9],
    });
  });

  it('runtime grants: pool 2/4, Healing Rank 2/4, Special Negation Rank 3/4', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('sentinelFrame')!);

    const at = (level: number) =>
      actorWith(activeItemFromNode(tree.nodes[level - 1], 'Sentinel Frame'));

    expect(getArtifactStoneFunctions(at(1))).toHaveLength(0);

    expect(getArtifactStonePoolExtraByAttribute(at(2)).resolve).toBe(2);
    expect(getArtifactStonePoolExtraByAttribute(at(5)).resolve).toBe(2);
    expect(getArtifactStonePoolExtraByAttribute(at(6)).resolve).toBe(4);
    expect(getArtifactStonePoolExtraByAttribute(at(10)).resolve).toBe(4);

    expect(getArtifactStoneSupportPrefill(at(3), 'resolve.healing', 'resolve')).toBe(2);
    expect(getArtifactStoneSupportPrefill(at(7), 'resolve.healing', 'resolve')).toBe(2);
    expect(getArtifactStoneSupportPrefill(at(8), 'resolve.healing', 'resolve')).toBe(4);

    expect(getArtifactStoneSupportPrefill(at(4), 'resolve.ward', 'resolve')).toBe(0);
    expect(getArtifactStoneSupportPrefill(at(5), 'resolve.ward', 'resolve')).toBe(3);
    expect(getArtifactStoneSupportPrefill(at(8), 'resolve.ward', 'resolve')).toBe(3);
    expect(getArtifactStoneSupportPrefill(at(9), 'resolve.ward', 'resolve')).toBe(4);
  });

  it('tree nodes stamp authored flag and keep Restoration template + 8 m on visible rows', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('sentinelFrame')!);
    for (const node of tree.nodes) {
      const sys = node.itemData.system as any;
      expect(sys.useAuthoredLevelProgression).toBe(true);
    }
    const l7 = tree.nodes[6].itemData.system as any;
    const rest = (l7.levelProgression as any[]).find((r) => /Single Restoration/i.test(r.name));
    expect(rest?.range).toBe('8 m');
    expect(rest?.powerTemplateId).toBe('active-ranged-health-level-heal');
    expect(getTemplate('active-ranged-health-level-heal')).toBeTruthy();
  });

  it('does not invent a third Resolve Core / Healing stage at L5/L8/L9', () => {
    const names = fullRows().map((r) => r.name);
    expect(names.filter((n) => /Resolve Core/.test(n))).toEqual([
      'Resolve Core I',
      'Resolve Core II',
    ]);
    expect(names.filter((n) => /Healing Support/.test(n))).toEqual([
      'Healing Support I',
      'Healing Support II',
    ]);
    expect(names.filter((n) => /Special Negation Support/.test(n))).toEqual([
      'Special Negation Support I',
      'Special Negation Support II',
    ]);
    expect(names.some((n) => /Ward Support|Sentinel Restoration/.test(n))).toBe(false);
  });
});
