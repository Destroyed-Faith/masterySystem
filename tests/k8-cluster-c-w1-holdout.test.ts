/**
 * K8.c / W1 — Titan Growth name path must win until catalog-divergence is resolved.
 */
import { describe, expect, it } from 'vitest';
import { isUltimateProgressionRow } from '../src/utils/artifact-visible-abilities.js';

describe('K8.c W1 Titan Growth holdout', () => {
  it('awakening uses artifactFunctionId when present', () => {
    expect(
      isUltimateProgressionRow({
        level: 10,
        name: 'Something Else',
        type: 'Active',
        artifactFunctionId: 'artifact-awakening',
      } as any),
    ).toBe(true);
  });

  it('legacy ultimate name bridge still works without function id', () => {
    expect(
      isUltimateProgressionRow({
        level: 10,
        name: 'Artifact Awakening',
        type: 'Ultimate',
      } as any),
    ).toBe(true);
  });
});
