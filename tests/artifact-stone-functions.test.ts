import { describe, expect, it } from 'vitest';
import {
  getArtifactStoneFunctions,
  getArtifactStoneSupportPrefill,
  getArtifactStonePoolExtraByAttribute,
} from '../src/utils/artifact-stone-functions.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { getEchoArtifact } from '../src/utils/echo-artifacts.js';

/**
 * Build a minimal mechanically-active artifact item from a seeded tree node.
 * `binding: 'echo'` + `artifactActivated` flag makes it count as active.
 */
function activeItemFromNode(node: any, name: string) {
  const system = { ...(node.itemData.system as any), binding: 'echo' };
  return {
    id: `${name}-item`,
    name,
    type: 'artifact',
    system,
    getFlag: (scope: string, key: string) =>
      scope === 'mastery-system' && key === 'artifactActivated' ? true : undefined,
  };
}

function actorWith(item: any) {
  return { id: 'actor-1', items: [item] };
}

describe('Artifact Stone Function aggregator — multiple functions per artifact', () => {
  it('reads both Stone Functions from a Sentinel Frame (level-gated)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('sentinelFrame')!);

    // At level 1 only the L1 ability (a catalog heal, not a Stone Function) is
    // unlocked → no stone functions are active yet.
    const actorL1 = actorWith(activeItemFromNode(tree.nodes[0], 'Sentinel Frame'));
    expect(getArtifactStoneFunctions(actorL1)).toHaveLength(0);

    // At level 3 both pick Stone Functions are unlocked: the Resolve Stone Pool
    // (L2) and the Resolve Healing Support (L3).
    const actorL3 = actorWith(activeItemFromNode(tree.nodes[2], 'Sentinel Frame'));
    const records = getArtifactStoneFunctions(actorL3);
    expect(records).toHaveLength(2);

    const pool = records.find((r) => r.kind === 'stonePool');
    const support = records.find((r) => r.kind === 'stonePowerSupport');
    expect(pool?.attribute).toBe('resolve');
    expect(support?.stonePowerId).toBe('resolve.healing');

    // The Healing Support pre-fills Tier 2 at level 3.
    expect(getArtifactStoneSupportPrefill(actorL3, 'resolve.healing', 'resolve')).toBe(2);
    expect(getArtifactStonePoolExtraByAttribute(actorL3).resolve).toBeGreaterThan(0);
  });

  it('Sentinel Frame unlocks Special Reduction Support from Artifact Level 5', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('sentinelFrame')!);
    const actorL4 = actorWith(activeItemFromNode(tree.nodes[3], 'Sentinel Frame'));
    expect(getArtifactStoneSupportPrefill(actorL4, 'resolve.ward', 'resolve')).toBe(0);

    const actorL5 = actorWith(activeItemFromNode(tree.nodes[4], 'Sentinel Frame'));
    expect(getArtifactStoneSupportPrefill(actorL5, 'resolve.ward', 'resolve')).toBe(3);

    const actorL9 = actorWith(activeItemFromNode(tree.nodes[8], 'Sentinel Frame'));
    expect(getArtifactStoneSupportPrefill(actorL9, 'resolve.ward', 'resolve')).toBe(4);
  });

  it('Judicator carries both the Wits Stone Pool and the Influence Regeneration Support', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('judicatorFrame')!);
    const actor = actorWith(activeItemFromNode(tree.nodes[5], 'Judicator Frame')); // level 6
    const records = getArtifactStoneFunctions(actor);

    const pool = records.find((r) => r.kind === 'stonePool');
    const support = records.find((r) => r.kind === 'stonePowerSupport');
    expect(pool?.attribute).toBe('wits');
    expect(support?.stonePowerId).toBe('influence.regeneration');
    // Regeneration support pre-fills Tier 3 at level 6.
    expect(getArtifactStoneSupportPrefill(actor, 'influence.regeneration', 'influence')).toBe(3);
  });

  it('Titan Scars supports Might Melee Damage and Vitality Remove Scar', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    const actorL1 = actorWith(activeItemFromNode(tree.nodes[0], 'Titan Scars'));
    expect(getArtifactStoneSupportPrefill(actorL1, 'might.meleeDamage', 'might')).toBe(0);
    expect(getArtifactStoneSupportPrefill(actorL1, 'vitality.removeScar', 'vitality')).toBe(0);

    const actorL2 = actorWith(activeItemFromNode(tree.nodes[1], 'Titan Scars'));
    expect(getArtifactStoneSupportPrefill(actorL2, 'might.meleeDamage', 'might')).toBe(2);

    const actorL3 = actorWith(activeItemFromNode(tree.nodes[2], 'Titan Scars'));
    expect(getArtifactStoneSupportPrefill(actorL3, 'vitality.removeScar', 'vitality')).toBe(2);
  });

  it('falls back to the single legacy sys.stoneFunction when there are no picks', () => {
    const item = {
      id: 'legacy',
      name: 'Legacy Artifact',
      type: 'artifact',
      system: {
        binding: 'echo',
        currentLevel: 5,
        stoneFunction: { kind: 'stonePool', attribute: 'might' },
        progressionPicks: [],
      },
      getFlag: (scope: string, key: string) =>
        scope === 'mastery-system' && key === 'artifactActivated' ? true : undefined,
    };
    const records = getArtifactStoneFunctions(actorWith(item));
    expect(records).toHaveLength(1);
    expect(records[0].kind).toBe('stonePool');
    expect(records[0].attribute).toBe('might');
  });

  it('Elorian Focus prefills Crit above T2 so the first published box stays player-paid', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('elorianStride')!);
    const actorL3 = actorWith(activeItemFromNode(tree.nodes[2], 'Elorian Stride'));
    expect(getArtifactStoneSupportPrefill(actorL3, 'agility.crit', 'agility')).toBe(3);

    const actorL7 = actorWith(activeItemFromNode(tree.nodes[6], 'Elorian Stride'));
    expect(getArtifactStoneSupportPrefill(actorL7, 'agility.crit', 'agility')).toBe(4);
  });
});
