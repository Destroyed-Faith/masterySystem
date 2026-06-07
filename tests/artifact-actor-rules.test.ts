import { describe, expect, it } from 'vitest';
import {
  ARTIFACT_LINK_STONE_COST,
  ARTIFACT_MAX_SYSTEM_LEVEL,
  ARTIFACT_UPGRADE_XP_COST,
  actorStonesCurrent,
  canArtifactLink,
  canSpendArtifactLinkStone,
  getMaxArtifactSystemLevelForMasteryRank,
  isArtifactMechanicallyActive,
  readActorArtifactProgress,
  serializeActorArtifactProgress,
} from '../src/utils/artifact-actor-rules.js';

describe('Artifact constants (new spec)', () => {
  it('activation costs 1 Stone once', () => {
    expect(ARTIFACT_LINK_STONE_COST).toBe(1);
  });

  it('upgrade costs flat 8 XP per +1', () => {
    expect(ARTIFACT_UPGRADE_XP_COST).toBe(8);
  });

  it('hard caps system level at 16 (matches new MR-gated power cap)', () => {
    expect(ARTIFACT_MAX_SYSTEM_LEVEL).toBe(16);
  });
});

describe('getMaxArtifactSystemLevelForMasteryRank', () => {
  it('caps by MR using (MR - 1) × 2, hard-capped at ARTIFACT_MAX_SYSTEM_LEVEL', () => {
    expect(getMaxArtifactSystemLevelForMasteryRank(1)).toBe(0);
    expect(getMaxArtifactSystemLevelForMasteryRank(2)).toBe(2);
    expect(getMaxArtifactSystemLevelForMasteryRank(3)).toBe(4);
    expect(getMaxArtifactSystemLevelForMasteryRank(4)).toBe(6);
    expect(getMaxArtifactSystemLevelForMasteryRank(5)).toBe(8);
    expect(getMaxArtifactSystemLevelForMasteryRank(6)).toBe(10);
    expect(getMaxArtifactSystemLevelForMasteryRank(7)).toBe(12);
    expect(getMaxArtifactSystemLevelForMasteryRank(8)).toBe(14);
    expect(getMaxArtifactSystemLevelForMasteryRank(99)).toBe(ARTIFACT_MAX_SYSTEM_LEVEL);
  });
});

describe('canArtifactLink', () => {
  it('MR1 cannot link; MR2+ can', () => {
    expect(canArtifactLink(1)).toBe(false);
    expect(canArtifactLink(2)).toBe(true);
    expect(canArtifactLink(5)).toBe(true);
    expect(canArtifactLink(8)).toBe(true);
  });
});

describe('readActorArtifactProgress', () => {
  const root = 'node-root';
  it('reads object form (linked + nodeId)', () => {
    expect(readActorArtifactProgress({ nodeId: 'a', linked: true }, root)).toEqual({
      nodeId: 'a',
      linked: true,
    });
  });

  it('ignores the retired ultimateUnlocked flag if present in old data', () => {
    expect(readActorArtifactProgress({ nodeId: 'a', linked: true, ultimateUnlocked: true } as any, root)).toEqual({
      nodeId: 'a',
      linked: true,
    });
  });

  it('legacy number falls back to root node, unlinked', () => {
    const out = readActorArtifactProgress(3, root);
    expect(out.nodeId).toBe(root);
    expect(out.linked).toBe(false);
  });
});

describe('artifact link stone helpers', () => {
  it('canSpendArtifactLinkStone requires at least 1 stone', () => {
    const actor = { system: { stones: { current: 0 } } };
    expect(canSpendArtifactLinkStone(actor)).toBe(false);
    expect(actorStonesCurrent({ system: { stones: { current: 1 } } })).toBe(1);
    expect(canSpendArtifactLinkStone({ system: { stones: { current: 1 } } })).toBe(true);
  });
});

describe('isArtifactMechanicallyActive', () => {
  it('returns false without linked progress (no game.items)', () => {
    const actor = { id: 'a1', items: [] };
    const item = {
      type: 'artifact',
      id: 'emb1',
      system: { binding: 'echo' },
      getFlag: () => 'root1',
    };
    expect(isArtifactMechanicallyActive(actor, item)).toBe(false);
  });
});

describe('serializeActorArtifactProgress', () => {
  it('serializes node + linked', () => {
    expect(serializeActorArtifactProgress({ nodeId: 'x', linked: true })).toEqual({
      nodeId: 'x',
      linked: true,
    });
  });

  it('does not emit the retired ultimateUnlocked field', () => {
    const out = serializeActorArtifactProgress({ nodeId: 'x', linked: true }) as Record<string, unknown>;
    expect(out).not.toHaveProperty('ultimateUnlocked');
  });
});
