/**
 * Full Item export — read-only dump for parent Items / Echo Artifacts.
 */
import { describe, expect, it } from 'vitest';
import { getEchoArtifact, buildArtifactSystemFromEchoDef } from '../src/utils/echo-artifacts.js';
import { getGeneralArtifact } from '../src/utils/general-artifacts.js';
import {
  buildItemFullExportBundle,
  exportItemFullJson,
  exportItemFullMarkdown,
  groupProgressionByLevel,
  ITEM_FULL_EXPORT_KIND,
  readStoredItemDocument,
} from '../src/utils/item-full-export.js';

function mockItem(opts: {
  name: string;
  system: Record<string, unknown>;
  flags?: Record<string, unknown>;
  id?: string;
}): any {
  const flags = {
    'mastery-system': { ...(opts.flags || {}) },
  };
  return {
    id: opts.id || 'ItemMock001',
    uuid: `Item.${opts.id || 'ItemMock001'}`,
    name: opts.name,
    type: 'artifact',
    img: 'icons/svg/item-bag.svg',
    system: opts.system,
    flags,
    folder: null,
    getFlag: (scope: string, key: string) => (flags as any)[scope]?.[key],
    toObject: () => ({
      _id: opts.id || 'ItemMock001',
      name: opts.name,
      type: 'artifact',
      img: 'icons/svg/item-bag.svg',
      system: opts.system,
      flags,
      folder: null,
    }),
    update: async () => {
      throw new Error('export must not update the item');
    },
  };
}

describe('item full export — Lantern of the Hollow Star (Oda-style lantern)', () => {
  it('exports stored document + registry without mutating the item', () => {
    const def = getGeneralArtifact('lanternOfTheHollowStar');
    expect(def?.name).toMatch(/Lantern/i);

    // Simulate a renamed player copy ("Oda's Lantern") still keyed to the catalog.
    const system = {
      ...((def as any) && {
        level: 3,
        currentLevel: 3,
        slot: def!.slot,
        baseProfile: def!.baseProfile,
        binding: 'bound',
        levelProgression: def!.levelProgression,
        baseValues: def!.baseValues,
        description: def!.description,
        lore: def!.description,
        progressionPicks: [],
        stoneFunction: { kind: 'stoneBattery', attribute: 'resolve' },
        extraStoneFunctions: [
          { kind: 'stonePool', attribute: 'resolve' },
          { kind: 'stoneRefresh', attribute: 'resolve' },
        ],
      }),
    };
    const item = mockItem({
      name: "Oda's Lantern",
      id: 'OdaLantern01',
      system,
      flags: { generalArtifactKey: 'lanternOfTheHollowStar' },
    });

    const bundle = buildItemFullExportBundle(item, {
      exportedAt: '2026-10-25T00:00:00.000Z',
      systemVersion: '0.9.799',
    });

    expect(bundle.exportKind).toBe(ITEM_FULL_EXPORT_KIND);
    expect(bundle.identity.generalArtifactKey).toBe('lanternOfTheHollowStar');
    expect(bundle.storedItem.name).toBe("Oda's Lantern");
    expect((bundle.storedItem.system as any).currentLevel).toBe(3);
    expect(bundle.registryReference.source).toBe('general');
    expect(bundle.registryReference.key).toBe('lanternOfTheHollowStar');
    expect(String((bundle.registryReference.definition as any)?.name || '')).toMatch(/Hollow Star/i);

    const md = bundle.markdown;
    expect(md).toContain("Export Full Item — Oda's Lantern");
    expect(md).toContain('## A. STORED');
    expect(md).toContain('## F. STORED — Level Progression');
    expect(md).toContain('## K. REGISTRY');
    expect(md).toMatch(/not\*\* stored on the Item|not stored on the Item/);
    expect(md).toContain('True Hollow Star');
    expect(md).toContain('Stone Battery'); // registry pick specs

    const json = exportItemFullJson(item);
    expect(json).toContain('mastery-item-full-export');
    expect(json).toContain("Oda's Lantern");
    expect(json).not.toContain('export must not update');
  });
});

describe('item full export — Dragon Head Echo Artifact', () => {
  it('includes Levels 1–10 progression and Echo registry definition', () => {
    const def = getEchoArtifact('dragonHead');
    expect(def).toBeTruthy();
    const system = buildArtifactSystemFromEchoDef(def!);
    system.currentLevel = 4;
    system.level = 4;
    const item = mockItem({
      name: 'Dragon Head',
      id: 'DragonHeadL4',
      system,
      flags: { echoArtifactKey: 'dragonHead', echoBound: true },
    });

    const md = exportItemFullMarkdown(item);
    expect(md).toContain('Export Full Item — Dragon Head');
    expect(md).toContain('echoArtifactKey');
    expect(md).toContain('### Level 1');
    expect(md).toContain('### Level 10');
    expect(md).toMatch(/Breath Weapon/i);
    expect(md).toContain('## K. REGISTRY');
    expect(md).toContain('Source: **echo**');

    const stored = readStoredItemDocument(item);
    const rows = (stored.system as any).levelProgression || [];
    const byLevel = groupProgressionByLevel(rows);
    expect(byLevel.get(1)?.length).toBeGreaterThan(0);
    // Awakening / ultimate typically at 10 for Dragon Head
    expect([...byLevel.values()].some((r) => r.length > 0)).toBe(true);

    const bundle = buildItemFullExportBundle(item);
    expect(bundle.registryReference.source).toBe('echo');
    expect(bundle.registryReference.key).toBe('dragonHead');
  });
});

describe('item full export — non-artifact power stays stored-only', () => {
  it('has no registry block when no artifact key is present', () => {
    const item = {
      id: 'Pow1',
      uuid: 'Item.Pow1',
      name: 'Ignite',
      type: 'power',
      system: { category: 'active', rank: 4, description: 'Test power' },
      flags: {},
      getFlag: () => undefined,
      toObject: () => ({
        _id: 'Pow1',
        name: 'Ignite',
        type: 'power',
        system: { category: 'active', rank: 4, description: 'Test power' },
        flags: {},
      }),
    };
    const bundle = buildItemFullExportBundle(item);
    expect(bundle.registryReference.definition).toBeNull();
    expect(bundle.markdown).toContain('No Echo / General Artifact registry key');
    expect(bundle.storedItem.type).toBe('power');
  });
});
