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
        artifacts.map((a, index) => ({
          // Distinct ids: bindings are deduplicated per artifact tree/id.
          id: `artifact-${index}`,
          type: 'artifact',
          // A stone is only bound by an artifact that is actually WORN —
          // unequipped/stale copies must release it (self-healing).
          system: { equipped: true },
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
  it('never reserves a Stone for Attunement (count is always 0)', () => {
    const actor = mockActorWithArtifacts(
      { might: { current: 2, max: 2 } },
      [
        { activated: true, stoneAttr: 'might' },
        { activated: true, stoneAttr: 'agility' },
        { activated: false, stoneAttr: 'might' },
        { activated: true, stoneAttr: undefined },
      ],
    );
    expect(countArtifactActivationStones(actor)).toBe(0);
    expect(countArtifactActivationStones(actor, 'might')).toBe(0);
    expect(countArtifactActivationStones(actor, 'agility')).toBe(0);
  });

  it('effectiveStonePoolAfterBindings subtracts sustained and artifact-bound', () => {
    expect(effectiveStonePoolAfterBindings(3, 1, 1)).toBe(1);
    expect(effectiveStonePoolAfterBindings(2, 0, 3)).toBe(0);
  });

  it('poolSpendableStones ignores leftover activation-stone flags', () => {
    const actor = mockActorWithArtifacts(
      { might: { current: 2, max: 2, sustained: 0 } },
      [{ activated: true, stoneAttr: 'might' }],
    );
    expect(poolSpendableStones(actor, 'might')).toBe(2);
  });
});
