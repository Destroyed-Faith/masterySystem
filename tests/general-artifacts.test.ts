import { describe, expect, it } from 'vitest';
import {
  buildAllGeneralArtifactTrees,
  buildEchoArtifactTree,
  ECHO_ARTIFACT_SEED_VERSION,
} from '../src/artifacts/echo-artifact-tree-builder.js';
import { GENERAL_ARTIFACTS, getGeneralArtifact } from '../src/utils/general-artifacts.js';
import { visibleAbilityRows } from '../src/utils/artifact-visible-abilities.js';

function flag(node: any, key: string) {
  return node.itemData.flags['mastery-system'][key];
}

function sysAt(tree: any, level: number) {
  return tree.nodes[level - 1].itemData.system as any;
}

function baseValue(tree: any, level: number, label: string) {
  return sysAt(tree, level).baseValues.find((b: any) => b.label === label);
}

describe('General Artifact catalog', () => {
  it('contains exactly the 7 Artifact Examples', () => {
    expect(Object.keys(GENERAL_ARTIFACTS)).toEqual([
      'moonlightGreatsword',
      'soulSigil',
      'frostboundReturningAxe',
      'shadowgraveArmor',
      'staffOfTheDark',
      'starfallenForceshield',
      'lanternOfTheHollowStar',
    ]);
  });

  it('every definition has an empty echoKey and a full 10-row progression', () => {
    for (const def of Object.values(GENERAL_ARTIFACTS)) {
      expect(def.echoKey).toBe('');
      expect(def.levelProgression).toHaveLength(10);
      expect(def.levelProgression.map((r) => r.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(def.levelProgression[9].type).toBe('Ultimate');
      expect(def.levelProgression[9].name).toMatch(/^True\b/);
    }
  });
});

describe('General Artifact trees — structure and binding', () => {
  it('builds one 10-node tree per catalog entry', () => {
    const trees = buildAllGeneralArtifactTrees();
    expect(trees.length).toBe(7);
    for (const tree of trees) {
      expect(tree.nodes).toHaveLength(10);
      expect(tree.echoKey).toBe('');
    }
  });

  it('nodes bind as bound (not echo) and never carry the echoBound flag', () => {
    for (const tree of buildAllGeneralArtifactTrees()) {
      for (const node of tree.nodes) {
        const sys = node.itemData.system as any;
        expect(sys.binding).toBe('bound');
        expect(sys.echoKey).toBe('');
        expect(flag(node, 'echoBound')).toBeUndefined();
        expect(flag(node, 'echoArtifactKey')).toBe(tree.echoArtifactKey);
        expect(flag(node, 'seedVersion')).toBe(ECHO_ARTIFACT_SEED_VERSION);
      }
    }
  });

  it('keeps the linear nodeId linkage (root → L10)', () => {
    const tree = buildEchoArtifactTree(getGeneralArtifact('moonlightGreatsword')!);
    expect(tree.nodes[0].nodeId).toBe('moonlightGreatsword-l1');
    expect(flag(tree.nodes[0], 'isRoot')).toBe(true);
    expect(flag(tree.nodes[0], 'childIds')).toEqual(['moonlightGreatsword-l2']);
    expect(flag(tree.nodes[9], 'parentIds')).toEqual(['moonlightGreatsword-l9']);
    expect(flag(tree.nodes[9], 'childIds')).toEqual([]);
  });

  it('exposes only the abilities visible at each node level (authored table)', () => {
    for (const tree of buildAllGeneralArtifactTrees()) {
      const def = getGeneralArtifact(tree.echoArtifactKey)!;
      for (const node of tree.nodes) {
        const sys = node.itemData.system as any;
        expect(sys.levelProgression).toEqual(visibleAbilityRows(def.levelProgression, node.level));
        if (node.level === 1) expect(sys.levelProgression).toHaveLength(1);
        if (node.level === 2) expect(sys.levelProgression).toHaveLength(2);
        if (node.level >= 3 && node.level <= 9) expect(sys.levelProgression).toHaveLength(3);
        if (node.level === 10) expect(sys.levelProgression).toHaveLength(4);
        expect(sys.powers).toHaveLength(sys.levelProgression.length);
      }
    }
  });

  it('uses the authored rulebook rows 1:1 (no picks-derived recompilation)', () => {
    const tree = buildEchoArtifactTree(getGeneralArtifact('soulSigil')!);
    // L1 shows the authored "Soul Shell I" row, not a generic "Stone Support I" row.
    expect(sysAt(tree, 1).levelProgression[0].name).toBe('Soul Shell I');
    const l10names = sysAt(tree, 10).levelProgression.map((r: any) => r.name);
    expect(l10names).toEqual([
      'Soul Shell III',
      'Uncanny Soul III',
      'Resting Soul III',
      'True Soul Sigil',
    ]);
  });
});

describe('Moonlight Greatsword', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('moonlightGreatsword')!);

  it('is a two-handed weapon occupying both hands', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('bothHands');
    expect(sys.baseProfile).toBe('twoHandedWeapon');
    expect(sys.artifactKind).toBe('weapon');
    expect(sys.equipSlots).toEqual(['mainhand', 'offhand']);
  });

  it('damage scales 4d8 → 16d8 with the two-handed table', () => {
    const expected = ['4d8', '5d8', '6d8', '8d8', '9d8', '10d8', '12d8', '13d8', '14d8', '16d8'];
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Weapon Damage').value).toBe(expected[lvl - 1]);
      expect(sysAt(tree, lvl).artifactWeapon.damage).toBe(expected[lvl - 1]);
    }
  });

  it('Smite unlocks at L4 (rank 4) and upgrades at L7 (rank 8)', () => {
    expect(baseValue(tree, 3, 'Smite')).toBeUndefined();
    expect(baseValue(tree, 4, 'Smite').value).toBe(4);
    expect(baseValue(tree, 7, 'Smite').value).toBe(8);
    expect(baseValue(tree, 10, 'Smite').value).toBe(8);
  });

  it('Expose unlocks at L7 (rank 4) and upgrades at L10 (rank 8)', () => {
    expect(baseValue(tree, 6, 'Expose')).toBeUndefined();
    expect(baseValue(tree, 7, 'Expose').value).toBe(4);
    expect(baseValue(tree, 10, 'Expose').value).toBe(8);
  });
});

describe('Soul Sigil', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('soulSigil')!);

  it('is a no-armor body artifact with Evade +8 → +26', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('body');
    expect(sys.baseProfile).toBe('noArmorBody');
    for (let lvl = 1; lvl <= 10; lvl++) {
      const bv = sysAt(tree, lvl).baseValues;
      expect(bv).toHaveLength(1);
      expect(bv[0].type).toBe('evade');
      expect(bv[0].value).toBe(6 + 2 * lvl);
    }
    expect(baseValue(tree, 1, 'Evade (Silver Veil)').value).toBe(8);
    expect(baseValue(tree, 10, 'Evade (Silver Veil)').value).toBe(26);
  });

  it('supports the Temporary HP Stone Power from L1', () => {
    for (const node of tree.nodes) {
      expect((node.itemData.system as any).stoneFunction).toEqual({
        kind: 'stonePowerSupport',
        attribute: 'vitality',
        stonePowerId: 'vitality.tempHp',
      });
    }
  });
});

describe('Frostbound Returning Axe', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('frostboundReturningAxe')!);

  it('is a one-handed main-hand weapon with 2d8 → 11d8 damage', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('mainHand');
    expect(sys.baseProfile).toBe('oneHandedWeapon');
    expect(sys.equipSlots).toEqual(['mainhand']);
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Weapon Damage').value).toBe(`${lvl + 1}d8`);
    }
  });

  it('thrown range unlocks at L4 with 9 m and scales +1 m per level to 15 m', () => {
    expect(baseValue(tree, 3, 'Thrown Return')).toBeUndefined();
    expect(baseValue(tree, 4, 'Thrown Return').value).toBe('9 m');
    expect(baseValue(tree, 5, 'Thrown Return').value).toBe('10 m');
    expect(baseValue(tree, 10, 'Thrown Return').value).toBe('15 m');
  });

  it('supports the Ignore Armor Stone Power from L1', () => {
    expect(sysAt(tree, 1).stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'might',
      stonePowerId: 'might.ignoreArmor',
    });
  });
});

describe('Shadowgrave Armor', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('shadowgraveArmor')!);

  it('hybrid defense: Armor 4→9 and Evade +4→+13, both from L1', () => {
    const armorTable = [4, 4, 5, 5, 6, 6, 7, 7, 8, 9];
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Hybrid Defense (Armor)').value).toBe(armorTable[lvl - 1]);
      expect(baseValue(tree, lvl, 'Hybrid Defense (Evade)').value).toBe(lvl + 3);
    }
  });

  it('is body armor with a Temporary HP stone support', () => {
    const sys = sysAt(tree, 1);
    expect(sys.baseProfile).toBe('bodyArmor');
    expect(sys.artifactKind).toBe('armor');
    expect(sys.stoneFunction.stonePowerId).toBe('vitality.tempHp');
  });
});

describe('Staff of the Dark', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('staffOfTheDark')!);

  it('can be equipped in either hand and deals 2d8 → 11d8', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('mainHand');
    expect(sys.equipSlots).toEqual(['mainhand', 'offhand']);
    expect(baseValue(tree, 1, 'Weapon Damage').value).toBe('2d8');
    expect(baseValue(tree, 10, 'Weapon Damage').value).toBe('11d8');
  });

  it('Hex uses its own breakpoints: 2 at L4-5, 3 at L6-7, 4 at L8-9, 5 at L10', () => {
    expect(baseValue(tree, 3, 'Hex')).toBeUndefined();
    expect(baseValue(tree, 4, 'Hex').value).toBe(2);
    expect(baseValue(tree, 5, 'Hex').value).toBe(2);
    expect(baseValue(tree, 6, 'Hex').value).toBe(3);
    expect(baseValue(tree, 7, 'Hex').value).toBe(3);
    expect(baseValue(tree, 8, 'Hex').value).toBe(4);
    expect(baseValue(tree, 9, 'Hex').value).toBe(4);
    expect(baseValue(tree, 10, 'Hex').value).toBe(5);
  });

  it('marks its actives as spells', () => {
    const power = sysAt(tree, 1).powers[0];
    expect(power.tags).toContain('spell');
    expect(power.category).toBe('active');
  });
});

describe('Starfallen Forceshield', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('starfallenForceshield')!);

  it('is a shield with Shield Value +4 … +8 per the rulebook table', () => {
    const expected = [4, 4, 4, 5, 5, 5, 6, 6, 6, 8];
    const sys = sysAt(tree, 1);
    expect(sys.artifactKind).toBe('shield');
    expect(sys.equipSlots).toEqual(['mainhand', 'offhand']);
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Shield Value').value).toBe(expected[lvl - 1]);
      expect(sysAt(tree, lvl).artifactShield.shieldValue).toBe(expected[lvl - 1]);
    }
  });

  it('carries the -2d8 Physical Skill Check drawback on its shield profile', () => {
    expect(sysAt(tree, 1).artifactShield.skillPenalty).toBe('-2d8 Physical Skill Checks');
    expect(baseValue(tree, 1, 'Shield Value').note).toContain('-2d8 Physical Skill Checks');
  });
});

describe('Lantern of the Hollow Star', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('lanternOfTheHollowStar')!);

  it('occupies the amulet slot with no Base Values at any level', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('amulet');
    expect(sys.gearSlot).toBe('amulet');
    expect(sys.equipSlots).toEqual(['amulet']);
    for (const node of tree.nodes) {
      expect((node.itemData.system as any).baseValues).toEqual([]);
    }
  });

  it('carries a Resolve Stone Battery function from L1', () => {
    expect(sysAt(tree, 1).stoneFunction).toEqual({
      kind: 'stoneBattery',
      attribute: 'resolve',
    });
  });

  it('progression covers Stone Battery / Lantern Glow / Soul Reserve stages', () => {
    const l3 = sysAt(tree, 3).levelProgression.map((r: any) => r.name);
    expect(l3).toEqual(['Stone Battery I', 'Lantern Glow I', 'Soul Reserve I']);
    const l10 = sysAt(tree, 10).levelProgression.map((r: any) => r.name);
    expect(l10).toEqual(['Stone Battery III', 'Lantern Glow III', 'Soul Reserve III', 'True Hollow Star']);
  });
});
