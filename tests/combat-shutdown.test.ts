import { afterEach, describe, expect, it, vi } from 'vitest';
import { findShutdownCombat, shutDownCombat } from '../src/combat/combat-shutdown.js';

function mockCombat(id: string, fail: { delete?: boolean; end?: boolean } = {}) {
  return {
    id,
    round: 4,
    deleted: false,
    ended: false,
    delete: async function () {
      if (fail.delete) throw new Error('locked');
      this.deleted = true;
    },
    endCombat: async function () {
      if (fail.end) throw new Error('locked too');
      this.ended = true;
    },
  };
}

function setupGame(options: {
  isGM?: boolean;
  active?: any;
  combat?: any;
  contents?: any[];
}) {
  (globalThis as any).game = {
    user: { isGM: options.isGM ?? true },
    combat: options.combat ?? null,
    combats: { active: options.active ?? null, contents: options.contents ?? [] },
    i18n: { localize: (key: string) => key },
  };
  (globalThis as any).ui = {
    notifications: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
  // No dialog implementations available: the shutdown proceeds without asking.
  (globalThis as any).foundry = {};
  delete (globalThis as any).Dialog;
}

afterEach(() => {
  delete (globalThis as any).game;
  delete (globalThis as any).ui;
  delete (globalThis as any).foundry;
});

describe('shutdown target', () => {
  it('prefers the active combat', () => {
    const active = mockCombat('active');
    const other = mockCombat('other');
    setupGame({ active, combat: other, contents: [other] });
    expect(findShutdownCombat()).toBe(active);
  });

  it('still finds a combat that is not active, because a wedged one rarely is', () => {
    const stuck = mockCombat('stuck');
    setupGame({ contents: [stuck] });
    expect(findShutdownCombat()).toBe(stuck);
  });

  it('returns null when there is nothing to shut down', () => {
    setupGame({});
    expect(findShutdownCombat()).toBeNull();
  });
});

describe('shutting down a combat', () => {
  it('deletes the combat so the cleanup hooks run', async () => {
    const combat = mockCombat('cmb');
    setupGame({ active: combat });

    await expect(shutDownCombat()).resolves.toBe(true);
    expect(combat.deleted).toBe(true);
  });

  it('falls back to endCombat when the document refuses deletion', async () => {
    const combat = mockCombat('cmb', { delete: true });
    setupGame({ active: combat });

    await expect(shutDownCombat()).resolves.toBe(true);
    expect(combat.deleted).toBe(false);
    expect(combat.ended).toBe(true);
  });

  it('reports failure when neither path works', async () => {
    const combat = mockCombat('cmb', { delete: true, end: true });
    setupGame({ active: combat });

    await expect(shutDownCombat()).resolves.toBe(false);
    expect((globalThis as any).ui.notifications.error).toHaveBeenCalled();
  });

  it('does nothing for players', async () => {
    const combat = mockCombat('cmb');
    setupGame({ isGM: false, active: combat });

    await expect(shutDownCombat()).resolves.toBe(false);
    expect(combat.deleted).toBe(false);
  });

  it('does nothing when no combat exists', async () => {
    setupGame({});
    await expect(shutDownCombat()).resolves.toBe(false);
  });
});
