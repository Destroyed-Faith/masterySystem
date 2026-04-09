import { describe, expect, it } from 'vitest';
import {
  ARTIFACT_MAX_SYSTEM_LEVEL,
  canArtifactLink,
  canUnlockArtifactUltimate,
  getMaxArtifactSystemLevelForMasteryRank,
  readActorArtifactProgress,
  serializeActorArtifactProgress
} from '../src/utils/artifact-actor-rules.js';

describe('getMaxArtifactSystemLevelForMasteryRank', () => {
  it('caps by MR and at 8', () => {
    expect(getMaxArtifactSystemLevelForMasteryRank(1)).toBe(0);
    expect(getMaxArtifactSystemLevelForMasteryRank(2)).toBe(2);
    expect(getMaxArtifactSystemLevelForMasteryRank(3)).toBe(4);
    expect(getMaxArtifactSystemLevelForMasteryRank(4)).toBe(6);
    expect(getMaxArtifactSystemLevelForMasteryRank(5)).toBe(8);
    expect(getMaxArtifactSystemLevelForMasteryRank(6)).toBe(8);
    expect(getMaxArtifactSystemLevelForMasteryRank(99)).toBe(ARTIFACT_MAX_SYSTEM_LEVEL);
  });
});

describe('canArtifactLink / canUnlockArtifactUltimate', () => {
  it('MR1 cannot link; MR2+ can', () => {
    expect(canArtifactLink(1)).toBe(false);
    expect(canArtifactLink(2)).toBe(true);
  });
  it('ultimate only MR6+', () => {
    expect(canUnlockArtifactUltimate(5)).toBe(false);
    expect(canUnlockArtifactUltimate(6)).toBe(true);
  });
});

describe('readActorArtifactProgress', () => {
  const root = 'node-root';
  it('reads object form', () => {
    expect(readActorArtifactProgress({ nodeId: 'a', linked: true, ultimateUnlocked: true }, root)).toEqual({
      nodeId: 'a',
      linked: true,
      ultimateUnlocked: true
    });
  });
  it('legacy number falls back to root node', () => {
    expect(readActorArtifactProgress(3, root).nodeId).toBe(root);
    expect(readActorArtifactProgress(3, root).linked).toBe(false);
  });
});

describe('serializeActorArtifactProgress', () => {
  it('omits ultimate when false', () => {
    expect(serializeActorArtifactProgress({ nodeId: 'x', linked: true })).toEqual({
      nodeId: 'x',
      linked: true
    });
  });
  it('includes ultimate when true', () => {
    expect(serializeActorArtifactProgress({ nodeId: 'x', linked: true, ultimateUnlocked: true })).toEqual({
      nodeId: 'x',
      linked: true,
      ultimateUnlocked: true
    });
  });
});
