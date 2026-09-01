import { describe, expect, it } from 'vitest';
import {
  buildAllGeneralArtifactTrees,
  buildEchoArtifactTree,
  ECHO_ARTIFACT_SEED_VERSION,
} from '../src/artifacts/echo-artifact-tree-builder.js';
import { GENERAL_ARTIFACTS, getGeneralArtifact } from '../src/utils/general-artifacts.js';
import {
  visibleAbilityRows,
  resolveFullLevelProgression,
} from '../src/utils/artifact-visible-abilities.js';
import { buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { getEchoArtifactAltIcon, getEchoArtifactIcon } from '../src/utils/item-icons.js';

/**
 * The Level Progression the tree builder actually emits for a general artifact:
 * the authored table verbatim, unless the definition opts into standard catalog
 * Powers via `progressionPickSpecs` (then 1–9 are derived and only the L10
 * Ultimate is authored).
 */
function resolvedProgression(def: any) {
  return def.progressionPickSpecs
    ? resolveFullLevelProgression(def.levelProgression, buildEchoProgressionPicks(def) as any)
    : def.levelProgression;
}

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
  it('contains exactly the 11 Artifact Examples', () => {
    expect(Object.keys(GENERAL_ARTIFACTS)).toEqual([
      'moonlightGreatsword',
      'soulSigil',
      'frostboundReturningAxe',
      'shadowgraveArmor',
      'staffOfTheDark',
      'starfallenForceshield',
      'heartOfWinter',
      'heartseeker',
      'falconWideBrim',
      'lanternOfTheHollowStar',
      'lorKethsStaff',
    ]);
  });

  it('every definition has an empty echoKey and a complete 10-row progression', () => {
    for (const def of Object.values(GENERAL_ARTIFACTS)) {
      expect(def.echoKey).toBe('');
      const full = resolvedProgression(def);
      expect(full).toHaveLength(10);
      expect(full.map((r: any) => r.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(full[9].type === 'Ultimate' || full[9].type === 'Base Completion').toBe(true);
      expect(full[9].name.length).toBeGreaterThan(0);
    }
  });
});

describe('General Artifact trees — structure and binding', () => {
  it('builds one 10-node tree per catalog entry', () => {
    const trees = buildAllGeneralArtifactTrees();
    expect(trees.length).toBe(11);
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

  it('exposes only the abilities visible at each node level', () => {
    for (const tree of buildAllGeneralArtifactTrees()) {
      const def = getGeneralArtifact(tree.echoArtifactKey)!;
      const full = resolvedProgression(def);
      for (const node of tree.nodes) {
        const sys = node.itemData.system as any;
        expect(sys.levelProgression).toEqual(visibleAbilityRows(full, node.level));
        if (node.level === 1) expect(sys.levelProgression).toHaveLength(1);
        if (node.level === 2) expect(sys.levelProgression).toHaveLength(2);
        if (node.level >= 3 && node.level <= 9) expect(sys.levelProgression).toHaveLength(3);
        if (node.level === 10) expect(sys.levelProgression).toHaveLength(4);
        expect(sys.powers).toHaveLength(sys.levelProgression.length);
      }
    }
  });

  it('uses the authored rulebook rows 1:1 for artifacts without progressionPickSpecs', () => {
    const def = getGeneralArtifact('lorKethsStaff')!;
    // No pick specs → authored table is the source of truth (no recompilation).
    expect(def.progressionPickSpecs).toBeUndefined();
    expect(def.levelProgression).toHaveLength(10);
    const tree = buildEchoArtifactTree(def);
    for (const node of tree.nodes) {
      expect((node.itemData.system as any).levelProgression).toEqual(
        visibleAbilityRows(def.levelProgression, node.level),
      );
    }
    // The authored L1 name survives verbatim.
    expect(sysAt(tree, 1).levelProgression[0].name).toBe(def.levelProgression[0].name);
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

  it('damage scales 5d8 → 14d8 (4d8 two-handed base + 1d8/level)', () => {
    const expected = ['5d8', '6d8', '7d8', '8d8', '9d8', '10d8', '11d8', '12d8', '13d8', '14d8'];
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Weapon Damage').value).toBe(expected[lvl - 1]);
      expect(sysAt(tree, lvl).artifactWeapon.damage).toBe(expected[lvl - 1]);
    }
  });

  it('Requiem unlocks at L4 (rank 4) and upgrades at L7 (rank 8)', () => {
    expect(baseValue(tree, 3, 'Requiem')).toBeUndefined();
    expect(baseValue(tree, 4, 'Requiem').value).toBe(4);
    expect(baseValue(tree, 7, 'Requiem').value).toBe(8);
    expect(baseValue(tree, 10, 'Requiem').value).toBe(8);
  });

  it('Expose unlocks at L7 (rank 4) and upgrades at L10 (rank 8)', () => {
    expect(baseValue(tree, 6, 'Expose')).toBeUndefined();
    expect(baseValue(tree, 7, 'Expose').value).toBe(4);
    expect(baseValue(tree, 10, 'Expose').value).toBe(8);
  });

  it('builds its three signature lines from standard catalog Powers (only renamed)', () => {
    const def = getGeneralArtifact('moonlightGreatsword')!;
    // The 1–9 rows are standard Powers, not authored text: only the names differ.
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks.map((p) => p.kind)).toEqual(['power', 'power', 'power']);
    expect(picks.map((p) => p.powerTemplateId)).toEqual([
      'active-ranged-single-heal',
      'active-ranged-aoe-targeted-special',
      'ab-damage-aura',
    ]);
    expect(picks[1].chosenSpecial?.key).toBe('requiem');

    const byLevel = new Map(resolvedProgression(def).map((r: any) => [r.level, r]));
    for (const lvl of [1, 4, 7]) expect((byLevel.get(lvl) as any).name).toMatch(/Moonlight Mending/);
    for (const lvl of [2, 5, 8]) expect((byLevel.get(lvl) as any).name).toMatch(/Moonlight Judgment/);
    for (const lvl of [3, 6, 9]) expect((byLevel.get(lvl) as any).name).toMatch(/Moonlight Shadow/);
    expect((byLevel.get(10) as any).name).toBe('True Moonlight');

    const mending = sysAt(tree, 7).powers.find((p: any) => /Moonlight Mending/.test(p.name));
    expect(mending.category).toBe('active');
    const shadow = sysAt(tree, 6).powers.find((p: any) => /Moonlight Shadow/.test(p.name));
    expect(shadow.category).toBe('activeBuff');
  });

  it('Moonlight Judgment is a ranged AoE Targeted Special with Requiem', () => {
    const judgment = sysAt(tree, 8).powers.find((p: any) => /Moonlight Judgment/.test(p.name));
    expect(judgment).toBeTruthy();
    expect(judgment.category).toBe('active');
    const byLevel = new Map(resolvedProgression(getGeneralArtifact('moonlightGreatsword')!).map((r: any) => [r.level, r]));
    const row = byLevel.get(8) as any;
    expect(String(row?.powerTemplateId ?? '')).toBe('active-ranged-aoe-targeted-special');
    expect(String(row?.chosenSpecialKey ?? row?.chosenSpecial?.key ?? '')).toBe('requiem');
    expect(baseValue(tree, 8, 'Requiem').value).toBe(8);
  });
});

describe('Soul Sigil', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('soulSigil')!);

  it('is Silver Veil Light Armor (4→8 paired) with Evade +2 → +11', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('body');
    expect(sys.baseProfile).toBe('bodyArmor');
    const armorTotals = [4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
    const lightArmorBase = 4;
    for (let lvl = 1; lvl <= 10; lvl++) {
      const bv = sysAt(tree, lvl).baseValues;
      expect(bv).toHaveLength(2);
      const armor = bv.find((b: any) => b.type === 'bodyArmor');
      const evade = bv.find((b: any) => b.type === 'evade');
      expect(armor.value).toBe(armorTotals[lvl - 1]! - lightArmorBase);
      expect(armor.armorWeightClass).toBe('light');
      expect(evade.value).toBe(1 + lvl);
    }
    expect(baseValue(tree, 1, 'Evade (Silver Veil)').value).toBe(2);
    expect(baseValue(tree, 10, 'Evade (Silver Veil)').value).toBe(11);
    expect(baseValue(tree, 1, 'Light Armor').value).toBe(0);
    expect(baseValue(tree, 10, 'Light Armor').value).toBe(4);
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

  it('builds its three lines from standard Powers (Soul Shell support + Phasing reaction + Phasing buff)', () => {
    const def = getGeneralArtifact('soulSigil')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks[0].kind).toBe('stoneFunction');
    expect(picks[1]).toMatchObject({ kind: 'power', powerTemplateId: 'reaction-phasing' });
    expect(picks[2]).toMatchObject({ kind: 'power', powerTemplateId: 'ab-phasing' });

    const byLevel = new Map(resolvedProgression(def).map((r: any) => [r.level, r]));
    for (const lvl of [1, 4, 7]) expect((byLevel.get(lvl) as any).name).toMatch(/Soul Shell/);
    for (const lvl of [2, 5, 8]) expect((byLevel.get(lvl) as any).name).toMatch(/Uncanny Soul/);
    for (const lvl of [3, 6, 9]) expect((byLevel.get(lvl) as any).name).toMatch(/Resting Soul/);
    expect((byLevel.get(10) as any).name).toBe('True Soul Sigil');

    // The Phasing lines are real catalog Powers, not authored text.
    const reaction = sysAt(tree, 8).powers.find((p: any) => /Uncanny Soul/.test(p.name));
    expect(reaction.category).toBe('reaction');
    const buff = sysAt(tree, 9).powers.find((p: any) => /Resting Soul/.test(p.name));
    expect(buff.category).toBe('activeBuff');
  });
});

describe('Frostbound Returning Axe', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('frostboundReturningAxe')!);

  it('is a one-handed main-hand weapon with 3d8 → 12d8 damage (2d8 base + 1d8/level)', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('mainHand');
    expect(sys.baseProfile).toBe('oneHandedWeapon');
    expect(sys.equipSlots).toEqual(['mainhand']);
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Weapon Damage').value).toBe(`${lvl + 2}d8`);
    }
  });

  it('thrown range unlocks at L4 with 9 m and scales +1 m per level to 15 m', () => {
    expect(baseValue(tree, 3, 'Thrown Return')).toBeUndefined();
    expect(baseValue(tree, 4, 'Thrown Return').value).toBe('9 m');
    expect(baseValue(tree, 5, 'Thrown Return').value).toBe('10 m');
    expect(baseValue(tree, 10, 'Thrown Return').value).toBe('15 m');
  });

  it('uses the Frostbite icon from general-artifacts', () => {
    expect(getEchoArtifactIcon('frostboundReturningAxe')).toBe(
      'systems/mastery-system/assets/icons/items/general-artifacts/Frostbite.png',
    );
    expect(tree.nodes[0].itemData.img).toBe(getEchoArtifactIcon('frostboundReturningAxe'));
  });

  it('supports the Ignore Armor Stone Power from L1', () => {
    expect(sysAt(tree, 1).stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'might',
      stonePowerId: 'might.ignoreArmor',
    });
  });

  it('builds all three lines from catalog picks (Stormpower stone + Ranged Slow + Rainshield)', () => {
    const def = getGeneralArtifact('frostboundReturningAxe')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks[0].kind).toBe('stoneFunction');
    expect(picks[1]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'active-ranged-damage-t4',
      delivery: 'ranged-single',
      chosenSpecial: { key: 'slow', tier: 4 },
    });
    expect(picks[2]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'reaction-special-increase',
    });

    const byLevel = new Map(resolvedProgression(def).map((r: any) => [r.level, r]));
    for (const lvl of [1, 4, 7]) expect((byLevel.get(lvl) as any).name).toMatch(/Stormpower/);
    for (const lvl of [2, 5, 8]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Frost Throw/);
      expect(row.type).toBe('Ranged');
      expect(row.special).toMatch(/slow/i);
    }
    for (const lvl of [3, 6, 9]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Rainshield/);
      expect(row.type).toBe('Reaction');
    }

    const frostThrow = sysAt(tree, 5).powers.find((p: any) => /Frost Throw/.test(p.name));
    expect(frostThrow.category).toBe('active');
    const rainshield = sysAt(tree, 6).powers.find((p: any) => /Rainshield/.test(p.name));
    expect(rainshield.category).toBe('reaction');
  });
});

describe('Heart of Winter', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('heartOfWinter')!);

  it('is a medium shield usable in main hand or off hand with +5 → +14 Shield Armor', () => {
    const sys = sysAt(tree, 1);
    expect(sys.baseProfile).toBe('shield');
    expect(sys.artifactKind).toBe('shield');
    expect(sys.slot).toBe('offHand');
    expect(sys.equipSlots).toEqual(['mainhand', 'offhand']);
    expect(sys.artifactShield).toMatchObject({
      type: 'medium',
      evadeBonus: 0,
      skillPenalty: '-2d8 Physical Skill Checks',
    });
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Shield Armor').value).toBe(lvl + 4);
      expect(sysAt(tree, lvl).artifactShield.shieldValue).toBe(lvl + 4);
    }
  });

  it('supports the Temporary HP Stone Power from L1 as Frozen Reserve', () => {
    expect(sysAt(tree, 1).stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'vitality',
      stonePowerId: 'vitality.tempHp',
    });
  });

  it('uses the Heart of Winter icon from general-artifacts', () => {
    expect(getEchoArtifactIcon('heartOfWinter')).toBe(
      'systems/mastery-system/assets/icons/items/general-artifacts/HeartofIce.png',
    );
    expect(tree.nodes[0].itemData.img).toBe(getEchoArtifactIcon('heartOfWinter'));
  });

  it('builds all three lines from catalog picks (Frozen Reserve + Ally Armor reaction + Melee AoE Slow)', () => {
    const def = getGeneralArtifact('heartOfWinter')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks[0].kind).toBe('stoneFunction');
    expect(picks[1]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'reaction-ally-armor',
    });
    expect(picks[2]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'active-melee-aoe-damage-t4',
      delivery: 'melee-aoe',
      chosenSpecial: { key: 'slow', tier: 4 },
    });

    const byLevel = new Map(resolvedProgression(def).map((r: any) => [r.level, r]));
    for (const lvl of [1, 4, 7]) expect((byLevel.get(lvl) as any).name).toMatch(/Frozen Reserve/);
    for (const lvl of [2, 5, 8]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Glacial Intercept/);
      expect(row.type).toBe('Reaction');
      expect(row.effect).toMatch(/\+(7|19|31) Armor/);
    }
    for (const lvl of [3, 6, 9]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Frostwave/);
      expect(row.type).toMatch(/Melee AoE/);
      expect(row.special).toMatch(/slow/i);
    }
    expect((byLevel.get(10) as any).name).toBe('Heart of Winter');

    const intercept = sysAt(tree, 5).powers.find((p: any) => /Glacial Intercept/.test(p.name));
    expect(intercept.category).toBe('reaction');
    const frostwave = sysAt(tree, 6).powers.find((p: any) => /Frostwave/.test(p.name));
    expect(frostwave.category).toBe('active');
  });
});

describe('Heartseeker', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('heartseeker')!);

  it('is a two-handed ranged weapon (Heavy Crossbow) occupying both hands', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('bothHands');
    expect(sys.baseProfile).toBe('twoHandedWeaponRanged');
    expect(sys.artifactKind).toBe('weapon');
    expect(sys.equipSlots).toEqual(['mainhand', 'offhand']);
    expect(sys.artifactWeapon).toMatchObject({
      weaponType: 'ranged',
      hands: 2,
      innateAbilities: ['Ranged (32 m)', 'Load'],
    });
    expect(sys.artifactWeapon.specials).toEqual([
      { specialId: 'penetration', value: 4 },
      { specialId: 'precision', value: 4 },
    ]);
  });

  it('damage scales 5d8 → 14d8 and Precision bonus unlocks at L4', () => {
    const expected = ['5d8', '6d8', '7d8', '8d8', '9d8', '10d8', '11d8', '12d8', '13d8', '14d8'];
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Weapon Damage').value).toBe(expected[lvl - 1]);
      expect(sysAt(tree, lvl).artifactWeapon.damage).toBe(expected[lvl - 1]);
    }
    expect(baseValue(tree, 3, 'Precision')).toBeUndefined();
    expect(baseValue(tree, 4, 'Precision').value).toBe(2);
    expect(baseValue(tree, 7, 'Precision').value).toBe(3);
    expect(baseValue(tree, 10, 'Precision').value).toBe(4);
    expect(sysAt(tree, 7).artifactWeapon.specials).toEqual([
      { specialId: 'penetration', value: 4 },
      { specialId: 'precision', value: 7 },
    ]);
  });

  it('uses the Heartseeker icon from general-artifacts', () => {
    expect(getEchoArtifactIcon('heartseeker')).toBe(
      'systems/mastery-system/assets/icons/items/general-artifacts/Heartseeker.png',
    );
    expect(tree.nodes[0].itemData.img).toBe(getEchoArtifactIcon('heartseeker'));
  });

  it('builds all three lines from catalog picks (Split Attack + Critical stone + Damage/Penetration buff)', () => {
    const def = getGeneralArtifact('heartseeker')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks[0]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'active-ranged-weapon-split',
    });
    expect(picks[1].kind).toBe('stoneFunction');
    expect(picks[2]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'ab-damage-penetration',
    });

    const byLevel = new Map(resolvedProgression(def).map((r: any) => [r.level, r]));
    for (const lvl of [1, 4, 7]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Divided Execution/);
      expect(row.type).toBe('Ranged');
    }
    for (const lvl of [2, 5, 8]) expect((byLevel.get(lvl) as any).name).toMatch(/Killing Focus/);
    for (const lvl of [3, 6, 9]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Armorbreaker/);
      expect(row.type).toBe('Active Buff');
    }
    expect((byLevel.get(10) as any).name).toBe('True Heartseeker');

    expect(sysAt(tree, 2).stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'agility',
      stonePowerId: 'agility.crit',
    });
  });
});

describe('Falcon Wide Brim', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('falconWideBrim')!);

  it('is a head-slot hat with +1 → +5 Evade and Predator Sense from L4', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('head');
    expect(sys.gearSlot).toBe('head');
    expect(sys.baseProfile).toBe('headArmor');
    expect(sys.artifactKind).toBe('gear');
    expect(sys.equipSlots).toEqual(['head']);
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Evade').value).toBe(Math.ceil(lvl / 2));
    }
    expect(baseValue(tree, 3, 'Combat Sense')).toBeUndefined();
    expect(baseValue(tree, 4, 'Combat Sense').value).toBe('Predator Sense');
    expect(baseValue(tree, 10, 'Combat Sense').value).toBe('Predator Sense');
  });

  it('supports Wits Initiative Boost from L1 as Falcon Initiative', () => {
    expect(sysAt(tree, 1).stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'wits',
      stonePowerId: 'wits.initiativeBoost',
    });
  });

  it('uses the Falcon Wide Brim icon from general-artifacts', () => {
    expect(getEchoArtifactIcon('falconWideBrim')).toBe(
      'systems/mastery-system/assets/icons/items/general-artifacts/Falcon Wide Brim.png',
    );
    expect(tree.nodes[0].itemData.img).toBe(getEchoArtifactIcon('falconWideBrim'));
  });

  it('builds all three lines from catalog picks (Initiative Boost + Reposition + Initiative Gain)', () => {
    const def = getGeneralArtifact('falconWideBrim')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks[0].kind).toBe('stoneFunction');
    expect(picks[1]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'reaction-reposition',
    });
    expect(picks[2]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'reaction-initiative-gain',
    });

    const byLevel = new Map(resolvedProgression(def).map((r: any) => [r.level, r]));
    for (const lvl of [1, 4, 7]) expect((byLevel.get(lvl) as any).name).toMatch(/Falcon Initiative/);
    for (const lvl of [2, 5, 8]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Falcon Step/);
      expect(row.type).toBe('Reaction');
      expect(row.effect).toMatch(/2 m|4 m|8 m/);
    }
    for (const lvl of [3, 6, 9]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Falcon Momentum/);
      expect(row.type).toBe('Reaction');
      expect(row.effect).toMatch(/\+8 Initiative|\+20 Initiative|\+32 Initiative/);
    }
    expect((byLevel.get(10) as any).name).toBe('True Falcon Wide Brim');

    const step = sysAt(tree, 5).powers.find((p: any) => /Falcon Step/.test(p.name));
    expect(step.category).toBe('reaction');
    const momentum = sysAt(tree, 6).powers.find((p: any) => /Falcon Momentum/.test(p.name));
    expect(momentum.category).toBe('reaction');
  });
});

describe('Shadowgrave Armor', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('shadowgraveArmor')!);

  it('hybrid defense: Armor 4→9 total and Evade +4→+13, both from L1', () => {
    // Since armor weight classes (v0.9.125), the base value stores only the
    // hybrid BONUS on top of the Light-Armor base (4); the total stays 4→9.
    const armorTotalTable = [4, 4, 5, 5, 6, 6, 7, 7, 8, 9];
    const lightArmorBase = 4;
    for (let lvl = 1; lvl <= 10; lvl++) {
      const armorRow = baseValue(tree, lvl, 'Hybrid Defense (Armor)');
      expect(armorRow.value).toBe(armorTotalTable[lvl - 1] - lightArmorBase);
      expect(armorRow.armorWeightClass).toBe('light');
      expect(baseValue(tree, lvl, 'Hybrid Defense (Evade)').value).toBe(lvl + 3);
    }
  });

  it('is body armor with a Temporary HP stone support', () => {
    const sys = sysAt(tree, 1);
    expect(sys.baseProfile).toBe('bodyArmor');
    expect(sys.artifactKind).toBe('armor');
    expect(sys.stoneFunction.stonePowerId).toBe('vitality.tempHp');
  });

  it('builds its three lines from standard Powers (Shadow Shell + Reprisal + Hands)', () => {
    const def = getGeneralArtifact('shadowgraveArmor')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks[0].kind).toBe('stoneFunction');
    expect(picks[1]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'reaction-counter-damage-push',
    });
    expect(picks[2]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'active-ranged-aoe-damage-t5',
      delivery: 'ranged-aoe',
      chosenSpecial: { key: 'root', tier: 5 },
    });
    expect(picks.every((p: any) => p.kind !== 'authored')).toBe(true);

    const byLevel = new Map(resolvedProgression(def).map((r: any) => [r.level, r]));
    for (const lvl of [1, 4, 7]) expect((byLevel.get(lvl) as any).name).toMatch(/Shadow Shell/);
    for (const lvl of [2, 5, 8]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Deathly Reprisal/);
      expect(row.type).toBe('Reaction');
    }
    const ranges = { 3: '20m', 6: '44m', 9: '68m' } as Record<number, string>;
    const radii = { 3: 'Radius 3m', 6: 'Radius 5m', 9: 'Radius 7m' } as Record<number, string>;
    for (const lvl of [3, 6, 9]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Hands of the Grave/);
      expect(row.type).toBe('Ranged AoE');
      expect(row.range).toBe(ranges[lvl]);
      expect(row.aoe).toBe(radii[lvl]);
      expect(row.special).toMatch(/root/i);
    }
    expect((byLevel.get(10) as any).name).toBe('True Shadowgrave Armor');

    const reprisal = sysAt(tree, 5).powers.find((p: any) => /Deathly Reprisal/.test(p.name));
    expect(reprisal.category).toBe('reaction');
    const hands = sysAt(tree, 6).powers.find((p: any) => /Hands of the Grave/.test(p.name));
    expect(hands.category).toBe('active');
  });

  it('no longer defines the old "Grave Call" melee active', () => {
    const def = getGeneralArtifact('shadowgraveArmor')!;
    const names = resolvedProgression(def).map((r: any) => r.name).join(' ');
    expect(names).not.toMatch(/Grave Call/);
  });
});

describe('Staff of the Dark', () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('staffOfTheDark')!);

  it('is a Spell Focus, not a melee weapon (no weapon attack surfaced)', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('mainHand');
    expect(sys.equipSlots).toEqual(['mainhand', 'offhand']);
    // Gear kind → the radial menu never builds a weapon attack for it.
    expect(sys.artifactKind).toBe('gear');
    expect(sys.artifactWeapon).toBeUndefined();
  });

  it('uses the Nethrion staff render and the combined magic alternative image', () => {
    expect(getEchoArtifactIcon('staffOfTheDark')).toMatch(/StaffOfNethrion_Render\.png/);
    expect(tree.nodes[0].itemData.img).toBe(getEchoArtifactIcon('staffOfTheDark'));
    expect(getEchoArtifactAltIcon('staffOfTheDark')).toMatch(/StaffOfNethrion_RenderMagic\.png/);
    for (const node of tree.nodes) {
      expect((node.itemData.system as any).imgAlt).toBe(getEchoArtifactAltIcon('staffOfTheDark'));
    }
  });

  it('Spell Focus Bonus scales +3d8 (L1) → +12d8 (L10), 1:1 one-handed weapon damage', () => {
    expect(baseValue(tree, 1, 'Spell Focus Bonus').value).toBe('+3d8');
    expect(baseValue(tree, 5, 'Spell Focus Bonus').value).toBe('+7d8');
    expect(baseValue(tree, 10, 'Spell Focus Bonus').value).toBe('+12d8');
  });

  it('Hex (Focus Special) uses its own breakpoints: 2 at L4-5, 3 at L6-7, 4 at L8-9, 5 at L10', () => {
    expect(baseValue(tree, 3, 'Hex')).toBeUndefined();
    expect(baseValue(tree, 4, 'Hex').value).toBe(2);
    expect(baseValue(tree, 5, 'Hex').value).toBe(2);
    expect(baseValue(tree, 6, 'Hex').value).toBe(3);
    expect(baseValue(tree, 7, 'Hex').value).toBe(3);
    expect(baseValue(tree, 8, 'Hex').value).toBe(4);
    expect(baseValue(tree, 9, 'Hex').value).toBe(4);
    expect(baseValue(tree, 10, 'Hex').value).toBe(5);
  });

  it('builds its three lines from catalog Spells (Melee AoE Hex + Ranged Single + Ruin)', () => {
    const def = getGeneralArtifact('staffOfTheDark')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks[0]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'active-melee-aoe-damage-t5',
      delivery: 'melee-aoe',
      chosenSpecial: { key: 'hex', tier: 5 },
      isSpell: true,
    });
    expect(picks[1]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'active-ranged-weapon-single',
      isSpell: true,
    });
    expect(picks[2]).toMatchObject({
      kind: 'power',
      powerTemplateId: 'active-ranged-damage-t4',
      delivery: 'ranged-single',
      chosenSpecial: { key: 'ruin', tier: 4 },
      isSpell: true,
    });
    expect(picks.every((p: any) => p.kind !== 'authored')).toBe(true);

    const byLevel = new Map(resolvedProgression(def).map((r: any) => [r.level, r]));
    for (const lvl of [1, 4, 7]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Might of the Dark/);
      expect(row.type).toBe('Melee AoE');
      expect(row.special).toMatch(/hex/i);
    }
    for (const lvl of [2, 5, 8]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Life Taken/);
      expect(row.type).toBe('Ranged');
      expect(row.effect).toMatch(/7d8|17d8|27d8/);
    }
    for (const lvl of [3, 6, 9]) {
      const row = byLevel.get(lvl) as any;
      expect(row.name).toMatch(/Vision of the End/);
      expect(row.special).toMatch(/ruin/i);
      expect(row.special).not.toMatch(/soulburn/i);
    }
    expect((byLevel.get(10) as any).name).toBe('True Staff of the Dark');
  });

  it('Life Taken is a spell active', () => {
    const lifeTaken = sysAt(tree, 5).powers.find((p: any) => /Life Taken/.test(p.name));
    expect(lifeTaken).toBeTruthy();
    expect(lifeTaken.tags).toContain('spell');
    expect(lifeTaken.category).toBe('active');
  });

  it('Vision of the End is an Active Spell with Ruin', () => {
    const vision = sysAt(tree, 6).powers.find((p: any) => /Vision of the End/.test(p.name));
    expect(vision).toBeTruthy();
    expect(vision.category).toBe('active');
    expect(vision.tags).toContain('spell');
  });

  it('Might of the Dark is a Melee AoE Hex Spell', () => {
    const might = sysAt(tree, 1).powers.find((p: any) => /Might of the Dark/.test(p.name));
    expect(might).toBeTruthy();
    expect(might.category).toBe('active');
    expect(might.tags).toContain('spell');
    const row = sysAt(tree, 1).levelProgression.find((r: any) => /Might of the Dark/.test(r.name));
    expect(row.type).toBe('Melee AoE');
    expect(row.special).toMatch(/hex/i);
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

  it('uses the Nethrion lantern render and the combined magic alternative image', () => {
    expect(getEchoArtifactIcon('lanternOfTheHollowStar')).toMatch(/Lantern%20of%20Nethrion\.png/);
    expect(tree.nodes[0].itemData.img).toBe(getEchoArtifactIcon('lanternOfTheHollowStar'));
    expect(getEchoArtifactAltIcon('lanternOfTheHollowStar')).toBe(getEchoArtifactAltIcon('staffOfTheDark'));
    for (const node of tree.nodes) {
      expect((node.itemData.system as any).imgAlt).toBe(getEchoArtifactAltIcon('lanternOfTheHollowStar'));
    }
  });

  it('occupies the amulet slot with no Base Values at any level', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('amulet');
    expect(sys.gearSlot).toBe('amulet');
    expect(sys.equipSlots).toEqual(['amulet']);
    for (const node of tree.nodes) {
      expect((node.itemData.system as any).baseValues).toEqual([]);
    }
  });

  it('carries three Resolve Stone Functions: Battery, Pool, Recovery', () => {
    const picks = sysAt(tree, 3).progressionPicks;
    expect(picks.map((p: any) => [p.level, p.kind, p.stoneFunction?.kind, p.displayName])).toEqual([
      [1, 'stoneFunction', 'stoneBattery', 'Stone Battery'],
      [2, 'stoneFunction', 'stonePool', 'Resolve Pool'],
      [3, 'stoneFunction', 'stoneRefresh', 'Recovery'],
    ]);
  });

  it('progression is Battery / Resolve Pool / Recovery — not Glow or Soul Reserve', () => {
    const l3 = sysAt(tree, 3).levelProgression.map((r: any) => r.name);
    expect(l3).toEqual(['Stone Battery I', 'Resolve Pool I', 'Recovery I']);
    const l10 = sysAt(tree, 10).levelProgression.map((r: any) => r.name);
    expect(l10).toEqual(['Stone Battery III', 'Resolve Pool III', 'Recovery III', 'True Hollow Star']);
    expect(l3.join(' ')).not.toMatch(/Glow|Soul Reserve/i);
  });
});

describe("Lor-Keth's Staff", () => {
  const tree = buildEchoArtifactTree(getGeneralArtifact('lorKethsStaff')!);

  it('is a two-handed staff occupying both hands', () => {
    const sys = sysAt(tree, 1);
    expect(sys.slot).toBe('bothHands');
    expect(sys.baseProfile).toBe('twoHandedWeapon');
    expect(sys.artifactKind).toBe('weapon');
    expect(sys.equipSlots).toEqual(['mainhand', 'offhand']);
    expect(sys.artifactWeapon.hands).toBe(2);
  });

  it('staff damage scales 5d8 → 14d8 (4d8 two-handed base + 1d8/level)', () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(baseValue(tree, lvl, 'Staff Damage').value).toBe(`${lvl + 4}d8`);
      expect(sysAt(tree, lvl).artifactWeapon.damage).toBe(`${lvl + 4}d8`);
    }
  });

  it('Storm Rune unlocks at L4 and upgrades at L7 and L10', () => {
    expect(baseValue(tree, 3, 'Storm Rune')).toBeUndefined();
    expect(baseValue(tree, 4, 'Storm Rune').value).toBe('Shock Rune');
    expect(baseValue(tree, 6, 'Storm Rune').value).toBe('Shock Rune');
    expect(baseValue(tree, 7, 'Storm Rune').value).toBe('Greater Shock Rune');
    expect(baseValue(tree, 10, 'Storm Rune').value).toBe('True Shock Rune');
  });

  it('Giant Weight unlocks at L7 and upgrades at L10', () => {
    expect(baseValue(tree, 6, 'Giant Weight')).toBeUndefined();
    expect(baseValue(tree, 7, 'Giant Weight').value).toBe('Giant Weight');
    expect(baseValue(tree, 10, 'Giant Weight').value).toBe('True Giant Weight');
  });

  it('supports the Might Ignore Armor Stone Power from L3 (matching the authored Support row)', () => {
    // L1 = Giant Shock Strike, L2 = Ancestor Guard; the stone support gates at L3.
    expect(sysAt(tree, 1).stoneFunction).toBeNull();
    expect(sysAt(tree, 2).stoneFunction).toBeNull();
    expect(sysAt(tree, 3).stoneFunction).toEqual({
      kind: 'stonePowerSupport',
      attribute: 'might',
      stonePowerId: 'might.ignoreArmor',
    });
  });

  it('uses the authored rulebook progression rows 1:1', () => {
    const def = getGeneralArtifact('lorKethsStaff')!;
    expect(def.levelProgression.map((r) => r.name)).toEqual([
      'Giant Shock Strike I',
      'Ancestor Guard I',
      'Might Ignore Armor Support I',
      'Giant Shock Strike II',
      'Ancestor Guard II',
      'Might Ignore Armor Support II',
      'Giant Shock Strike III',
      'Ancestor Guard III',
      'Might Ignore Armor Support III',
      'Heart of the Storm Ancestors',
    ]);
    expect(sysAt(tree, 10).levelProgression.map((r: any) => r.name)).toEqual([
      'Giant Shock Strike III',
      'Ancestor Guard III',
      'Might Ignore Armor Support III',
      'Heart of the Storm Ancestors',
    ]);
  });
});
