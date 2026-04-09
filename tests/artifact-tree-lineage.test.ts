import { describe, it, expect } from 'vitest';
import type { LineageItemLike } from '../src/utils/artifact-tree-lineage.js';
import {
  buildArtifactNodeIdMap,
  findRootItem,
  getAncestorChainRootFirst,
  getMaxTotalEmbeddedPowers,
  getMergedAncestorPowerIds,
  getTreeDepth,
  isLineageRootItem,
  mergeArtifactWeaponForChildSync,
  mergeInnatesFromAncestors,
  mergePowersParentToChild,
  mergeSpecialRefsFromAncestors,
  specialRefKey
} from '../src/utils/artifact-tree-lineage.js';

function mockItem(
  id: string,
  flagData: { nodeId?: string; parentIds?: string[]; isRoot?: boolean },
  system: Record<string, unknown>
): LineageItemLike {
  return {
    id,
    getFlag(scope: string, key: string) {
      if (scope !== 'mastery-system') return undefined;
      return (flagData as any)[key];
    },
    system
  };
}

describe('specialRefKey', () => {
  it('joins id and value', () => {
    expect(specialRefKey({ specialId: 'push', value: 2 })).toBe('push|2');
    expect(specialRefKey({ specialId: 'push', value: undefined })).toBe('push|');
  });
});

describe('mergeInnatesFromAncestors', () => {
  it('orders root-first and dedupes', () => {
    const root = mockItem('i-root', { nodeId: 'n0', parentIds: [] }, {
      artifactWeapon: { innateAbilities: ['A', 'B'] }
    });
    const mid = mockItem('i-mid', { nodeId: 'n1', parentIds: ['n0'] }, {
      artifactWeapon: { innateAbilities: ['B', 'C'] }
    });
    const { ordered, set } = mergeInnatesFromAncestors([root, mid]);
    expect(ordered).toEqual(['A', 'B', 'C']);
    expect(set.has('B')).toBe(true);
  });
});

describe('mergeSpecialRefsFromAncestors', () => {
  it('dedupes by specialRefKey', () => {
    const a = mockItem('a', { nodeId: 'n0' }, {
      artifactWeapon: { specials: [{ specialId: 'x', value: 1 }] }
    });
    const b = mockItem('b', { nodeId: 'n1' }, {
      artifactWeapon: { specials: [{ specialId: 'x', value: 1 }, { specialId: 'y' }] }
    });
    const { ordered, keySet } = mergeSpecialRefsFromAncestors([a, b]);
    expect(ordered).toHaveLength(2);
    expect(keySet.size).toBe(2);
  });
});

describe('tree map and depth', () => {
  const root = mockItem('ir', { nodeId: 'nr', parentIds: [], isRoot: true }, { powers: [] });
  const child = mockItem('ic', { nodeId: 'nc', parentIds: ['nr'] }, { powers: [] });
  const grand = mockItem('ig', { nodeId: 'ng', parentIds: ['nc'] }, { powers: [] });

  it('buildArtifactNodeIdMap resolves by nodeId', () => {
    const m = buildArtifactNodeIdMap([root, child]);
    expect(m.get('nr')).toBe(root);
    expect(m.get('nc')).toBe(child);
  });

  it('getTreeDepth and ancestors', () => {
    const m = buildArtifactNodeIdMap([root, child, grand]);
    expect(getTreeDepth(grand, m)).toBe(3);
    expect(getAncestorChainRootFirst(grand, m)).toEqual([root, child]);
    expect(findRootItem(grand, m)).toBe(root);
  });

  it('isLineageRootItem respects parentIds and isRoot flag', () => {
    expect(isLineageRootItem(root)).toBe(true);
    expect(isLineageRootItem(child)).toBe(false);
  });
});

describe('getMergedAncestorPowerIds', () => {
  it('collects ids from ancestor items only', () => {
    const p = mockItem('p', { nodeId: 'np' }, { powers: [{ id: 'pow1' }, { id: 'pow2' }] });
    const ids = getMergedAncestorPowerIds([p]);
    expect([...ids].sort()).toEqual(['pow1', 'pow2']);
  });
});

describe('getMaxTotalEmbeddedPowers', () => {
  it('is unbounded for root', () => {
    expect(getMaxTotalEmbeddedPowers(true, 99, 50)).toBe(Number.POSITIVE_INFINITY);
  });

  it('uses ancestor count + depth - 1 for descendants', () => {
    expect(getMaxTotalEmbeddedPowers(false, 2, 3)).toBe(4);
    expect(getMaxTotalEmbeddedPowers(false, 1, 2)).toBe(2);
  });
});

describe('mergeArtifactWeaponForChildSync', () => {
  it('keeps child damage and range; locks type and hands from parent', () => {
    const parentW = {
      weaponType: 'melee' as const,
      hands: 2,
      damage: '1d8',
      range: '0m',
      innateAbilities: [] as string[],
      specials: [] as { specialId: string; value?: number }[]
    };
    const childW = {
      weaponType: 'ranged' as const,
      hands: 1,
      damage: '3d8',
      range: '8/16m',
      innateAbilities: ['Extra'],
      specials: [{ specialId: 'z' }]
    };
    const lockedInn = mergeInnatesFromAncestors([]);
    const lockedSpec = mergeSpecialRefsFromAncestors([]);
    const merged = mergeArtifactWeaponForChildSync(parentW, childW, lockedInn.ordered, lockedInn.set, lockedSpec.ordered, lockedSpec.keySet);
    expect(merged.weaponType).toBe('melee');
    expect(merged.hands).toBe(2);
    expect(merged.damage).toBe('3d8');
    expect(merged.range).toBe('8/16m');
    expect(merged.innateAbilities).toContain('Extra');
  });
});

describe('mergePowersParentToChild', () => {
  it('prepends parent order and appends child-only ids', () => {
    const out = mergePowersParentToChild(
      [{ id: 'a', name: 'A' }],
      [
        { id: 'a', name: 'A-old' },
        { id: 'b', name: 'B' }
      ]
    );
    expect(out).toHaveLength(2);
    expect((out[0] as any).name).toBe('A');
    expect((out[1] as any).id).toBe('b');
  });
});
