import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/artifact-embedded-sync.js', () => ({
  pushWorldArtifactNodeToEmbeddedActors: vi.fn(async () => undefined),
}));

import {
  buildAllGeneralArtifactTrees,
  ECHO_ARTIFACT_SEED_VERSION,
} from '../src/artifacts/echo-artifact-tree-builder.js';

function mkWorldItem(node: {
  nodeId: string;
  echoArtifactKey: string;
  seedVersion?: number;
  folderId?: string;
  isRoot?: boolean;
}): any {
  const flags: Record<string, Record<string, unknown>> = {
    'mastery-system': {
      nodeId: node.nodeId,
      echoArtifactKey: node.echoArtifactKey,
      seedVersion: node.seedVersion ?? ECHO_ARTIFACT_SEED_VERSION,
      parentIds: [],
      childIds: [],
      ...(node.isRoot ? { isRoot: true } : {}),
    },
  };
  return {
    id: `item-${node.nodeId}`,
    type: 'artifact',
    folder: node.folderId ? { id: node.folderId } : null,
    getFlag(ns: string, key: string) {
      return flags[ns]?.[key];
    },
    update: vi.fn(async (data: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(data)) {
        if (k.startsWith('flags.mastery-system.')) {
          const flagKey = k.slice('flags.mastery-system.'.length);
          flags['mastery-system'][flagKey] = v;
        }
      }
    }),
  };
}

describe('seedArtifactLibrary — incomplete tree repair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('creates missing nodes when an existing tree has fewer items than the catalog', async () => {
    const tree = buildAllGeneralArtifactTrees().find((t) => t.echoArtifactKey === 'heartseeker');
    expect(tree).toBeDefined();
    expect(tree!.nodes.length).toBe(10);

    const rootNode = tree!.nodes[0];
    const existing = [
      mkWorldItem({
        nodeId: rootNode.nodeId,
        echoArtifactKey: 'heartseeker',
        folderId: 'folder-heartseeker',
        isRoot: true,
      }),
    ];

    const createdDocs: any[] = [];

    (globalThis as any).game = {
      user: { isGM: true },
      items: [...existing],
      folders: { find: vi.fn(() => null) },
    };
    (globalThis as any).foundry = {
      utils: {
        duplicate: (x: unknown) => structuredClone(x),
        randomID: () => 'rid',
      },
    };
    (globalThis as any).ui = { notifications: { info: vi.fn(), warn: vi.fn() } };
    (globalThis as any).Item = {
      createDocuments: vi.fn(async (docs: any[]) => {
        createdDocs.push(...docs);
        return docs.map((d, i) => ({ id: `new-${i}`, ...d }));
      }),
    };
    (globalThis as any).Folder = { create: vi.fn(async () => ({ id: 'folder-new' })) };

    // Repair one tree only — avoids mocking the whole catalog away from seedArtifactLibrary.
    const { repairArtifactTreeByKey } = await import('../src/utils/seed-artifact-library.js');
    const touched = await repairArtifactTreeByKey('heartseeker');

    expect(touched).toBe(10);
    expect(createdDocs).toHaveLength(9);
    expect((globalThis as any).Item.createDocuments).toHaveBeenCalledTimes(1);
    expect(existing[0].update).toHaveBeenCalled();
  });
});
