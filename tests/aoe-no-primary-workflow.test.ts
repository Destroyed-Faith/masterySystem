/**
 * Instant AoE workflow: no Primary Target — flat affected sets for
 * Dragon Breath (Cone), self-centered Melee AoE, and Ranged AoE.
 */
import { describe, expect, it } from 'vitest';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import {
  aoeContextFromAffectedTokenIds,
} from '../src/combat/attack-executor.js';
import { resolveAoeFromSharedRoll } from '../src/combat/aoe-melee-resolution.js';
import {
  breathDamageConeMeters,
  breathRuinConeMeters,
  breathWeaponRowDisplay,
  damageBreathSharedPoolFormula,
} from '../src/utils/breath-weapon.js';
import { buildAllEchoArtifactTrees } from '../src/artifacts/echo-artifact-tree-builder.js';

function flag(data: Record<string, unknown> = {}) {
  return (_ns: string, key: string) => {
    if (key === 'artifactActivated') return true;
    if (key === 'equipment') return { equipped: true, slot: 'head' };
    return data[key];
  };
}

describe('aoeContextFromAffectedTokenIds — no Primary Target', () => {
  it('splits a flat affected list into UI carrier + equal peers', () => {
    const built = aoeContextFromAffectedTokenIds(['a', 'b', 'c'], 4);
    expect(built).toEqual({
      carrierTokenId: 'a',
      aoe: { secondaryTokenIds: ['b', 'c'], powerBonusDice: 4 },
    });
  });

  it('returns null for an empty affected set', () => {
    expect(aoeContextFromAffectedTokenIds([])).toBeNull();
  });

  it('single affected creature has empty peer list (still not a Primary)', () => {
    const built = aoeContextFromAffectedTokenIds(['only']);
    expect(built?.carrierTokenId).toBe('only');
    expect(built?.aoe.secondaryTokenIds).toEqual([]);
  });
});

describe('Dragon Breath L3 — Cone specialty, Instant AoE flags', () => {
  it('exposes Damage + Ruin as Cone Melee Instant AoE (not self-burst)', async () => {
    const tree = buildAllEchoArtifactTrees().find((t) => t.echoArtifactKey === 'dragonHead');
    const node = tree!.nodes.find((n) => n.nodeId === 'dragonHead-l3')!;
    const head: any = {
      id: 'IqH2PUiBdJzevU5Q',
      type: 'artifact',
      name: node.itemData.name,
      system: { ...node.itemData.system, equipped: true, currentLevel: 3 },
      getFlag: flag({ echoArtifactKey: 'dragonHead' }),
      flags: {
        'mastery-system': {
          artifactActivated: true,
          equipment: { equipped: true, slot: 'head' },
        },
      },
    };
    const opts = buildArtifactRadialOptions({
      items: [head],
      system: { mastery: { rank: 3 } },
      getFlag: () => undefined,
    });
    const damage = opts.find((o) => /Damage Breath/i.test(o.name));
    const ruin = opts.find((o) => /Ruin Breath/i.test(o.name));
    expect(damage?.aoeShape).toBe('cone');
    expect(ruin?.aoeShape).toBe('cone');
    expect(damage?.burstMeleeAoE).toBeFalsy();
    expect(ruin?.burstMeleeAoE).toBeFalsy();
    expect(damage?.aoeRadiusMeters).toBe(breathDamageConeMeters(3));
    expect(ruin?.aoeRadiusMeters).toBe(breathRuinConeMeters(3));
    expect(damage?.dragonHeadDamageBreath).toBe(true);
    expect(ruin?.dragonHeadBreathMode).toBe('ruin');
    expect(damageBreathSharedPoolFormula(3)).toBe('3d8+4d8');
    expect(breathWeaponRowDisplay(3).aoe).toMatch(/Cone 3 m/);
  });
});

describe('resolveAoeFromSharedRoll treats every token equally', () => {
  it('exports the shared-roll entry point used by Breath / Melee / Ranged AoE', () => {
    expect(typeof resolveAoeFromSharedRoll).toBe('function');
  });
});

describe('Catalogue Melee / Ranged AoE Instant rules (no Primary)', () => {
  it('self-centered Melee AoE Attack template is Instant (aoe.center self)', async () => {
    const { getTemplate } = await import('../src/utils/powers/templates/index.js');
    const melee = getTemplate('active-melee-weapon-aoe');
    expect(melee?.levels?.['4']?.aoe?.center).toBe('self');
    expect(String(melee?.levels?.['4']?.effect?.dice || '')).toMatch(/4d8/);
  });

  it('Ranged AoE Attack places at targetPoint (not a Primary Target)', async () => {
    const { getTemplate } = await import('../src/utils/powers/templates/index.js');
    const ranged = getTemplate('active-ranged-weapon-aoe');
    expect(ranged?.levels?.['4']?.aoe?.center).toBe('targetPoint');
    expect(ranged?.levels?.['4']?.aoe?.radiusM).toBe(3);
  });
});
