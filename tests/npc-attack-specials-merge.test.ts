import { describe, expect, it } from 'vitest';

import {
  coerceNpcAttackSpecials,
  mergeNpcAttackSpecials,
  mergeNpcAttackRowSpecials,
  preserveNpcAttackSpecialsInSystemUpdate,
  sanitizeNpcAttackTargetingFields,
} from '../src/utils/npc-attack-model.js';

describe('coerceNpcAttackSpecials', () => {
  it('keeps a real array of specials', () => {
    const rows = coerceNpcAttackSpecials([
      { special: 'bleed', specialValue: 2 },
      { special: 'stun' },
    ]);
    expect(rows).toEqual([
      { special: 'bleed', specialValue: 2 },
      { special: 'stun' },
    ]);
  });

  it('coerces expandObject numeric-keyed objects into an array', () => {
    const rows = coerceNpcAttackSpecials({
      0: { special: 'lacerate', specialValue: 1 },
      1: { special: 'ruin' },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].special).toBe('lacerate');
    expect(rows[0].specialValue).toBe(1);
    expect(rows[1].special).toBe('ruin');
  });

  it('returns [] for missing / junk', () => {
    expect(coerceNpcAttackSpecials(undefined)).toEqual([]);
    expect(coerceNpcAttackSpecials(null)).toEqual([]);
    expect(coerceNpcAttackSpecials('bleed')).toEqual([]);
  });
});

describe('mergeNpcAttackSpecials', () => {
  it('keeps list length from existing when a stale submit omits a just-added row', () => {
    const existing = [{ special: '' }, { special: 'bleed', specialValue: 2 }];
    const submitted = [{ special: 'bleed', specialValue: 2 }];
    const merged = mergeNpcAttackSpecials(existing, submitted);
    expect(merged).toHaveLength(2);
    expect(merged[0].special).toBe('bleed');
    expect(merged[1].special).toBe('bleed');
  });

  it('overlays a select choice onto an empty specials slot', () => {
    const existing = [{ special: '' }];
    const submitted = [{ special: 'stun', specialValue: 1 }];
    const merged = mergeNpcAttackSpecials(existing, submitted);
    expect(merged).toEqual([{ special: 'stun', specialValue: 1 }]);
  });

  it('does not restore deleted specials from a stale longer submit', () => {
    const merged = mergeNpcAttackSpecials([], [{ special: 'bleed' }]);
    expect(merged).toHaveLength(0);
  });
});

describe('preserveNpcAttackSpecialsInSystemUpdate', () => {
  it('keeps base-attack specials when form expand sends a numeric-keyed object', () => {
    const current = {
      npcBaseAttack: {
        name: 'Waffenangriff',
        attackDiceCount: 6,
        damageDiceCount: 4,
        specials: [{ special: 'bleed', specialValue: 2 }],
      },
    };
    const update = {
      npcBaseAttack: {
        name: 'Waffenangriff',
        attackDiceCount: 6,
        damageDiceCount: 4,
        specials: { 0: { special: 'stun', specialValue: 1 } },
      },
    };
    preserveNpcAttackSpecialsInSystemUpdate(current, update);
    expect(Array.isArray(update.npcBaseAttack.specials)).toBe(true);
    expect(update.npcBaseAttack.specials).toEqual([{ special: 'stun', specialValue: 1 }]);
  });

  it('keeps a just-added empty specials row when a stale submit omits it', () => {
    const current = {
      npcBaseAttack: {
        name: 'Waffenangriff',
        specials: [{ special: '' }],
      },
    };
    const update = {
      npcBaseAttack: {
        name: 'Waffenangriff',
        specials: [],
      },
    };
    preserveNpcAttackSpecialsInSystemUpdate(current, update);
    expect(update.npcBaseAttack.specials).toHaveLength(1);
    expect(update.npcBaseAttack.specials[0].special).toBe('');
  });

  it('merges phase base-attack specials the same way', () => {
    const current = {
      phases: [
        {
          npcBaseAttack: {
            name: 'Waffenangriff',
            specials: [{ special: 'bleed' }],
          },
        },
      ],
    };
    const update = {
      phases: [
        {
          npcBaseAttack: {
            name: 'Waffenangriff',
            specials: { 0: { special: 'stun' } },
          },
        },
      ],
    };
    preserveNpcAttackSpecialsInSystemUpdate(current, update);
    expect(update.phases[0].npcBaseAttack.specials).toEqual([{ special: 'stun' }]);
  });
});

describe('sanitizeNpcAttackTargetingFields specials', () => {
  it('normalizes object-shaped specials on an attack row', () => {
    const row = sanitizeNpcAttackTargetingFields({
      name: 'Bite',
      npcRangeKind: 'melee',
      npcRangeMeters: 2,
      npcAoeRadiusM: 0,
      specials: { 0: { special: 'bleed', specialValue: 3 } },
    });
    expect(row.specials).toEqual([{ special: 'bleed', specialValue: 3 }]);
  });
});

describe('mergeNpcAttackRowSpecials', () => {
  it('preserves other attack fields while merging specials', () => {
    const merged = mergeNpcAttackRowSpecials(
      { name: 'Waffenangriff', attackDiceCount: 6, specials: [{ special: '' }] },
      { name: 'Waffenangriff', attackDiceCount: 8, specials: [{ special: 'stun' }] },
    );
    expect(merged.attackDiceCount).toBe(8);
    expect(merged.specials).toEqual([{ special: 'stun' }]);
  });
});
