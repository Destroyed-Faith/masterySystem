import { describe, expect, it } from 'vitest';
import {
  countArtifactActivationStones,
  effectiveStonePoolAfterBindings,
} from '../src/utils/artifact-stone-bound.js';
import { poolSpendableStones } from '../src/utils/artifact-actor-rules.js';

function mockActorWithArtifacts(
  pools: Record<string, { current: number; max: number; sustained?: number }>,
  artifacts: Array<{ activated: boolean; stoneAttr?: string }>,
) {
  return {
    system: { stonePools: pools },
    items: {
      filter: (fn: (i: any) => boolean) =>
        artifacts.map((a) => ({
          type: 'artifact',
          getFlag: (_ns: string, key: string) => {
            if (key === 'artifactActivated') return a.activated;
            if (key === 'artifactActivationStoneAttr') return a.stoneAttr;
            return undefined;
          },
        })).filter(fn),
    },
  };
}

describe('artifact-stone-bound', () => {
  it('counts activated artifacts with a stone attribute', () => {
    const actor = mockActorWithArtifacts(
      { might: { current: 2, max: 2 } },
      [
        { activated: true, stoneAttr: 'might' },
        { activated: true, stoneAttr: 'agility' },
        { activated: false, stoneAttr: 'might' },
        { activated: true, stoneAttr: undefined },
      ],
    );
    expect(countArtifactActivationStones(actor)).toBe(2);
    expect(countArtifactActivationStones(actor, 'might')).toBe(1);
    expect(countArtifactActivationStones(actor, 'agility')).toBe(1);
  });

  it('effectiveStonePoolAfterBindings subtracts sustained and artifact-bound', () => {
    expect(effectiveStonePoolAfterBindings(3, 1, 1)).toBe(1);
    expect(effectiveStonePoolAfterBindings(2, 0, 3)).toBe(0);
  });

  it('poolSpendableStones excludes artifact-bound stones from distribution', () => {
    const actor = mockActorWithArtifacts(
      { might: { current: 2, max: 2, sustained: 0 } },
      [{ activated: true, stoneAttr: 'might' }],
    );
    expect(poolSpendableStones(actor, 'might')).toBe(1);
  });
});
