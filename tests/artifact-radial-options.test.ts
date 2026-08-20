import { describe, expect, it } from 'vitest';

import {
  buildAllEchoArtifactTrees,
  buildAllGeneralArtifactTrees,
} from '../src/artifacts/echo-artifact-tree-builder.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';

function flag(data: Record<string, unknown>) {
  return (_ns: string, key: string) => data[key];
}

function artifact(spec: {
  id: string;
  name: string;
  kind: string;
  damage?: string;
  progression?: Array<{ level: number; name: string; type: string; effect?: string }>;
}) {
  return {
    id: spec.id,
    type: 'artifact',
    name: spec.name,
    system: {
      equipped: true,
      binding: 'bound',
      artifactKind: spec.kind,
      currentLevel: 1,
      level: 1,
      artifactWeapon: spec.damage ? { damage: spec.damage } : undefined,
      levelProgression: spec.progression ?? [],
    },
    getFlag: flag({ artifactActivated: true }),
  };
}

function actor(items: any[]) {
  return { items };
}

describe('buildArtifactRadialOptions weapon buttons', () => {
  it('keeps Moonlight Mending and drops the basic sword swing when Single Attack exists', () => {
    const sword = artifact({
      id: 'mg',
      name: 'Moonlight Greatsword - Level 1-1',
      kind: 'weapon',
      damage: '5d8',
      progression: [
        { level: 1, name: 'Moonlight Mending I', type: 'Active', effect: 'Heal 10d8' },
      ],
    });
    const single = {
      id: 'p1',
      type: 'power',
      name: 'Single Attack',
      system: { powerType: 'active', showInRadialMenu: true },
    };
    const opts = buildArtifactRadialOptions(actor([sword, single]));
    expect(opts.map((o) => o.name)).toEqual(['Moonlight Mending I']);
    expect(opts.some((o) => o.id.startsWith('artifact-weapon:'))).toBe(false);
  });

  it('keeps the named weapon swing when the actor has no Active power of their own', () => {
    const sword = artifact({
      id: 'mg',
      name: 'Moonlight Greatsword - Level 1-1',
      kind: 'weapon',
      damage: '5d8',
    });
    const opts = buildArtifactRadialOptions(actor([sword]));
    expect(opts).toHaveLength(1);
    expect(opts[0].id).toBe('artifact-weapon:mg');
    expect(opts[0].name).toBe('Moonlight Greatsword');
  });

  it('never turns Soul Sigil into a 1d8 attack', () => {
    const sigil = artifact({
      id: 'ss',
      name: 'Soul Sigil - Level 1-1',
      kind: 'armor',
      damage: '1d8',
      progression: [
        { level: 1, name: 'Soul Shell I', type: 'Stone Power Support', effect: 'Vitality Temporary HP' },
      ],
    });
    const opts = buildArtifactRadialOptions(actor([sigil]));
    expect(opts.some((o) => o.slot === 'attack')).toBe(false);
    expect(opts.some((o) => o.id.startsWith('artifact-weapon:'))).toBe(false);
    // Stone Power Supports only pre-fill Stone Power lanes — nothing to click.
    expect(opts).toEqual([]);
  });

  it('still adds an extra natural-weapon attack on gear (Dragon Head Bite)', () => {
    const head = {
      id: 'dh',
      type: 'artifact',
      name: 'Dragon Head - Level 1-1',
      system: {
        equipped: true,
        binding: 'echo',
        artifactKind: 'gear',
        baseProfile: 'headArmor',
        currentLevel: 1,
        level: 1,
        naturalWeapon: { name: 'Bite', weaponType: 'melee', hands: 0 },
        artifactWeapon: { damage: '3d8', name: 'Bite', isNatural: true },
        levelProgression: [],
      },
      getFlag: flag({ artifactActivated: true }),
    };
    const opts = buildArtifactRadialOptions(actor([head]));
    expect(opts).toHaveLength(1);
    expect(opts[0].id).toBe('artifact-weapon:dh');
    expect(opts[0].name).toBe('Bite');
    expect(opts[0].tags).toContain('natural-weapon');
  });

  it('ignores leftover 1d8 blobs on staff, lantern, feet, and items with no kind', () => {
    const leftover = { damage: '1d8' };
    const cases = [
      { id: 'staff', name: 'Staff of the Dark', kind: 'gear', baseProfile: 'custom' },
      { id: 'lantern', name: 'Lantern of the Hollow Star', kind: 'gear', baseProfile: 'lantern' },
      { id: 'soles', name: 'Stonebound Soles', kind: 'gear', baseProfile: 'feet' },
      { id: 'orphan', name: 'Mystery Relic', kind: '', baseProfile: '' },
    ];
    for (const spec of cases) {
      const item = {
        id: spec.id,
        type: 'artifact',
        name: spec.name,
        system: {
          equipped: true,
          binding: 'bound',
          artifactKind: spec.kind,
          baseProfile: spec.baseProfile,
          currentLevel: 1,
          artifactWeapon: leftover,
          levelProgression: [],
        },
        getFlag: flag({ artifactActivated: true }),
      };
      const opts = buildArtifactRadialOptions(actor([item]));
      expect(opts.some((o) => o.id.startsWith('artifact-weapon:')), spec.name).toBe(false);
    }
  });
});

describe('catalog: no leftover artifact swings next to Single Attack', () => {
  const single = {
    id: 'p1',
    type: 'power',
    name: 'Single Attack',
    system: { powerType: 'active', showInRadialMenu: true },
  };

  function activatedFromNode(node: any) {
    const flags = node.itemData.flags?.['mastery-system'] || {};
    return {
      id: node.nodeId,
      type: 'artifact',
      name: node.itemData.name,
      system: { ...node.itemData.system, equipped: true },
      getFlag: (_ns: string, key: string) => (key === 'artifactActivated' ? true : flags[key]),
    };
  }

  it('general and echo L1 nodes never add a basic weapon button when Single Attack exists, except Dragon Head Bite', () => {
    const trees = [...buildAllGeneralArtifactTrees(), ...buildAllEchoArtifactTrees()];
    for (const tree of trees) {
      const l1 = tree.nodes[0];
      const item = activatedFromNode(l1);
      // Simulate the Soul Sigil leftover: a 1d8 blob on items that should not swing.
      if (!item.system.artifactWeapon) {
        item.system.artifactWeapon = { damage: '1d8' };
      }
      const opts = buildArtifactRadialOptions(actor([item, single]));
      const swings = opts.filter((o) => o.id.startsWith('artifact-weapon:'));
      if (tree.echoArtifactKey === 'dragonHead' || String(tree.echoArtifactKey || '').startsWith('predatorCrown')) {
        expect(swings.map((o) => o.name), tree.folderName).toEqual(['Bite']);
      } else {
        expect(swings, tree.folderName).toEqual([]);
      }
    }
  });
});
