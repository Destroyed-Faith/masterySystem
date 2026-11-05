/**
 * P1 safety gate: holdArtifactLibraryAutoRefresh blocks seedVersion-driven refresh.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Artifact library auto-refresh hold', () => {
  beforeEach(() => {
    vi.resetModules();
    (globalThis as any).game = {
      user: { isGM: true },
      settings: {
        get: (_ns: string, key: string) => {
          if (key === 'holdArtifactLibraryAutoRefresh') return true;
          return undefined;
        },
      },
      items: [],
    };
    (globalThis as any).ui = { notifications: { info: vi.fn(), warn: vi.fn() } };
    (globalThis as any).Folder = { create: vi.fn() };
    (globalThis as any).Item = { createDocuments: vi.fn(async () => []) };
    (globalThis as any).foundry = {
      utils: { duplicate: (x: any) => JSON.parse(JSON.stringify(x)) },
    };
  });

  it('isArtifactLibraryAutoRefreshHeld defaults to true when setting is on', async () => {
    const { isArtifactLibraryAutoRefreshHeld } = await import(
      '../src/utils/seed-artifact-library.js'
    );
    expect(isArtifactLibraryAutoRefreshHeld()).toBe(true);
  });

  it('seedArtifactLibrary with hold skips stale upgrades and warns (force bypasses)', async () => {
    const staleNode = {
      type: 'artifact',
      id: 'w1',
      folder: { id: 'f1' },
      getFlag: (ns: string, k: string) => {
        if (ns !== 'mastery-system') return undefined;
        if (k === 'echoArtifactKey') return 'dragonHead';
        if (k === 'nodeId') return 'dragonHead-l1';
        if (k === 'seedVersion') return 57;
        if (k === 'isRoot') return true;
        return undefined;
      },
      update: vi.fn(async () => {}),
    };
    // Provide 10 nodes so the tree is complete-but-stale (not incomplete).
    const nodes = Array.from({ length: 10 }, (_, i) => ({
      ...staleNode,
      id: `w${i + 1}`,
      getFlag: (ns: string, k: string) => {
        if (ns !== 'mastery-system') return undefined;
        if (k === 'echoArtifactKey') return 'dragonHead';
        if (k === 'nodeId') return `dragonHead-l${i + 1}`;
        if (k === 'seedVersion') return 57;
        if (k === 'isRoot') return i === 0;
        return undefined;
      },
      update: vi.fn(async () => {}),
    }));
    (globalThis as any).game.items = nodes;

    const mod = await import('../src/utils/seed-artifact-library.js');
    const n = await mod.seedArtifactLibrary();
    expect(n).toBe(0);
    expect(nodes[0].update).not.toHaveBeenCalled();
    expect((globalThis as any).ui.notifications.warn).toHaveBeenCalledWith(
      expect.stringContaining('auto-refresh held'),
    );

    // force: true bypasses the hold.
    const forced = await mod.seedArtifactLibrary({ force: true });
    expect(forced).toBeGreaterThan(0);
    expect(nodes[0].update).toHaveBeenCalled();
  });
});
