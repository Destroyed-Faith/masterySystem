import { describe, expect, it } from 'vitest';
import {
  isSelectableStatusId,
  isSystemStatusId,
  MASTERY_STATUS_EFFECTS,
  SELECTABLE_STATUS_IDS,
} from '../src/system/status-effects.js';
import { getEffectById } from '../src/utils/special-effects.js';
import { listAssignableStatuses } from '../src/system/assign-status.js';

describe('status effect registry audit', () => {
  it('keeps every selectable id registered for the Token HUD', () => {
    const registered = new Set(MASTERY_STATUS_EFFECTS.map((e) => e.id));
    for (const id of SELECTABLE_STATUS_IDS) {
      expect(registered.has(id)).toBe(true);
      expect(isSelectableStatusId(id)).toBe(true);
      expect(isSystemStatusId(id)).toBe(true);
    }
  });

  it('hides system-managed statuses from the HUD palette flag', () => {
    for (const id of ['stunned', 'surprise', 'regeneration', 'crit', 'exorcism', 'requiem', 'invisible']) {
      const row = MASTERY_STATUS_EFFECTS.find((e) => e.id === id);
      expect(row?.hud).toBe(false);
      expect(isSelectableStatusId(id)).toBe(false);
    }
  });

  it('omits retired picker entries from the registry', () => {
    const ids = MASTERY_STATUS_EFFECTS.map((e) => e.id);
    for (const id of ['charmed', 'curse', 'entangled', 'suppress', 'advantage', 'cleanse', 'knockback']) {
      expect(ids).not.toContain(id);
    }
  });

  it('matches numeric vs flag Specials for selectable Core entries', () => {
    const valued = ['blight', 'brace', 'bulwark', 'hex', 'root', 'slow'];
    const flags = ['prone', 'immovable', 'grappled'];
    for (const id of valued) {
      expect(getEffectById(id)?.hasValue ?? listAssignableStatuses().find((c) => c.id === id)?.hasValue).toBe(
        true,
      );
    }
    for (const id of flags) {
      const def = getEffectById(id);
      const choice = listAssignableStatuses().find((c) => c.id === id);
      expect(def?.hasValue === true || choice?.hasValue === true).toBe(false);
    }
  });
});
