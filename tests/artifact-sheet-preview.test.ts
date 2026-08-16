import { describe, expect, it } from 'vitest';
import {
  displayFromArtifactSystem,
  resolveNextArtifactPreviews,
} from '../src/utils/artifact-sheet-preview.js';

const L1 = { level: 1, name: 'Stormpower I', type: 'Support', effect: 'Tier 2', special: '' };
const L2 = { level: 2, name: 'Frost Throw I', type: 'Ranged', effect: '+1d8', special: 'slow(6)' };
const L3 = { level: 3, name: 'Ice Edge I', type: 'Melee', effect: '+2d8', special: '' };

describe('displayFromArtifactSystem', () => {
  it('maps base values and visible abilities at the item level', () => {
    const display = displayFromArtifactSystem({
      level: 2,
      baseValues: [{ slot: 'a', label: 'Weapon Damage', value: '4d8' }],
      levelProgression: [L1, L2],
    });
    expect(display.level).toBe(2);
    expect(display.baseValues).toEqual([{ slot: 'A', label: 'Weapon Damage', value: '4d8' }]);
    expect(display.abilities.map(a => a.name)).toEqual(['Stormpower I', 'Frost Throw I']);
    expect(display.hasAbilities).toBe(true);
  });
});

describe('resolveNextArtifactPreviews', () => {
  it('returns nothing when the sliced table has no further rows', () => {
    const item = {
      name: 'Frostbound Returning Axe - Level 2-1',
      system: { level: 2, baseValues: [{ label: 'Weapon Damage', value: '4d8' }], levelProgression: [L1, L2] },
    };
    expect(resolveNextArtifactPreviews(item)).toEqual([]);
  });

  it('reads the next tree node from the world folder', () => {
    const flag = (data: Record<string, unknown>) => (_ns: string, key: string) => data[key];
    const l3 = {
      id: 'w3',
      name: 'Frostbound Returning Axe - Level 3-1',
      type: 'artifact',
      folder: { id: 'folder1' },
      system: {
        level: 3,
        baseValues: [{ slot: 'a', label: 'Weapon Damage', value: '5d8' }],
        levelProgression: [L1, L2, L3],
      },
      getFlag: flag({ nodeId: 'n3', parentIds: ['n2'], childIds: [] }),
    };
    const l2 = {
      id: 'w2',
      name: 'Frostbound Returning Axe - Level 2-1',
      type: 'artifact',
      folder: { id: 'folder1' },
      system: { level: 2, levelProgression: [L1, L2] },
      getFlag: flag({ nodeId: 'n2', parentIds: ['n1'], childIds: ['n3'] }),
    };
    const root = {
      id: 'w1',
      name: 'Frostbound Returning Axe - Level 1-1',
      type: 'artifact',
      folder: { id: 'folder1' },
      system: { level: 1, levelProgression: [L1] },
      getFlag: flag({ nodeId: 'n1', isRoot: true, childIds: ['n2'] }),
    };
    const world = [root, l2, l3];
    (globalThis as any).game = {
      items: {
        get: (id: string) => world.find(i => i.id === id),
        filter: (fn: (i: any) => boolean) => world.filter(fn),
      },
    };
    const embedded = {
      name: 'Frostbound Returning Axe - Level 2-1',
      system: {
        level: 2,
        baseValues: [{ slot: 'a', label: 'Weapon Damage', value: '4d8' }],
        levelProgression: [L1, L2],
      },
      getFlag: flag({ evolutionRootItemId: 'w1', evolutionNodeId: 'n2' }),
    };
    const next = resolveNextArtifactPreviews(embedded);
    expect(next).toHaveLength(1);
    expect(next[0].level).toBe(3);
    expect(next[0].abilities.map(a => a.name)).toEqual(['Stormpower I', 'Frost Throw I', 'Ice Edge I']);
    expect(next[0].baseValues[0].value).toBe('5d8');
    delete (globalThis as any).game;
  });

  it('falls back to the next level when the same item still has later rows', () => {
    const item = {
      name: 'Staff',
      system: {
        level: 2,
        baseValues: [{ slot: 'a', label: 'Damage', value: '3d8' }],
        levelProgression: [L1, L2, L3],
      },
    };
    const next = resolveNextArtifactPreviews(item);
    expect(next).toHaveLength(1);
    expect(next[0].level).toBe(3);
    expect(next[0].abilities.map(a => a.name)).toEqual(['Stormpower I', 'Frost Throw I', 'Ice Edge I']);
  });
});
