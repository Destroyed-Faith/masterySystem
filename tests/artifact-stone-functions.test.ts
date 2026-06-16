import { describe, expect, it } from 'vitest';
import {
  getArtifactStoneFunctions,
  getArtifactStoneSupportPrefill,
  getArtifactStoneBatteryCapacityByAttribute,
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

    // At level 3 both Stone Functions are unlocked: the Resolve Stone Battery
    // (L2) and the Resolve Healing Support (L3).
    const actorL3 = actorWith(activeItemFromNode(tree.nodes[2], 'Sentinel Frame'));
    const records = getArtifactStoneFunctions(actorL3);
    expect(records).toHaveLength(2);

    const battery = records.find((r) => r.kind === 'stoneBattery');
    const support = records.find((r) => r.kind === 'stonePowerSupport');
    expect(battery?.attribute).toBe('resolve');
    expect(support?.stonePowerId).toBe('resolve.healing');

    // The Healing Support pre-fills Tier 2 at level 3.
    expect(getArtifactStoneSupportPrefill(actorL3, 'resolve.healing', 'resolve')).toBe(2);
    // The Resolve battery contributes capacity.
    expect(getArtifactStoneBatteryCapacityByAttribute(actorL3).resolve).toBeGreaterThan(0);
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

  it('Titan Scars gift Might Stones via a Might Stone Pool (2/4/8 per stage)', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('titanScars')!);
    // Below L2 the pool is not yet unlocked.
    expect(getArtifactStonePoolExtraByAttribute(actorWith(activeItemFromNode(tree.nodes[0], 'Titan Scars'))).might || 0).toBe(0);
    // L2 → 2, L5 → 4, L8 → 8 Might Stones.
    expect(getArtifactStonePoolExtraByAttribute(actorWith(activeItemFromNode(tree.nodes[1], 'Titan Scars'))).might).toBe(2);
    expect(getArtifactStonePoolExtraByAttribute(actorWith(activeItemFromNode(tree.nodes[4], 'Titan Scars'))).might).toBe(4);
    expect(getArtifactStonePoolExtraByAttribute(actorWith(activeItemFromNode(tree.nodes[7], 'Titan Scars'))).might).toBe(8);
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
});
