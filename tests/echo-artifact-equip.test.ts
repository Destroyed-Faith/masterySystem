import { describe, it, expect, vi } from 'vitest';
import {
  dedupeEchoArtifactsOnActor,
  getEchoArtifactKey,
  isEchoArtifactInventoryHidden,
} from '../src/utils/echo-artifact-equip';

function mockEchoItem(overrides: Record<string, unknown> = {}) {
  const flags: Record<string, unknown> = {
    'mastery-system': {
      echoArtifactKey: 'dragonHead',
      echoBound: true,
      ...(overrides.flags as Record<string, unknown> | undefined),
    },
  };
  const base = {
    id: 'item-a',
    type: 'artifact',
    name: 'Dragon Head - Level 1-1',
    getFlag(ns: string, key: string) {
      return (flags[ns] as any)?.[key];
    },
    system: { binding: 'echo', equipped: false, ...(overrides.system as object) },
    ...overrides,
  };
  return base;
}

describe('echo-artifact-equip', () => {
  it('getEchoArtifactKey reads echoArtifactKey flag', () => {
    expect(getEchoArtifactKey(mockEchoItem())).toBe('dragonHead');
  });

  it('isEchoArtifactInventoryHidden is true for echo-bound artifacts', () => {
    expect(isEchoArtifactInventoryHidden(mockEchoItem())).toBe(true);
    expect(isEchoArtifactInventoryHidden({ type: 'weapon', name: 'Sword' })).toBe(false);
  });

  it('dedupeEchoArtifactsOnActor keeps wired slotted copy and deletes orphan', async () => {
    const wired = mockEchoItem({
      id: 'wired',
      getFlag(ns: string, key: string) {
        const bag: Record<string, unknown> = {
          echoArtifactKey: 'dragonHead',
          echoBound: true,
          echoLocked: true,
          evolutionRootItemId: 'world-root',
          equipment: { slot: 'head' },
        };
        return (ns === 'mastery-system' ? bag[key] : undefined) as any;
      },
    });
    const orphan = mockEchoItem({
      id: 'orphan',
      getFlag(ns: string, key: string) {
        const bag: Record<string, unknown> = {
          echoArtifactKey: 'dragonHead',
          echoBound: true,
        };
        return (ns === 'mastery-system' ? bag[key] : undefined) as any;
      },
    });

    const deleteEmbeddedDocuments = vi.fn(async () => []);
    const update = vi.fn(async () => {});
    wired.update = update;
    orphan.update = update;

    const actor = {
      items: {
        filter: (fn: (it: any) => boolean) => [wired, orphan].filter(fn),
        get: (id: string) => (id === 'wired' ? wired : id === 'orphan' ? orphan : undefined),
      },
      deleteEmbeddedDocuments,
    };

    const removed = await dedupeEchoArtifactsOnActor(actor as any);
    expect(removed).toBe(1);
    expect(deleteEmbeddedDocuments).toHaveBeenCalledWith(
      'Item',
      ['orphan'],
      expect.objectContaining({ masterySystemForceDelete: true }),
    );
  });
});
