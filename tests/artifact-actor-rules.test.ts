import { describe, expect, it } from 'vitest';
import {
  ARTIFACT_LINK_STONE_COST,
  ARTIFACT_MAX_SYSTEM_LEVEL,
  ARTIFACT_UPGRADE_XP_COST,
  actorStonesCurrent,
  artifactPowersUnlocked,
  canArtifactLink,
  canSpendArtifactLinkStone,
  canSpendArtifactLinkStoneFromPool,
  listArtifactSpendableStonePools,
  poolSpendableStones,
  artifactExceedsMasteryRankCap,
  getMaxArtifactSystemLevelForMasteryRank,
  getMaxArtifactSpecLevelForMasteryRank,
  getArtifactBindingKind,
  isArtifactLinkedOnActor,
  isArtifactMechanicallyActive,
  readActorArtifactProgress,
  serializeActorArtifactProgress,
} from '../src/utils/artifact-actor-rules.js';

describe('Artifact constants (new spec)', () => {
  it('activation is free (Artefacts.md — no 1-Stone link)', () => {
    expect(ARTIFACT_LINK_STONE_COST).toBe(0);
  });

  it('upgrade costs flat 8 XP per +1', () => {
    expect(ARTIFACT_UPGRADE_XP_COST).toBe(8);
  });

  it('hard caps system level at 10', () => {
    expect(ARTIFACT_MAX_SYSTEM_LEVEL).toBe(10);
  });
});

describe('getMaxArtifactSystemLevelForMasteryRank', () => {
  it('enforces the MR Artifact Level Gate at every breakpoint', () => {
    expect(getMaxArtifactSystemLevelForMasteryRank(1)).toBe(1);
    expect(getMaxArtifactSystemLevelForMasteryRank(2)).toBe(2);
    expect(getMaxArtifactSystemLevelForMasteryRank(3)).toBe(4);
    expect(getMaxArtifactSystemLevelForMasteryRank(4)).toBe(6);
    expect(getMaxArtifactSystemLevelForMasteryRank(5)).toBe(8);
    expect(getMaxArtifactSystemLevelForMasteryRank(6)).toBe(10);
    expect(getMaxArtifactSystemLevelForMasteryRank(7)).toBe(10);
    expect(getMaxArtifactSystemLevelForMasteryRank(99)).toBe(ARTIFACT_MAX_SYSTEM_LEVEL);
  });

  it('matches min(10, max(1, (MR − 1) × 2))', () => {
    for (let mr = 1; mr <= 12; mr++) {
      expect(getMaxArtifactSystemLevelForMasteryRank(mr)).toBe(
        Math.min(10, Math.max(1, (mr - 1) * 2)),
      );
      expect(getMaxArtifactSpecLevelForMasteryRank(mr)).toBe(
        getMaxArtifactSystemLevelForMasteryRank(mr),
      );
    }
  });

  it('flags over-cap legacy levels without implying a silent reduce', () => {
    expect(artifactExceedsMasteryRankCap(1, 1)).toBe(false);
    expect(artifactExceedsMasteryRankCap(2, 1)).toBe(true);
    expect(artifactExceedsMasteryRankCap(4, 3)).toBe(false);
    expect(artifactExceedsMasteryRankCap(5, 3)).toBe(true);
    expect(artifactExceedsMasteryRankCap(10, 6)).toBe(false);
    expect(artifactExceedsMasteryRankCap(10, 5)).toBe(true);
  });
});

describe('canArtifactLink', () => {
  it('every MR can activate (no rulebook gate)', () => {
    expect(canArtifactLink(1)).toBe(true);
    expect(canArtifactLink(2)).toBe(true);
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
  it('activation never requires Stones (free per Artefacts.md)', () => {
    expect(canSpendArtifactLinkStone({ system: { stones: { current: 0 } } })).toBe(true);
    expect(canSpendArtifactLinkStoneFromPool({ system: { stonePools: {} } }, 'might')).toBe(true);
  });

  it('sums spendable stones from stonePools (current − sustained)', () => {
    const actor = {
      system: {
        stonePools: {
          might: { current: 2, max: 2, sustained: 1 },
          agility: { current: 1, max: 1, sustained: 0 },
          vitality: { current: 0, max: 0, sustained: 0 },
        },
      },
    };
    expect(actorStonesCurrent(actor)).toBe(2);
    const pools = listArtifactSpendableStonePools(actor);
    expect(pools.map((p) => p.key)).toEqual(['might', 'agility']);
  });

  it('legacy activation-stone flags do not reserve spendable stones', () => {
    const actor = mockActorWithArtifacts(
      { might: { current: 2, max: 2, sustained: 0 } },
      [{ activated: true, stoneAttr: 'might' }],
    );
    expect(poolSpendableStones(actor, 'might')).toBe(2);
    expect(actorStonesCurrent(actor)).toBe(2);

    const leftover = mockActorWithArtifacts(
      { might: { current: 1, max: 1, sustained: 0 } },
      [{ activated: true, stoneAttr: 'might' }],
    );
    expect(poolSpendableStones(leftover, 'might')).toBe(1);
  });
});

function mockActorWithArtifacts(
  pools: Record<string, { current: number; max: number; sustained?: number }>,
  artifacts: Array<{ activated: boolean; stoneAttr?: string }>,
) {
  return {
    system: { stonePools: pools },
    items: {
      filter: (fn: (i: any) => boolean) =>
        artifacts
          .map((a, index) => ({
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
          }))
          .filter(fn),
    },
  };
}

describe('isArtifactLinkedOnActor (echo)', () => {
  it('explicit artifactActivated false is the player opt-out', () => {
    const actor = { id: 'a1' };
    const echoItem = {
      type: 'artifact',
      system: { binding: 'echo' },
      getFlag: (_ns: string, key: string) => {
        if (key === 'echoBound') return 'dragonborn';
        if (key === 'artifactActivated') return false;
        return undefined;
      },
    };
    expect(getArtifactBindingKind(echoItem)).toBe('echo');
    expect(isArtifactLinkedOnActor(actor, echoItem)).toBe(false);

    const activeEcho = {
      ...echoItem,
      getFlag: (_ns: string, key: string) => (key === 'artifactActivated' ? true : echoItem.getFlag(_ns, key)),
    };
    expect(isArtifactLinkedOnActor(actor, activeEcho)).toBe(true);
  });

  it('echo items with no activation flag default to active', () => {
    const actor = { id: 'a1' };
    const echoItem = {
      type: 'artifact',
      system: { binding: 'echo' },
      getFlag: (_ns: string, key: string) => (key === 'echoBound' ? 'dragonborn' : undefined),
    };
    expect(isArtifactLinkedOnActor(actor, echoItem)).toBe(true);
  });
});

describe('isArtifactMechanicallyActive', () => {
  it('returns false without linked progress (no game.items)', () => {
    const actor = { id: 'a1', items: [] };
    const item = {
      type: 'artifact',
      id: 'emb1',
      system: { binding: 'echo' },
      getFlag: (_ns: string, key: string) => {
        if (key === 'artifactActivated') return false;
        if (key === 'echoBound') return true;
        return undefined;
      },
    };
    expect(isArtifactMechanicallyActive(actor, item)).toBe(false);
  });
});

describe('artifactPowersUnlocked', () => {
  const actor = { id: 'a1' };
  const makeArtifact = (flags: Record<string, unknown>) => ({
    type: 'artifact',
    system: {},
    getFlag: (_ns: string, key: string) => flags[key],
  });

  it('explicit artifactActivated flag wins', () => {
    expect(artifactPowersUnlocked(actor, makeArtifact({ artifactActivated: true }))).toBe(true);
    expect(artifactPowersUnlocked(actor, makeArtifact({ artifactActivated: false }))).toBe(false);
  });

  it('inactive wired artifact grants no powers (no game.items → unlinked)', () => {
    expect(
      artifactPowersUnlocked(actor, makeArtifact({ evolutionRootItemId: 'root-1' })),
    ).toBe(false);
  });

  it('ad-hoc artifact without activation tracking stays enabled', () => {
    expect(artifactPowersUnlocked(actor, makeArtifact({}))).toBe(true);
  });

  it('non-artifact items are never power sources', () => {
    expect(artifactPowersUnlocked(actor, { type: 'weapon', getFlag: () => true })).toBe(false);
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
