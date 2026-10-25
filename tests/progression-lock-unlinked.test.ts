import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { applyAttributePendingChanges } from '../src/progression/progression-hub-actions.js';
import { applyPowerReplace } from '../src/utils/power-replace.js';

describe('unlinked token progression lock', () => {
  beforeEach(() => {
    (globalThis as any).ui = { notifications: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } };
    (globalThis as any).game = { user: { id: 'u1', isGM: false } };
  });
  afterEach(() => {
    delete (globalThis as any).ui;
    delete (globalThis as any).game;
  });

  it('applyAttributePendingChanges aborts for players on synthetic unlinked token', async () => {
    const update = vi.fn();
    const actor = {
      isToken: true,
      token: { actorId: 'hero', actorLink: false },
      update,
      system: {
        attributes: { might: { value: 3 } },
        points: { xp: 20, xpFree: 0 },
        xp: { totalSpent: 0, freeSpent: 0, currentStep: { attributes: [], skills: [], powers: [] } },
      },
    };

    const result = await applyAttributePendingChanges(actor as any, { might: 1 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/locked/i);
    expect(update).not.toHaveBeenCalled();
    expect((globalThis as any).ui.notifications.warn).toHaveBeenCalled();
  });

  it('applyAttributePendingChanges does not abort for GM on unlinked token', async () => {
    (globalThis as any).game = { user: { id: 'gm', isGM: true } };
    const update = vi.fn().mockResolvedValue(undefined);
    const actor = {
      isToken: true,
      token: { actorId: 'hero', actorLink: false },
      update,
      system: {
        attributes: {
          might: { value: 3 },
          agility: { value: 2 },
          vitality: { value: 2 },
          intellect: { value: 2 },
          resolve: { value: 2 },
          influence: { value: 2 },
          wits: { value: 2 },
        },
        points: { xp: 20, xpFree: 0 },
        xp: {
          totalSpent: 0,
          freeSpent: 0,
          freeEarned: 0,
          currentStep: { attributes: [], skills: [], powers: [] },
        },
        creation: { complete: true },
      },
    };

    const result = await applyAttributePendingChanges(actor as any, { might: 1 });
    // May fail later on XP/step rules, but must not be the unlinked lock.
    expect(result.error ?? '').not.toMatch(/locked/i);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
    }
  });

  it('applyPowerReplace aborts for players on synthetic unlinked token', async () => {
    const createEmbeddedDocuments = vi.fn();
    const actor = {
      isToken: true,
      token: { actorId: 'hero', actorLink: false },
      items: { filter: () => [] },
      createEmbeddedDocuments,
    };
    const oldItem = {
      id: 'p1',
      name: 'Old',
      type: 'power',
      system: { category: 'active', level: 2, minLevel: 2 },
      flags: {},
      delete: vi.fn(),
    };

    const result = await applyPowerReplace(actor as any, oldItem as any, {
      id: 'cat-1',
      name: 'New',
      category: 'active',
      raw: { levels: { '2': {} } },
    } as any, {});

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/locked/i);
    expect(createEmbeddedDocuments).not.toHaveBeenCalled();
  });
});
