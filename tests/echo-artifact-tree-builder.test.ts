import { describe, expect, it } from 'vitest';
import {
  buildAllEchoArtifactTrees,
  buildEchoArtifactTree,
} from '../src/artifacts/echo-artifact-tree-builder.js';
import { ECHO_ARTIFACTS, getEchoArtifact } from '../src/utils/echo-artifacts.js';

function flag(node: any, key: string) {
  return node.itemData.flags['mastery-system'][key];
}

describe('Echo Artifact tree builder — structure', () => {
  it('builds one tree per catalog entry', () => {
    const trees = buildAllEchoArtifactTrees();
    expect(trees.length).toBe(Object.keys(ECHO_ARTIFACTS).length);
  });

  it('each tree has exactly 10 levels, root + linear linkage', () => {
    for (const tree of buildAllEchoArtifactTrees()) {
      expect(tree.nodes.length).toBe(10);

      tree.nodes.forEach((node, idx) => {
        const level = idx + 1;
        expect(node.level).toBe(level);
        expect(node.itemData.type).toBe('artifact');
        expect((node.itemData.system as any).level).toBe(level);
        expect((node.itemData.system as any).currentLevel).toBe(level);
        expect((node.itemData.system as any).binding).toBe('echo');

        // Linking via stable nodeId flags (not document _id).
        if (idx === 0) {
          expect(flag(node, 'isRoot')).toBe(true);
          expect(flag(node, 'parentIds')).toEqual([]);
        } else {
          expect(flag(node, 'parentIds')).toEqual([tree.nodes[idx - 1].nodeId]);
        }
        if (idx === 9) {
          expect(flag(node, 'childIds')).toEqual([]);
        } else {
          expect(flag(node, 'childIds')).toEqual([tree.nodes[idx + 1].nodeId]);
        }
        expect(flag(node, 'echoArtifactKey')).toBe(tree.echoArtifactKey);
      });
    }
  });

  it('node ids are deterministic and stable across builds', () => {
    const a = buildEchoArtifactTree(getEchoArtifact('serpentScales')!);
    const b = buildEchoArtifactTree(getEchoArtifact('serpentScales')!);
    expect(a.nodes.map((n) => n.nodeId)).toEqual(b.nodes.map((n) => n.nodeId));
    expect(a.nodes[0].nodeId).toBe('serpentScales-l1');
    expect(a.nodes[9].nodeId).toBe('serpentScales-l10');
  });

  it('powers accumulate cumulatively level by level', () => {
    for (const tree of buildAllEchoArtifactTrees()) {
      let prev = -1;
      for (const node of tree.nodes) {
        const count = (node.itemData.system as any).powers.length;
        expect(count).toBeGreaterThanOrEqual(prev);
        prev = count;
      }
    }
  });
});

describe('Echo Artifact tree builder — exact Base Values', () => {
  it('Light Echo Armor scales 8 → 18 (Serpent Scales)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('serpentScales')!);
    const bv = (lvl: number) =>
      (tree.nodes[lvl - 1].itemData.system as any).baseValues.find((b: any) => b.type === 'bodyArmor');
    expect(bv(1).value).toBe(8);
    expect(bv(10).value).toBe(18);
  });

  it('Dragon Claws unlock weapon specials at L4 / L7', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('dragonClaws')!);
    const types = (lvl: number) =>
      (tree.nodes[lvl - 1].itemData.system as any).baseValues.map((b: any) => b.type);
    // L1: only weapon damage. L4: +penetration. L7: +brutal impact.
    expect(types(1)).toEqual(['weaponDamage']);
    expect(types(4)).toContain('weaponSpecial');
    expect(types(3)).not.toContain('weaponSpecial');
    expect(types(10).filter((t: string) => t === 'weaponSpecial').length).toBe(2);
    expect((tree.nodes[9].itemData.system as any).baseValues[0].value).toBe('16d8');
  });
});
