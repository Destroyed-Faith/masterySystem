import { describe, expect, it } from 'vitest';
import {
  isAssignableStatusId,
  listAssignableStatuses,
  removeStatusById,
  setActorCatalogStatus,
  upsertStatusEntry,
} from '../src/system/assign-status.js';
import { readActorStatusEffects } from '../src/system/active-specials.js';
import { statusIdFromHudTarget } from '../src/system/status-hud.js';

function mockActor(statusEffects: unknown[] = []) {
  const actor = {
    id: 'a1',
    name: 'Bjorn',
    system: { statusEffects: [...statusEffects] },
    flags: { 'mastery-system': {} as Record<string, unknown> },
    getFlag(ns: string, key: string) {
      return actor.flags[ns]?.[key];
    },
    update: async (patch: Record<string, unknown>) => {
      if (patch['system.statusEffects']) {
        actor.system.statusEffects = patch['system.statusEffects'] as unknown[];
      }
      if (patch['flags.mastery-system.statusEffects']) {
        actor.flags['mastery-system'].statusEffects = patch['flags.mastery-system.statusEffects'];
      }
    },
  };
  return actor;
}

describe('assign catalog status', () => {
  it('offers persistent statuses and skips instants', () => {
    const ids = listAssignableStatuses().map((c) => c.id);
    expect(ids).toContain('slow');
    expect(ids).toContain('surprise');
    expect(ids).toContain('stunned');
    expect(ids).not.toContain('knockback');
    expect(ids).not.toContain('cleanse');
    expect(isAssignableStatusId('prone')).toBe(true);
    expect(isAssignableStatusId('push')).toBe(false);
  });

  it('adds a missing status and keeps an existing rank unless a new one is given', () => {
    const added = upsertStatusEntry([], 'slow');
    expect(added).toEqual([{ id: 'slow', name: 'Slow', value: 1 }]);
    const kept = upsertStatusEntry(added, 'slow');
    expect(kept).toEqual([{ id: 'slow', name: 'Slow', value: 1 }]);
    const raised = upsertStatusEntry(kept, 'slow', 4);
    expect(raised).toEqual([{ id: 'slow', name: 'Slow', value: 4 }]);
    const surprise = upsertStatusEntry(raised, 'surprise');
    expect(surprise[1]).toEqual({ id: 'surprise', name: 'Surprise' });
  });

  it('removes a status by id', () => {
    const next = removeStatusById(
      [
        { id: 'slow', value: 2 },
        { id: 'prone' },
      ],
      'slow',
    );
    expect(next).toEqual([{ id: 'prone' }]);
  });

  it('writes the sheet list when the status was not there', async () => {
    const actor = mockActor();
    await setActorCatalogStatus(actor, 'stunned', true);
    expect(actor.system.statusEffects).toEqual([{ id: 'stunned', name: 'Stunned' }]);
    expect(actor.flags['mastery-system'].statusEffects).toEqual([{ id: 'stunned', name: 'Stunned' }]);
    await setActorCatalogStatus(actor, 'stunned', false);
    expect(actor.system.statusEffects).toEqual([]);
    expect(actor.flags['mastery-system'].statusEffects).toEqual([]);
  });

  it('reads flags when the sheet field was dropped', () => {
    const actor = mockActor();
    actor.system.statusEffects = [];
    actor.flags['mastery-system'].statusEffects = [{ id: 'slow', name: 'Slow', value: 6 }];
    expect(readActorStatusEffects(actor)).toEqual([{ id: 'slow', name: 'Slow', value: 6 }]);
  });
});

describe('token HUD status target', () => {
  it('reads the status id from the palette button, not from an instant', () => {
    const button = {
      dataset: { statusId: 'slow', action: 'effect' },
      closest() {
        return this;
      },
    };
    const img = {
      dataset: {},
      closest() {
        return button;
      },
    };
    expect(statusIdFromHudTarget(img)).toBe('slow');

    const instant = {
      dataset: { statusId: 'knockback', action: 'effect' },
      closest() {
        return this;
      },
    };
    expect(statusIdFromHudTarget(instant)).toBe('');
  });
});
