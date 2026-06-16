import { describe, expect, it } from 'vitest';
import {
  buildAllEchoArtifactTrees,
  buildEchoArtifactTree,
  ECHO_ARTIFACT_SEED_VERSION,
} from '../src/artifacts/echo-artifact-tree-builder.js';
import { ECHO_ARTIFACTS, getEchoArtifact } from '../src/utils/echo-artifacts.js';
import { visibleAbilityRows, resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';

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

  it('embeds one power per visible ability row at each level', () => {
    for (const tree of buildAllEchoArtifactTrees()) {
      for (const node of tree.nodes) {
        const sys = node.itemData.system as any;
        expect(sys.powers.length).toBe(sys.levelProgression.length);
        for (const p of sys.powers) {
          expect(p.id).toMatch(/^[\w]+-pw-\d+$/);
          expect(p.name).toBeTruthy();
        }
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

  it('Dragon Claws use the two-handed bothHands slot and occupy both hands', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('dragonClaws')!);
    const sys = tree.nodes[0].itemData.system as any;
    expect(sys.slot).toBe('bothHands');
    expect(sys.baseProfile).toBe('twoHandedWeapon');
    expect(sys.equipSlots).toEqual(['mainhand', 'offhand']);
  });

  it('stores only abilities unlocked at each node level (1 / 2 / 3 slots)', () => {
    for (const tree of buildAllEchoArtifactTrees()) {
      const def = getEchoArtifact(tree.echoArtifactKey)!;
      const full = resolveFullLevelProgression(def.levelProgression, (tree.nodes[0].itemData.system as any).progressionPicks);
      for (const node of tree.nodes) {
        const sys = node.itemData.system as any;
        expect(sys.levelProgression).toEqual(visibleAbilityRows(full, node.level));
        expect(sys.levelProgression.length).toBeLessThanOrEqual(node.level >= 10 ? 4 : 3);
        if (node.level === 1) expect(sys.levelProgression).toHaveLength(1);
        if (node.level === 2) expect(sys.levelProgression).toHaveLength(2);
        if (node.level >= 3 && node.level <= 9) expect(sys.levelProgression).toHaveLength(3);
      }
    }
  });

  it('stamps the current seed version on every node (for in-place refresh)', () => {
    expect(ECHO_ARTIFACT_SEED_VERSION).toBe(18);
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    for (const node of tree.nodes) {
      expect(flag(node, 'seedVersion')).toBe(ECHO_ARTIFACT_SEED_VERSION);
    }
  });
});

describe('Echo Artifact tree builder — Sentinel frames map to catalog Powers + Stone Functions', () => {
  // The frames now carry real, editable picks: catalog Powers/empowerments on
  // their ability track, and one Stone Function per stone slot. An artifact may
  // hold up to three Stone Functions (one per Basic-level pick).
  const pick = (key: string, lvl: number) =>
    ((buildEchoArtifactTree(getEchoArtifact(key)!).nodes[0].itemData.system as any)
      .progressionPicks as any[]).find((p) => p.level === lvl);

  it('Judicator: Armor empowerment + Wits Stone Pool + Influence Regeneration Support', () => {
    expect(pick('judicatorFrame', 1).kind).toBe('power');
    expect(pick('judicatorFrame', 1).powerTemplateId).toBe('empower-buff-armor');

    const l2 = pick('judicatorFrame', 2);
    expect(l2.kind).toBe('stoneFunction');
    expect(l2.stoneFunction).toEqual({ kind: 'stonePool', attribute: 'wits' });

    const l3 = pick('judicatorFrame', 3);
    expect(l3.kind).toBe('stoneFunction');
    expect(l3.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'influence',
      stonePowerId: 'influence.regeneration',
    });
  });

  it('Oracle: L1 Base Armor stays authored, Aid Roll Support + Influence Stone Battery', () => {
    expect(pick('oracleFrame', 1).kind).toBe('authored');

    const l2 = pick('oracleFrame', 2);
    expect(l2.kind).toBe('stoneFunction');
    expect(l2.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'influence',
      stonePowerId: 'influence.aidRoll',
    });

    const l3 = pick('oracleFrame', 3);
    expect(l3.kind).toBe('stoneFunction');
    expect(l3.stoneFunction).toEqual({ kind: 'stoneBattery', attribute: 'influence' });
  });

  it('Sentinel: Single Heal Active + Resolve Stone Battery + Resolve Healing Support', () => {
    expect(pick('sentinelFrame', 1).kind).toBe('power');
    expect(pick('sentinelFrame', 1).powerTemplateId).toBe('active-ranged-single-heal');

    const l2 = pick('sentinelFrame', 2);
    expect(l2.kind).toBe('stoneFunction');
    expect(l2.stoneFunction).toEqual({ kind: 'stoneBattery', attribute: 'resolve' });

    const l3 = pick('sentinelFrame', 3);
    expect(l3.kind).toBe('stoneFunction');
    expect(l3.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'resolve',
      stonePowerId: 'resolve.healing',
    });
  });

  it('exposes all three Stone Functions as level-gated picks on every node', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('sentinelFrame')!);
    for (const node of tree.nodes) {
      const picks = (node.itemData.system as any).progressionPicks as any[];
      const stoneFns = picks.filter((p) => p.kind === 'stoneFunction');
      expect(stoneFns).toHaveLength(2);
    }
  });
});

describe('Echo Artifact tree builder — Stone Function auto-fill', () => {
  it('Dragon Claws carry a slot-legal Might stone support + matching L1 pick', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('dragonClaws')!);
    // The Stone Function unlocks at level 1, so it is active on every node.
    for (const node of tree.nodes) {
      const sys = node.itemData.system as any;
      expect(sys.stoneFunction).toEqual({
        kind: 'stonePowerSupport',
        attribute: 'might',
        stonePowerId: 'might.meleeDamage',
      });
      const l1 = (sys.progressionPicks as any[]).find((p) => p.level === 1);
      expect(l1.kind).toBe('stoneFunction');
      expect(l1.stoneFunction.stonePowerId).toBe('might.meleeDamage');
    }
  });

  it('gates the active Stone Function by its unlock level (Wyrm Scales = L3)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('wyrmScales')!);
    // Below L3 the active stoneFunction is null; the editable pick is still authored.
    expect((tree.nodes[0].itemData.system as any).stoneFunction).toBeNull();
    expect((tree.nodes[2].itemData.system as any).stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'might',
      stonePowerId: 'might.armor',
    });
    const picks = (tree.nodes[0].itemData.system as any).progressionPicks as any[];
    const l3 = picks.find((p) => p.level === 3);
    expect(l3.kind).toBe('stoneFunction');
  });

  it('omits a Stone Function for artifacts without a slot-legal one (Elven Stride)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('elvenStrideFire')!);
    for (const node of tree.nodes) {
      expect((node.itemData.system as any).stoneFunction).toBeNull();
    }
  });

  it('Elven Stride maps all three lines to editable catalog Powers (flavor names kept)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('elvenStrideFire')!);
    // L3 shows all three staged lines (slot 0/1/2 unlocked); display names keep
    // the Elven flavor via the pick `name` even though they are catalog Powers.
    const l3 = (tree.nodes[2].itemData.system as any).levelProgression.map((r: any) => r.name);
    expect(l3).toEqual(['Otherworld Reflex I', 'Elven Cling I', 'Ember Surge I']);

    // Picks are now real catalog Powers (no authored fallback).
    const picks = (tree.nodes[0].itemData.system as any).progressionPicks as any[];
    const byLevel = (lvl: number) => picks.find((p) => p.level === lvl);
    for (const lvl of [1, 2, 3]) expect(byLevel(lvl).kind).toBe('power');
    expect(byLevel(1).powerTemplateId).toBe('reaction-evade');
    expect(byLevel(2).powerTemplateId).toBe('movement-wall-walk');
    expect(byLevel(3).powerTemplateId).toBe('empower-buff-damage');

    // L2 Elven Cling uses the exact Wall Walk catalog distances (10 / 25 / 28 m
    // at stages I / II / III, unlocked at node levels 2 / 5 / 8).
    const clingEffectAt = (nodeLevel: number) =>
      ((tree.nodes[nodeLevel - 1].itemData.system as any).levelProgression.find((r: any) =>
        /Elven Cling/.test(r.name),
      )?.effect as string) || '';
    expect(clingEffectAt(2)).toContain('10 m');
    expect(clingEffectAt(5)).toContain('25 m');
    expect(clingEffectAt(8)).toContain('28 m');

    // Each lineage maps to its own Buff-Empowerment template + flavor name.
    const lineage: Record<string, [string, string]> = {
      elvenStrideEarth: ['empower-buff-armor', 'Stoneweave Guard I'],
      elvenStrideWater: ['empower-buff-evade', 'Tidal Slip I'],
      elvenStrideAir: ['empower-buff-wind', 'Wind-First I'],
    };
    for (const [key, [tplId, rowName]] of Object.entries(lineage)) {
      const lt = buildEchoArtifactTree(getEchoArtifact(key)!);
      const l3pick = (lt.nodes[0].itemData.system as any).progressionPicks.find(
        (p: any) => p.level === 3,
      );
      expect(l3pick.powerTemplateId).toBe(tplId);
      const names = (lt.nodes[2].itemData.system as any).levelProgression.map((r: any) => r.name);
      expect(names[2]).toBe(rowName);
    }
  });

  it('Elven Stride Evade (+2..+12) and Clinging (L4+) base values scale per spec', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('elvenStrideFire')!);
    const bvAt = (lvl: number, label: string) =>
      (tree.nodes[lvl - 1].itemData.system as any).baseValues.find((b: any) => b.label === label);
    expect(bvAt(1, 'Evade').value).toBe(2);
    expect(bvAt(9, 'Evade').value).toBe(10);
    expect(bvAt(10, 'Evade').value).toBe(12);
    expect(bvAt(3, 'Clinging')).toBeUndefined();
    expect(bvAt(4, 'Clinging').value).toBe(1);
    expect(bvAt(6, 'Clinging').value).toBe(2);
    expect(bvAt(8, 'Clinging').value).toBe(3);
    expect(bvAt(10, 'Clinging').value).toBe(4);
  });
});

describe('Echo Artifact tree builder — Titan Scars', () => {
  it('Medium Echo Armor scales +12 (L1) .. +22 (L10)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    expect((tree.nodes[0].itemData.system as any).baseValues[0].value).toBe(12);
    expect((tree.nodes[9].itemData.system as any).baseValues[0].value).toBe(22);
  });

  it('renders Titan Growth (Active Buff) / Titan Might (Stone) / Titan Healing verbatim', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    const l3rows = (tree.nodes[2].itemData.system as any).levelProgression as any[];
    expect(l3rows.map((r) => r.name)).toEqual(['Titan Growth I', 'Titan Might I', 'Titan Healing I']);

    // Titan Growth must stay an Active Buff so it routes to the Buff segment.
    const growth = l3rows.find((r) => r.name === 'Titan Growth I');
    expect(String(growth.type)).toBe('Active Buff');
    expect(String(growth.special)).toBe('Growth Form');
    expect(String(growth.effect)).toContain('Power Level 4');

    // Slot 2 stays the Melee Damage Stone Power Support.
    const picks = (tree.nodes[0].itemData.system as any).progressionPicks as any[];
    expect(picks.find((p) => p.level === 2).kind).toBe('stoneFunction');
    expect(picks.find((p) => p.level === 1).kind).toBe('authored');
    expect(picks.find((p) => p.level === 3).kind).toBe('authored');
  });

  it('Growth Form upgrades to PL 16 by L7 and keeps the True capstone', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    const l7 = (tree.nodes[6].itemData.system as any).levelProgression as any[];
    const growth7 = l7.find((r) => String(r.special) === 'Growth Form');
    expect(growth7.name).toBe('Titan Growth III');
    expect(String(growth7.effect)).toContain('Power Level 16');

    const l10 = (tree.nodes[9].itemData.system as any).levelProgression.map((r: any) => r.name);
    expect(l10).toContain('True Titan Scars');
  });
});

describe('Echo Artifact tree builder — Dragon Head', () => {
  it('has Bite damage and gated Scent of Blood base values', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('dragonHead')!);
    const l1 = (tree.nodes[0].itemData.system as any).baseValues;
    expect(l1.map((b: any) => b.type)).toEqual(['weaponDamage']);
    expect(l1[0].value).toBe('1d8');

    const l4 = (tree.nodes[3].itemData.system as any).baseValues;
    expect(l4.map((b: any) => b.label)).toEqual(['Bite Weapon Damage', 'Scent of Blood']);
    expect(l4.find((b: any) => b.label === 'Scent of Blood').value).toBe('Detect');

    const l10bv = (tree.nodes[9].itemData.system as any).baseValues;
    expect(l10bv.find((b: any) => b.label === 'Scent of Blood').value).toBe('Identify');
  });

  it('exposes Breath / Roar / Recovery from authored progression', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('dragonHead')!);
    const l3 = (tree.nodes[2].itemData.system as any).levelProgression.map((r: any) => r.name);
    expect(l3).toEqual(['Breath Weapon I', 'Draconic Roar I', 'Draconic Recovery I']);

    const l10 = (tree.nodes[9].itemData.system as any).levelProgression.map((r: any) => r.name);
    expect(l10).toContain('True Dragon Head');
    expect(l10).toHaveLength(4);
  });
});
