import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  diagnoseArtifactEvolution,
  listOrphanArtifactHistorySpends,
  normalizeArtifactSystemLevel,
  planOrphanArtifactRefundXp,
  resolveEffectiveArtifactLevel,
  syncEmbeddedArtifactFromWorldNodeNormalized,
  deleteArtifactWithXpRefund,
  refundOrphanArtifactSpends,
} from '../src/utils/artifact-evolution-repair.js';
import { artifactLevelXpCost, totalArtifactXpToLevel } from '../src/utils/constants.js';
import { planHistoryRefund, canRefundHistoryRow } from '../src/utils/xp-history-refund.js';

function makeWorldNode(opts: {
  id: string;
  nodeId: string;
  level: number;
  name?: string;
  childIds?: string[];
  folderId?: string;
}) {
  const folderId = opts.folderId || 'folder1';
  return {
    id: opts.id,
    type: 'artifact',
    name: opts.name || `Artifact - Level ${opts.level}`,
    img: 'icons/svg/item-bag.svg',
    folder: { id: folderId },
    system: { level: opts.level, currentLevel: opts.level, baseValues: [], levelProgression: [] },
    getFlag: (scope: string, key: string) => {
      if (scope !== 'mastery-system') return undefined;
      if (key === 'nodeId') return opts.nodeId;
      if (key === 'childIds') return opts.childIds || [];
      return undefined;
    },
  };
}

describe('normalizeArtifactSystemLevel', () => {
  it('forces level and currentLevel to the world node level', () => {
    const sys = normalizeArtifactSystemLevel({ level: 1, currentLevel: 1, slot: 'weapon' }, 2);
    expect(sys.level).toBe(2);
    expect(sys.currentLevel).toBe(2);
    expect(sys.slot).toBe('weapon');
  });
});

describe('diagnose + sync desync', () => {
  beforeEach(() => {
    const l1 = makeWorldNode({ id: 'w1', nodeId: 'n1', level: 1, childIds: ['n2'], name: 'Crossbow - Level 1-1' });
    const l2 = makeWorldNode({
      id: 'w2',
      nodeId: 'n2',
      level: 2,
      name: 'Crossbow - Level 2-1',
      childIds: [],
    });
    (globalThis as any).game = {
      user: { isGM: true },
      items: {
        get: (id: string) => (id === 'w1' ? l1 : id === 'w2' ? l2 : undefined),
        filter: (fn: (i: any) => boolean) => [l1, l2].filter(fn),
      },
    };
    (globalThis as any).foundry = {
      utils: {
        duplicate: (o: any) => JSON.parse(JSON.stringify(o)),
      },
    };
  });

  it('reports embed vs world level mismatch', () => {
    const emb: any = {
      id: 'e1',
      type: 'artifact',
      name: 'Crossbow - Level 2-1',
      system: { level: 1, currentLevel: 1 },
      getFlag: (s: string, k: string) => {
        if (s !== 'mastery-system') return undefined;
        if (k === 'evolutionRootItemId') return 'w1';
        if (k === 'evolutionNodeId') return 'n2';
        if (k === 'artifactActivated') return true;
        return undefined;
      },
    };
    const actor = {
      id: 'a1',
      items: { get: () => emb, filter: (fn: any) => [emb].filter(fn) },
    };
    // Prefer world level for effective
    expect(resolveEffectiveArtifactLevel(emb)).toBe(2);

    const d = diagnoseArtifactEvolution(actor, emb);
    expect(d.desync).toBe(true);
    expect(d.embedLevel).toBe(1);
    expect(d.worldLevel).toBe(2);
    expect(d.summary).toMatch(/DESYNC/);
  });

  it('sync from world normalizes embed level to world node', async () => {
    const emb: any = {
      id: 'e1',
      type: 'artifact',
      name: 'stale',
      system: { level: 1, currentLevel: 1 },
      getFlag: (s: string, k: string) => {
        if (k === 'evolutionRootItemId') return 'w1';
        if (k === 'evolutionNodeId') return 'n2';
        return undefined;
      },
      update: vi.fn(async (data: any) => {
        if (data.name) emb.name = data.name;
        if (data.system) emb.system = data.system;
      }),
    };
    const actor = { id: 'a1' };
    const ok = await syncEmbeddedArtifactFromWorldNodeNormalized(emb, actor);
    expect(ok).toBe(true);
    expect(emb.update).toHaveBeenCalled();
    expect(emb.system.level).toBe(2);
    expect(emb.system.currentLevel).toBe(2);
    expect(emb.name).toBe('Crossbow - Level 2-1');
  });
});

describe('orphan artifact history refund', () => {
  it('plans orphan refund when live level is already at from but history spent to higher', () => {
    const emb = {
      id: 'art1',
      type: 'artifact',
      name: 'Divine Crossbow - Level 1-1',
      system: { level: 1 },
      getFlag: () => undefined,
    };
    const actor = {
      system: { xp: { history: [] } },
      items: {
        get: (id: string) => (id === 'art1' ? emb : undefined),
        filter: (fn: (i: any) => boolean) => [emb].filter(fn),
      },
    };
    (globalThis as any).game = { items: { get: () => undefined } };

    const plan = planHistoryRefund(actor, {
      kind: 'spend',
      category: 'artifact',
      key: 'art1',
      from: 1,
      to: 2,
      what: 'Divine Crossbow 1 → 2',
    });
    expect(plan.refundable).toBe(true);
    expect(plan.orphan).toBe(true);
    expect(plan.refundXp).toBe(artifactLevelXpCost(2));
    expect(canRefundHistoryRow(actor, {
      kind: 'spend',
      category: 'artifact',
      key: 'art1',
      from: 1,
      to: 2,
      what: 'Divine Crossbow 1 → 2',
    })).toBe(true);
  });

  it('lists orphan spends and sums XP', () => {
    const emb = {
      id: 'art1',
      type: 'artifact',
      name: 'Crossbow',
      system: { level: 1 },
      getFlag: () => undefined,
    };
    const actor = {
      system: {
        xp: {
          history: [
            {
              kind: 'spend',
              category: 'artifact',
              amount: 8,
              note: 'Crossbow 1 → 2',
              details: { artifactId: 'art1', from: 1, to: 2 },
            },
          ],
        },
      },
    };
    (globalThis as any).game = { items: { get: () => undefined } };
    const orphans = listOrphanArtifactHistorySpends(actor, emb);
    expect(orphans).toHaveLength(1);
    expect(planOrphanArtifactRefundXp(actor, emb)).toBe(8);
  });

  it('credits orphan XP without crashing', async () => {
    const emb = {
      id: 'art1',
      type: 'artifact',
      name: 'Crossbow',
      system: { level: 1 },
      getFlag: () => undefined,
    };
    const actor = {
      system: {
        points: { xp: 0, xpFree: 0 },
        xp: {
          freeEarned: 0,
          totalEarned: 100,
          totalSpent: 8,
          freeSpent: 0,
          history: [
            {
              kind: 'spend',
              category: 'artifact',
              amount: 8,
              note: 'Crossbow 1 → 2',
              details: { artifactId: 'art1', from: 1, to: 2 },
            },
          ],
        },
      },
      update: vi.fn(async (data: any) => {
        if (data['system.points.xp'] != null) actor.system.points.xp = data['system.points.xp'];
        if (data['system.xp.totalSpent'] != null) actor.system.xp.totalSpent = data['system.xp.totalSpent'];
        if (data['system.xp.history']) actor.system.xp.history = data['system.xp.history'];
      }),
    };
    (globalThis as any).game = { user: { isGM: true, id: 'gm', name: 'GM' }, items: { get: () => undefined } };

    const res = await refundOrphanArtifactSpends(actor, emb);
    expect(res.ok).toBe(true);
    expect(res.refunded).toBe(8);
    expect(actor.update).toHaveBeenCalled();
    expect(actor.system.points.xp).toBe(8);
  });
});

describe('delete with XP refund', () => {
  it('refunds totalArtifactXpToLevel and removes non-echo item when tree walk fails', async () => {
    const emb = {
      id: 'art2',
      type: 'artifact',
      name: 'Crossbow - Level 2-1',
      system: { level: 2, binding: 'bound' },
      getFlag: (s: string, k: string) => {
        if (k === 'echoBound' || k === 'echoLocked') return false;
        if (k === 'evolutionRootItemId') return 'missing';
        if (k === 'evolutionNodeId') return 'missing';
        return undefined;
      },
    };
    const actor = {
      items: { get: (id: string) => (id === 'art2' ? emb : undefined) },
      system: {
        points: { xp: 0, xpFree: 0 },
        xp: { freeEarned: 0, totalEarned: 50, totalSpent: 8, freeSpent: 0, history: [] },
      },
      update: vi.fn(async (data: any) => {
        if (data['system.points.xp'] != null) actor.system.points.xp = data['system.points.xp'];
      }),
      deleteEmbeddedDocuments: vi.fn(async () => {
        return [];
      }),
    };
    (globalThis as any).game = {
      user: { isGM: true, id: 'gm', name: 'GM' },
      items: { get: () => undefined },
    };

    // Mock downgrade to fail so credit path runs
    vi.doMock('../src/artifacts/artifact-evolution-actions.js', () => ({
      downgradeArtifactForActor: vi.fn(async () => ({ ok: false, error: 'no tree' })),
    }));

    const res = await deleteArtifactWithXpRefund(actor, emb);
    expect(res.ok).toBe(true);
    expect(res.refunded).toBe(totalArtifactXpToLevel(2));
    expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith(
      'Item',
      ['art2'],
      expect.objectContaining({ masterySystemForceDelete: true }),
    );
  });

  it('blocks echo-bound delete', async () => {
    const emb = {
      id: 'echo1',
      type: 'artifact',
      name: 'Echo Claws',
      system: { level: 2, binding: 'echo' },
      getFlag: (s: string, k: string) => (k === 'echoBound' ? true : undefined),
    };
    const actor = { deleteEmbeddedDocuments: vi.fn() };
    const res = await deleteArtifactWithXpRefund(actor, emb);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Echo-bound/i);
    expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled();
  });
});
