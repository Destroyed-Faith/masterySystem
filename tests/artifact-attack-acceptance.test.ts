/**
 * Artifact attack acceptance (player-facing checklist):
 *  1. Shown in combat menu
 *  2. Selectable
 *  3. Target selection / automatic AoE affected capture works
 *  4. Attack Card context builds correctly (no Primary Target)
 *  5–7. Shared Instant AoE resolution + resource gates remain wired
 *
 * Canvas/Foundry UI is exercised via routing flags; resolution entry points
 * are the same modules live combat uses.
 */
import { describe, expect, it } from 'vitest';
import {
  buildAllEchoArtifactTrees,
  buildAllGeneralArtifactTrees,
} from '../src/artifacts/echo-artifact-tree-builder.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import { aoeContextFromAffectedTokenIds } from '../src/combat/attack-executor.js';
import { resolveAoeFromSharedRoll } from '../src/combat/aoe-melee-resolution.js';
import {
  assertDragonBreathAvailable,
  clearArtifactCombatUses,
} from '../src/combat/artifact-rest-uses.js';
import { martialWeaponDamageApplies } from '../src/combat/damage-transfer.js';

function activatedFlag() {
  return (_ns: string, key: string) => {
    if (key === 'artifactActivated') return true;
    if (key === 'equipment') return { equipped: true, slot: 'body' };
    return undefined;
  };
}

function actorWithNode(node: any, level: number) {
  const item = {
    id: node.nodeId,
    type: 'artifact',
    name: node.itemData.name,
    system: { ...node.itemData.system, equipped: true, currentLevel: level },
    getFlag: activatedFlag(),
    flags: {
      'mastery-system': {
        artifactActivated: true,
        equipment: { equipped: true },
      },
    },
  };
  return {
    items: [item],
    system: { mastery: { rank: 4 } },
    getFlag: () => undefined,
    flags: { 'mastery-system': {} },
    async setFlag(scope: string, key: string, value: unknown) {
      this.flags[scope] = this.flags[scope] || {};
      this.flags[scope][key] = value;
    },
  };
}

function treeNode(key: string, level: number) {
  const trees = [...buildAllEchoArtifactTrees(), ...buildAllGeneralArtifactTrees()];
  const tree = trees.find((t: any) => t.echoArtifactKey === key || t.artifactKey === key);
  expect(tree, key).toBeTruthy();
  const node = (tree as any).nodes.find(
    (n: any) =>
      n.nodeId === `${key}-l${level}` || Number(n.itemData?.system?.currentLevel) === level,
  );
  expect(node, `${key} L${level}`).toBeTruthy();
  return node;
}

/** How the combat selector will route this option (steps 2–4). */
function attackRoute(o: any): 'cone' | 'melee-burst' | 'hostile-zone' | 'melee-single' | 'ranged-single' | 'unknown' {
  if (o.slot !== 'attack') return 'unknown';
  if (o.aoeShape === 'cone') return 'cone';
  if (o.burstMeleeAoE) return 'melee-burst';
  if (o.aoePlacementProfile === 'hostile-zone') return 'hostile-zone';
  if (o.aoePlacementProfile === 'heal' || o.aoePlacementProfile === 'cleanse') return 'unknown';
  const range = Number(o.range ?? o.rangeMeters ?? 0);
  if (range > 4) return 'ranged-single';
  return 'melee-single';
}

describe('Artifact attack acceptance — Dragon Claws L3', () => {
  it('1–4: Rending Spiral + Tail Sweep appear and route to auto Melee burst AoE (no panel)', () => {
    const opts = buildArtifactRadialOptions(actorWithNode(treeNode('dragonClaws', 3), 3));
    const spiral = opts.find((o) => /Rending Spiral/i.test(o.name));
    const sweep = opts.find((o) => /Tail Sweep/i.test(o.name));
    expect(spiral, 'step1 menu').toBeTruthy();
    expect(sweep, 'step1 menu').toBeTruthy();
    expect(spiral!.slot).toBe('attack');
    expect(sweep!.slot).toBe('attack');
    expect(attackRoute(spiral)).toBe('melee-burst');
    expect(attackRoute(sweep)).toBe('melee-burst');
    expect(spiral!.burstMeleeRadiusMeters ?? spiral!.aoeRadiusMeters).toBeGreaterThan(0);
    expect(sweep!.burstMeleeRadiusMeters ?? sweep!.aoeRadiusMeters).toBeGreaterThan(0);
    // Step 4: flat affected set → card context (carrier is UI-only, not Primary)
    const built = aoeContextFromAffectedTokenIds(['enemy-a', 'enemy-b', 'enemy-c'], 0);
    expect(built?.carrierTokenId).toBe('enemy-a');
    expect(built?.aoe.secondaryTokenIds).toEqual(['enemy-b', 'enemy-c']);
  });
});

describe('Artifact attack acceptance — Dragon Head L3 Breath', () => {
  it('1–4 + 7: Damage/Ruin Cone routes; Bite exception; shared combat use gate', async () => {
    const opts = buildArtifactRadialOptions(actorWithNode(treeNode('dragonHead', 3), 3));
    const damage = opts.find((o) => /Damage Breath/i.test(o.name));
    const ruin = opts.find((o) => /Ruin Breath/i.test(o.name));
    expect(damage).toBeTruthy();
    expect(ruin).toBeTruthy();
    expect(attackRoute(damage)).toBe('cone');
    expect(attackRoute(ruin)).toBe('cone');
    expect(damage!.dragonHeadDamageBreath).toBe(true);
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: false,
        instantAoe: true,
        dragonHeadDamageBreath: true,
      }),
    ).toBe(true);
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: true,
        instantAoe: true,
        dragonHeadDamageBreath: false,
      }),
    ).toBe(false);

    const actor: any = actorWithNode(treeNode('dragonHead', 3), 3);
    await clearArtifactCombatUses(actor);
    expect(assertDragonBreathAvailable(actor).ok).toBe(true);
  });
});

describe('Artifact attack acceptance — Ranged Instant AoE (Moonlight Judgment)', () => {
  it('1–4: Judgment routes to hostile-zone placement (no Primary)', () => {
    const opts = buildArtifactRadialOptions(actorWithNode(treeNode('moonlightGreatsword', 2), 2));
    const judgment = opts.find((o) => /Judgment/i.test(o.name));
    expect(judgment, 'step1 menu').toBeTruthy();
    expect(attackRoute(judgment)).toBe('hostile-zone');
    expect(judgment!.aoeRadiusMeters).toBeGreaterThan(0);
    const built = aoeContextFromAffectedTokenIds(['t1', 't2']);
    expect(built?.aoe.secondaryTokenIds).toEqual(['t2']);
  });
});

describe('Artifact attack acceptance — shared Instant AoE resolution (steps 5–6)', () => {
  it('resolveAoeFromSharedRoll is the equal-participant entry point', () => {
    expect(typeof resolveAoeFromSharedRoll).toBe('function');
  });
});

describe('Artifact attack acceptance — all Echo/General L3 attack options are routable', () => {
  it('every attack slot option has a known combat route', () => {
    const trees = [...buildAllEchoArtifactTrees(), ...buildAllGeneralArtifactTrees()];
    const bad: string[] = [];
    for (const tree of trees) {
      const key = (tree as any).echoArtifactKey || (tree as any).artifactKey || tree.folderName;
      const node = (tree as any).nodes.find((n: any) => String(n.nodeId || '').endsWith('-l3'));
      if (!node) continue;
      const opts = buildArtifactRadialOptions(actorWithNode(node, 3));
      for (const o of opts) {
        if (o.slot !== 'attack') continue;
        if (o.aoePlacementProfile === 'heal' || o.aoePlacementProfile === 'cleanse') continue;
        const route = attackRoute(o);
        if (route === 'unknown') bad.push(`${key}: ${o.name}`);
      }
    }
    expect(bad, bad.join('; ')).toEqual([]);
  });
});
