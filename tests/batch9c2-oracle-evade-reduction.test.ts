/**
 * Batch 9C.2 — Oracle Frame Enemy Evade Reduction Stone Power Support.
 */
import { describe, expect, it } from 'vitest';
import {
  buildEchoProgressionPicks,
  getEchoArtifact,
  ECHO_ARTIFACTS,
} from '../src/utils/echo-artifacts.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import {
  getArtifactStoneSupportPrefill,
  getArtifactStonePoolExtraByAttribute,
} from '../src/utils/artifact-stone-functions.js';
import { STONE_POWERS } from '../src/stones/stone-powers.js';

function fullRows() {
  const def = getEchoArtifact('oracleFrame')!;
  return resolveFullLevelProgression(def.levelProgression, buildEchoProgressionPicks(def) as any);
}

function rowAt(level: number) {
  return fullRows().find((r) => Number(r.level) === level)!;
}

function activatedOracleAt(level: number) {
  const tree = buildEchoArtifactTree(getEchoArtifact('oracleFrame')!);
  const node = tree.nodes[level - 1];
  return {
    id: `oracle-l${level}`,
    type: 'artifact',
    name: node.itemData.name,
    system: { ...(node.itemData.system as any), equipped: true, binding: 'echo' },
    getFlag: (_ns: string, key: string) => (key === 'artifactActivated' ? true : undefined),
  };
}

describe('Batch 9C.2 — Oracle Enemy Evade Reduction Support', () => {
  it('canonical Influence Enemy Evade Reduction stone power exists', () => {
    const sp = STONE_POWERS['influence.enemyEvadeReduction'];
    expect(sp).toBeTruthy();
    expect(sp.name).toBe('Enemy Evade Reduction');
    expect(sp.attribute).toBe('influence');
    expect(sp.tiers?.map((t) => t.value)).toEqual([1, 2, 4, 8]);
  });

  it('L1–10 progression names and slots match PH', () => {
    const expected = [
      [1, 'Oracle Field I'],
      [2, 'Oracle Evade Reduction I'],
      [3, 'Influence Core I'],
      [4, 'Oracle Field II'],
      [5, 'Oracle Evade Reduction II'],
      [6, 'Influence Core II'],
      [7, 'Oracle Field III'],
      [8, 'Oracle Evade Reduction III'],
      [9, 'Influence Core III'],
      [10, 'Artifact Awakening'],
    ] as const;
    for (const [lvl, name] of expected) {
      expect(rowAt(lvl).name).toBe(name);
    }
  });

  it('L2/5/8 grant Enemy Evade Reduction Support Rank 2/3/4 (not Cleanse)', () => {
    const stages = [
      { L: 2, rank: 2, name: 'Oracle Evade Reduction I' },
      { L: 5, rank: 3, name: 'Oracle Evade Reduction II' },
      { L: 8, rank: 4, name: 'Oracle Evade Reduction III' },
    ];
    for (const s of stages) {
      const row = rowAt(s.L);
      expect(row.name).toBe(s.name);
      expect(row.type).toMatch(/Stone Power Support/i);
      expect(row.special).toBe('influence.enemyEvadeReduction');
      expect(row.effect).toMatch(new RegExp(`Rank ${s.rank}`));
      expect(row.effect).toMatch(/must still be paid/i);
      expect(row.effect).not.toMatch(/cleanse/i);
      expect(String(row.special)).not.toMatch(/cleanse/i);
    }

    const pick = buildEchoProgressionPicks(getEchoArtifact('oracleFrame')!).find(
      (p: any) => p.level === 2,
    );
    expect(pick?.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'influence',
      stonePowerId: 'influence.enemyEvadeReduction',
    });
  });

  it('runtime prefill is Rank 2/3/4; Cleanse support is 0; lower ranks remain paid', () => {
    expect(getArtifactStoneSupportPrefill({ id: 'a', items: [activatedOracleAt(2)] } as any, 'influence.enemyEvadeReduction', 'influence')).toBe(2);
    expect(getArtifactStoneSupportPrefill({ id: 'a', items: [activatedOracleAt(5)] } as any, 'influence.enemyEvadeReduction', 'influence')).toBe(3);
    expect(getArtifactStoneSupportPrefill({ id: 'a', items: [activatedOracleAt(8)] } as any, 'influence.enemyEvadeReduction', 'influence')).toBe(4);

    const actorL8 = { id: 'a', items: [activatedOracleAt(8)] } as any;
    expect(getArtifactStoneSupportPrefill(actorL8, 'influence.cleanse', 'influence')).toBe(0);
    // Prefill never grants free lower ranks — only the highest supported rank is prepaid.
    expect(getArtifactStoneSupportPrefill(actorL8, 'influence.enemyEvadeReduction', 'influence')).toBe(4);
  });

  it('does not duplicate Enemy Evade Reduction support grants', () => {
    const supports = fullRows().filter(
      (r) => String(r.special) === 'influence.enemyEvadeReduction',
    );
    expect(supports.map((r) => r.level)).toEqual([2, 5, 8]);
    expect(fullRows().filter((r) => /cleanse/i.test(String(r.special) + String(r.effect)))).toHaveLength(
      0,
    );
  });

  it('Oracle Field Armor + Influence Pool + Awakening unchanged', () => {
    expect(rowAt(1).powerTemplateId).toBe('ab-armor');
    expect(rowAt(1).effect).toMatch(/\+8 Armor/);
    expect(rowAt(4).effect).toMatch(/\+20 Armor/);
    expect(rowAt(7).effect).toMatch(/\+32 Armor/);
    expect(fullRows().every((r) => r.powerTemplateId !== 'ab-armor-aura')).toBe(true);

    expect(rowAt(3).effect).toMatch(/store 2 Influence/i);
    expect(rowAt(6).effect).toMatch(/store 4 Influence/i);
    expect(rowAt(9).effect).toMatch(/store 8 Influence/i);

    const actor = { id: 'a', items: [activatedOracleAt(9)] } as any;
    expect(getArtifactStonePoolExtraByAttribute(actor)).toEqual({ influence: 8 });

    expect(rowAt(10).name).toBe('Artifact Awakening');
  });

  it('other Sentinel frames are untouched by this batch', () => {
    expect(ECHO_ARTIFACTS.sentinelFrame.progressionPickSpecs?.[2]?.stoneFunction).toMatchObject({
      kind: 'stonePool',
      attribute: 'resolve',
    });
    expect(ECHO_ARTIFACTS.judicatorFrame.progressionPickSpecs?.[3]?.stoneFunction).toMatchObject({
      stonePowerId: 'resolve.healing',
    });
  });
});
