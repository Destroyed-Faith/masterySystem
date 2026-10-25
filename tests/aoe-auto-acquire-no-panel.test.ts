/**
 * AoE UX: no target-selection / Confirm AoE panel.
 * Geometry auto-acquires hostiles; allies always excluded; no Primary Target.
 * Dragon Breath keeps directional Cone placement (aim → place → auto card).
 */
import { describe, expect, it } from 'vitest';
import { buildAllEchoArtifactTrees } from '../src/artifacts/echo-artifact-tree-builder.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import { aoeContextFromAffectedTokenIds } from '../src/combat/attack-executor.js';
import { excludeAlliesFromAoePool } from '../src/combat/aoe-target-filter.js';
import { collectMeleeBurstHostileTokenIds } from '../src/melee-targeting.js';
import {
  breathDamageConeMeters,
  breathRuinConeMeters,
} from '../src/utils/breath-weapon.js';

function flag() {
  return (_ns: string, key: string) => {
    if (key === 'artifactActivated') return true;
    if (key === 'equipment') return { equipped: true, slot: 'head' };
    return undefined;
  };
}

function clawsL3() {
  const tree = buildAllEchoArtifactTrees().find((t) => t.echoArtifactKey === 'dragonClaws')!;
  const node = tree.nodes.find((n) => n.nodeId === 'dragonClaws-l3')!;
  return {
    id: 'claws',
    type: 'artifact',
    name: node.itemData.name,
    system: { ...node.itemData.system, equipped: true, currentLevel: 3 },
    getFlag: flag(),
    flags: { 'mastery-system': { artifactActivated: true } },
  };
}

function headL3() {
  const tree = buildAllEchoArtifactTrees().find((t) => t.echoArtifactKey === 'dragonHead')!;
  const node = tree.nodes.find((n) => n.nodeId === 'dragonHead-l3')!;
  return {
    id: 'head',
    type: 'artifact',
    name: node.itemData.name,
    system: { ...node.itemData.system, equipped: true, currentLevel: 3 },
    getFlag: flag(),
    flags: { 'mastery-system': { artifactActivated: true } },
  };
}

describe('Self-centered Melee AoE — auto acquire, no panel flags', () => {
  it('Tail Sweep / Rending Spiral stay burstMeleeAoE (direct auto path, not utility panel)', () => {
    const opts = buildArtifactRadialOptions({
      items: [clawsL3()],
      system: { mastery: { rank: 4 } },
      getFlag: () => undefined,
    });
    for (const name of [/Rending Spiral/i, /Tail Sweep/i]) {
      const o = opts.find((x) => name.test(x.name));
      expect(o, String(name)).toBeTruthy();
      expect(o!.burstMeleeAoE).toBe(true);
      expect(o!.aoeShape).toBe('radius');
      // Must NOT rely on Confirm AoE / manual selection UI
      expect(o!.allowManualTargetSelection).not.toBe(true);
    }
  });

  it('ally exclusion helper never keeps player-side tokens', () => {
    const attacker = {
      id: 'atk',
      actor: { id: 'a1', type: 'character' },
      document: { disposition: 1 },
    };
    const allyPc = {
      id: 'ally',
      actor: { id: 'a2', type: 'character' },
      document: { disposition: 1 },
    };
    const foe = {
      id: 'foe',
      actor: { id: 'e1', type: 'npc' },
      document: { disposition: -1 },
    };
    const resolve = (id: string) => ({ ally: allyPc, foe, atk: attacker } as any)[id === 'ally' ? 'ally' : id === 'foe' ? 'foe' : 'atk'];
    // Map ids for filter
    const map: Record<string, any> = { ally: allyPc, foe };
    const out = excludeAlliesFromAoePool(attacker, ['ally', 'foe'], (id) => map[id]);
    expect(out).toEqual(['foe']);
  });
});

describe('Dragon Breath Cone — keep aim geometry, no selection panel', () => {
  it('Damage + Ruin are Cone Instant AoE with catalogue lengths', () => {
    const opts = buildArtifactRadialOptions({
      items: [headL3()],
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
  });
});

describe('Attack Card context — no Primary Target', () => {
  it('flat affected set builds equal-participant AoE context', () => {
    const built = aoeContextFromAffectedTokenIds(['e1', 'e2', 'e3'], 4);
    expect(built?.carrierTokenId).toBe('e1');
    expect(built?.aoe.secondaryTokenIds).toEqual(['e2', 'e3']);
    expect(built?.aoe.powerBonusDice).toBe(4);
  });
});

describe('collectMeleeBurstHostileTokenIds is exported for auto Melee AoE', () => {
  it('is a function used by the radial combat selector', () => {
    expect(typeof collectMeleeBurstHostileTokenIds).toBe('function');
  });
});

describe('Attack AoE paths never open the utility target panel', () => {
  it('token-action-selector auto-acquires Melee burst and routes Cone without panel', async () => {
    const { readFileSync } = await import('node:fs');
    const sel = readFileSync(new URL('../src/token-action-selector.ts', import.meta.url), 'utf8');
    expect(sel).toMatch(/MELEE_AOE_AUTO|collectMeleeBurstHostileTokenIds/);
    expect(sel).toMatch(/startConeAttackMode/);
    expect(sel).not.toMatch(/mastery-utility-target-panel/);
    expect(sel).not.toMatch(/promptMeleeAoePrimaryChoice/);
  });

  it('utility-targeting finalizes Instant attack AoE without createTargetSelectionPanel', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/utility-targeting.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/function finalizeAttackAoeWithoutPanel/);
    expect(src).toMatch(/function isAttackInstantAoe/);
    expect(src).toMatch(/excludeAlliesFromAoePool/);
    // Panel still exists for heal/utility, but Instant attack AoE must skip it.
    const attackFinalizeBlocks = src.match(
      /if \(isAttackInstantAoe\(state\.option\)\) \{[\s\S]*?finalizeAttackAoeWithoutPanel\(state\);/g,
    );
    expect(attackFinalizeBlocks?.length ?? 0).toBeGreaterThanOrEqual(2);
    // Cone placement calls finalize, not createTargetSelectionPanel
    expect(src).toMatch(
      /\/\/ Keep directional Cone aim\/placement; skip the selection panel entirely\.\s*finalizeAttackAoeWithoutPanel\(state\);/,
    );
  });
});
