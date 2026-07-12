import { describe, expect, it } from 'vitest';
import {
  buildAllEchoArtifactTrees,
  buildEchoArtifactTree,
  ECHO_ARTIFACT_SEED_VERSION,
} from '../src/artifacts/echo-artifact-tree-builder.js';
import { ECHO_ARTIFACTS, getEchoArtifact } from '../src/utils/echo-artifacts.js';
import { visibleAbilityRows, resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { getEchoArtifactIcon } from '../src/utils/item-icons.js';

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

  it('uses custom echo-artifact icons on every node when available', () => {
    const cases: [string, string][] = [
      ['dragonClaws', 'Dragon Claws.png'],
      ['elorianStride', 'Elven Stride.png'],
      ['wyrmScalesLight', 'Serpent Scales.png'],
      ['wyrmScalesHeavy', 'Wyrm Scales.png'],
      ['titanScarsMight', 'Titan Scars.png'],
      ['sentinelFrame', 'Sentinel Frame.png'],
    ];
    for (const [key, fragment] of cases) {
      const icon = getEchoArtifactIcon(key);
      expect(icon, key).toContain('echo-artifacts/');
      expect(icon, key).toContain(fragment);
      const tree = buildEchoArtifactTree(getEchoArtifact(key)!);
      for (const node of tree.nodes) {
        expect(String(node.itemData.img), `${key} L${node.level}`).toContain(fragment);
      }
    }
  });

  it('node ids are deterministic and stable across builds', () => {
    const a = buildEchoArtifactTree(getEchoArtifact('wyrmScalesLight')!);
    const b = buildEchoArtifactTree(getEchoArtifact('wyrmScalesLight')!);
    expect(a.nodes.map((n) => n.nodeId)).toEqual(b.nodes.map((n) => n.nodeId));
    expect(a.nodes[0].nodeId).toBe('wyrmScalesLight-l1');
    expect(a.nodes[9].nodeId).toBe('wyrmScalesLight-l10');
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
  it('Light Wyrm Scales stores artifact bonus + light weight class', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('wyrmScalesLight')!);
    const bv = (lvl: number) =>
      (tree.nodes[lvl - 1].itemData.system as any).baseValues.find((b: any) => b.type === 'bodyArmor');
    expect(bv(1).value).toBe(4);
    expect(bv(1).armorWeightClass).toBe('light');
    expect(bv(10).value).toBe(14);
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
    expect((tree.nodes[9].itemData.system as any).baseValues[0].value).toBe('14d8');
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
    expect(ECHO_ARTIFACT_SEED_VERSION).toBe(35);
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

  it('Stonebound Soles map all three tracks to catalog Powers with rulebook names', () => {
    expect(pick('stoneboundSoles', 1).powerTemplateId).toBe('ab-immovable-temp-hp');
    expect(pick('stoneboundSoles', 1).displayName).toBe('Anchoring Stance');
    expect(pick('stoneboundSoles', 2).powerTemplateId).toBe('movement-safe-movement');
    expect(pick('stoneboundSoles', 2).displayName).toBe('Stone-Sure Step');
    expect(pick('stoneboundSoles', 3).powerTemplateId).toBe('empower-buff-armor');
    expect(pick('stoneboundSoles', 3).displayName).toBe('Stoneweave Guard');

    const tree = buildEchoArtifactTree(getEchoArtifact('stoneboundSoles')!);
    const l1Rows = (tree.nodes[0].itemData.system as any).levelProgression as any[];
    expect(l1Rows[0].name).toBe('Anchoring Stance I');
    expect(l1Rows[0].effect).toContain('40 Temporary HP');
    const l4Rows = (tree.nodes[3].itemData.system as any).levelProgression as any[];
    const stance = l4Rows.find((r: any) => String(r.name).includes('Anchoring Stance'));
    expect(stance?.effect).toContain('220 Temporary HP');
  });

  it('Wyrm Scales Heavy: Dragon Wings + Wyrm Scales armor buff + Vitality ARMOR Support', () => {
    expect(pick('wyrmScalesHeavy', 1).powerTemplateId).toBe('movement-flight');
    expect(pick('wyrmScalesHeavy', 1).displayName).toBe('Dragon Wings');

    const l2Pick = pick('wyrmScalesHeavy', 2);
    expect(l2Pick.kind).toBe('power');
    expect(l2Pick.powerTemplateId).toBe('ab-armor');
    expect(l2Pick.displayName).toBe('Wyrm Scales');

    const l3 = pick('wyrmScalesHeavy', 3);
    expect(l3.kind).toBe('stoneFunction');
    expect(l3.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'vitality',
      stonePowerId: 'vitality.armor',
    });

    const tree = buildEchoArtifactTree(getEchoArtifact('wyrmScalesHeavy')!);
    const l2Rows = (tree.nodes[1].itemData.system as any).levelProgression as any[];
    expect(l2Rows.find((r: any) => r.name === 'Wyrm Scales I')?.effect).toContain('+13 Armor');
    expect(l2Rows.find((r: any) => r.name === 'Wyrm Scales I')?.powerTemplateId).toBe('ab-armor');
    const l5Rows = (tree.nodes[4].itemData.system as any).levelProgression as any[];
    expect(l5Rows.find((r: any) => r.name === 'Wyrm Scales II')?.effect).toContain('+31 Armor');
  });

  it('Serpent Scales: Dragon Wings + ab-evade / mobility extension + EVADE Stone Support', () => {
    expect(pick('wyrmScalesLight', 1).powerTemplateId).toBe('movement-flight');
    expect(pick('wyrmScalesLight', 1).displayName).toBe('Dragon Wings');

    const l2Pick = pick('wyrmScalesLight', 2);
    expect(l2Pick.kind).toBe('power');
    expect(l2Pick.powerTemplateId).toBe('ab-evade');
    expect(l2Pick.displayName).toBe('Serpent Evasion');
    expect(l2Pick.stageTemplateIds).toEqual([
      'ab-evade',
      'extend-buff-mobility',
      'extend-buff-mobility',
    ]);
    expect(l2Pick.stageNames).toEqual([
      'Serpent Evasion I',
      'Mobility Buff Extension II',
      'Mobility Buff Extension III',
    ]);

    const l3 = pick('wyrmScalesLight', 3);
    expect(l3.kind).toBe('stoneFunction');
    expect(l3.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'agility',
      stonePowerId: 'agility.evade',
    });

    const tree = buildEchoArtifactTree(getEchoArtifact('wyrmScalesLight')!);
    expect(tree.folderName).toBe('Serpent Scales');
    const l2Rows = (tree.nodes[1].itemData.system as any).levelProgression as any[];
    expect(l2Rows.some((r: any) => r.name === 'Serpent Evasion I')).toBe(true);
    const l5Rows = (tree.nodes[4].itemData.system as any).levelProgression as any[];
    expect(l5Rows.some((r: any) => r.name === 'Mobility Buff Extension II')).toBe(true);
    const l10 = (tree.nodes[9].itemData.system as any).levelProgression as any[];
    expect(l10.some((r: any) => r.name === 'True Serpent Form')).toBe(true);
  });

  it('Dragon Claws bind Lacerate and Push on weapon AoE picks', () => {
    const l2 = pick('dragonClaws', 2);
    const l3 = pick('dragonClaws', 3);
    expect(l2.powerTemplateId).toBe('active-melee-weapon-aoe');
    expect(l2.chosenSpecial?.key).toBe('lacerate');
    expect(l3.chosenSpecial?.key).toBe('push');
    const tree = buildEchoArtifactTree(getEchoArtifact('dragonClaws')!);
    const l3Rows = (tree.nodes[2].itemData.system as any).levelProgression as any[];
    const tail = l3Rows.find((r) => String(r.name).includes('Tail Sweep'));
    expect(tail?.special).toBe('Push(2)');
  });

  it('Oracle: Oracle Field armor aura + Aid Roll Support + Influence Stone Pool', () => {
    expect(pick('oracleFrame', 1).kind).toBe('power');
    expect(pick('oracleFrame', 1).powerTemplateId).toBe('ab-armor-aura');
    expect(pick('oracleFrame', 1).stagePowerLevels).toEqual(['1', '3', '5']);
    expect(pick('oracleFrame', 1).stageNumerals).toEqual(['I', 'III', 'V']);

    const l2 = pick('oracleFrame', 2);
    expect(l2.kind).toBe('stoneFunction');
    expect(l2.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'influence',
      stonePowerId: 'influence.aidRoll',
    });

    const l3 = pick('oracleFrame', 3);
    expect(l3.kind).toBe('stoneFunction');
    expect(l3.stoneFunction).toEqual({ kind: 'stonePool', attribute: 'influence' });

    const tree = buildEchoArtifactTree(getEchoArtifact('oracleFrame')!);
    const l7Rows = (tree.nodes[6].itemData.system as any).levelProgression as any[];
    const field = l7Rows.find((r) => String(r.name).includes('Oracle Field'));
    expect(field?.name).toBe('Oracle Field V');
    expect(field?.effect).toContain('+14 Armor');
    expect(field?.aoe).toContain('10');
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

  it('gates Vitality ARMOR Stone Support by pick level on Wyrm Scales Heavy', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('wyrmScalesHeavy')!);
    expect((tree.nodes[0].itemData.system as any).stoneFunction).toBeNull();
    const picks = (tree.nodes[0].itemData.system as any).progressionPicks as any[];
    const l3 = picks.find((p) => p.level === 3);
    expect(l3.kind).toBe('stoneFunction');
    expect(l3.stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'vitality',
      stonePowerId: 'vitality.armor',
    });
  });

  it('omits a Stone Function for artifacts without a slot-legal one (Elorian Stride)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('elorianStride')!);
    for (const node of tree.nodes) {
      expect((node.itemData.system as any).stoneFunction).toBeNull();
    }
  });

  it('Elorian Stride maps reflex, cling, and focus lines to editable picks', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('elorianStride')!);
    const l3 = (tree.nodes[2].itemData.system as any).levelProgression.map((r: any) => r.name);
    expect(l3).toEqual(['Otherworld Reflex I', 'Elorian Cling I', 'Elorian Focus I']);

    const picks = (tree.nodes[0].itemData.system as any).progressionPicks as any[];
    const byLevel = (lvl: number) => picks.find((p) => p.level === lvl);
    expect(byLevel(1).kind).toBe('power');
    expect(byLevel(1).powerTemplateId).toBe('reaction-evade');
    expect(byLevel(2).powerTemplateId).toBe('movement-wall-walk');
    expect(byLevel(3).kind).toBe('stoneFunction');
    expect(byLevel(3).stoneFunction.stonePowerId).toBe('agility.crit');

    const clingEffectAt = (nodeLevel: number) =>
      ((tree.nodes[nodeLevel - 1].itemData.system as any).levelProgression.find((r: any) =>
        /Elorian Cling/.test(r.name),
      )?.effect as string) || '';
    expect(clingEffectAt(2)).toContain('10 m');
    expect(clingEffectAt(5)).toContain('25 m');
    expect(clingEffectAt(8)).toContain('28 m');
  });

  it('Elorian Stride Evade (+2..+12) and Movement (L4+) base values scale per spec', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('elorianStride')!);
    const bvAt = (lvl: number, label: string) =>
      (tree.nodes[lvl - 1].itemData.system as any).baseValues.find((b: any) => b.label === label);
    expect(bvAt(1, 'Evade').value).toBe(2);
    expect(bvAt(9, 'Evade').value).toBe(10);
    expect(bvAt(10, 'Evade').value).toBe(12);
    expect(bvAt(3, 'Movement')).toBeUndefined();
    expect(bvAt(4, 'Movement').value).toBe(1);
    expect(bvAt(6, 'Movement').value).toBe(2);
    expect(bvAt(8, 'Movement').value).toBe(3);
    expect(bvAt(10, 'Movement').value).toBe(4);
  });
});

describe('Echo Artifact tree builder — Titan Scars', () => {
  it('Medium Echo Armor stores artifact bonus + weight class (L1 bonus +4 → total 12 with medium base 8)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    const bv = (tree.nodes[0].itemData.system as any).baseValues[0];
    expect(bv.value).toBe(4);
    expect(bv.armorWeightClass).toBe('medium');
    expect((tree.nodes[9].itemData.system as any).baseValues[0].value).toBe(14);
    expect((tree.nodes[0].itemData.system as any).artifactArmor.type).toBe('medium');
  });

  it('renders Titan Growth (Active Buff) / Titan <Attr> Pool (Stone) / Titan Regeneration as real Powers', () => {
    // getEchoArtifact('titanScars') resolves via alias to the Might-affinity variant.
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    const l3rows = (tree.nodes[2].itemData.system as any).levelProgression as any[];
    expect(l3rows.map((r) => r.name)).toEqual([
      'Titan Growth I',
      'Titan Might Pool I',
      'Titan Regeneration I',
    ]);

    // Titan Growth is now the Active Buff: Armor + Temporary HP catalog Power, so it
    // stays an Active Buff (routes to the Buff segment) and shows the template effect.
    const growth = l3rows.find((r) => r.name === 'Titan Growth I');
    expect(String(growth.type)).toBe('Active Buff');
    expect(String(growth.effect)).toContain('Armor');
    expect(String(growth.effect)).toContain('Temporary HP');

    // Slot 2 is the chosen-attribute Stone Pool (Might for this variant); Slots 1 & 3
    // are real catalog Power picks (no longer authored fallback).
    const picks = (tree.nodes[0].itemData.system as any).progressionPicks as any[];
    const l2pick = picks.find((p) => p.level === 2);
    expect(l2pick.kind).toBe('stoneFunction');
    expect(l2pick.stoneFunction).toEqual({ kind: 'stonePool', attribute: 'might' });
    expect(picks.find((p) => p.level === 1).kind).toBe('power');
    expect(picks.find((p) => p.level === 3).kind).toBe('power');
  });

  it('Titan Growth upgrades to PL 16 by L7 and keeps the True capstone', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    const l7 = (tree.nodes[6].itemData.system as any).levelProgression as any[];
    const growth7 = l7.find((r) => r.name === 'Titan Growth III');
    expect(growth7).toBeTruthy();
    // PL16 Armor + Temporary HP row: +17 Armor / 91 Temporary HP.
    expect(String(growth7.effect)).toContain('17 Armor');

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
