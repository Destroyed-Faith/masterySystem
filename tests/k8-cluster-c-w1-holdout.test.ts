/**
 * K8.c / W1 — Titan Growth name path must win until catalog-divergence is resolved.
 * R1: pack/builder titan-growth rows stay Transformation utility (combat radial).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { clearIdentityShadowLog } from '../src/utils/identity-shadow.js';
import { isUltimateProgressionRow } from '../src/utils/artifact-visible-abilities.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';

describe('K8.c W1 Titan Growth holdout', () => {
  beforeEach(() => clearIdentityShadowLog());

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

  it('R1: titan-growth identity surfaces as utility Transformation (not Prep Active Buff)', () => {
    const flags: Record<string, unknown> = {
      echoArtifactKey: 'titanScars',
      artifactActivated: true,
      echoBound: 'giants',
    };
    const item = {
      id: 'ts1',
      type: 'artifact',
      name: 'Titan Scars L1',
      getFlag: (_ns: string, k: string) => flags[k],
      flags: { 'mastery-system': flags },
      system: {
        level: 1,
        currentLevel: 1,
        equipped: true,
        binding: 'echo',
        levelProgression: [
          {
            level: 1,
            name: 'Titan Growth I',
            type: 'Transformation',
            artifactFunctionId: 'titan-growth',
          },
        ],
      },
    };
    const opts = buildArtifactRadialOptions({ items: [item] }) as any[];
    const growth = opts.find((o) => o.artifactFunctionId === 'titan-growth');
    expect(growth).toBeTruthy();
    expect(growth.powerType).toBe('utility');
    expect(growth.costsAction).toBe(true);
    expect(getSegmentIdForOption(growth)).toBe('utility');
  });
});
