import { describe, expect, it } from 'vitest';

import {
  mergeNpcAttackValueLists,
  preserveNpcExtraPowersInSystemUpdate,
} from '../src/utils/npc-attack-model.js';

describe('mergeNpcAttackValueLists', () => {
  it('keeps a just-added extra when the submitted form is still empty', () => {
    const existing = [{ name: 'Neue Power', attackDiceCount: 6, damageDiceCount: 4 }];
    const merged = mergeNpcAttackValueLists(existing, []);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Neue Power');
  });

  it('does not restore a deleted last extra from a stale submitted row', () => {
    const submitted = [{ name: 'Old Extra', attackDiceCount: 8, damageDiceCount: 6 }];
    const merged = mergeNpcAttackValueLists([], submitted);
    expect(merged).toHaveLength(0);
  });

  it('overlays submitted field edits onto existing rows', () => {
    const existing = [{ name: 'Bite', attackDiceCount: 6, damageDiceCount: 4 }];
    const submitted = [{ name: 'Bite+', attackDiceCount: 8, damageDiceCount: 4 }];
    const merged = mergeNpcAttackValueLists(existing, submitted);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Bite+');
    expect(merged[0].attackDiceCount).toBe(8);
    expect(merged[0].damageDiceCount).toBe(4);
  });

  it('treats missing existing as first-time submitted extras', () => {
    const submitted = [{ name: 'Imported', attackDiceCount: 6, damageDiceCount: 4 }];
    const merged = mergeNpcAttackValueLists(undefined, submitted);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Imported');
  });
});

describe('preserveNpcExtraPowersInSystemUpdate', () => {
  it('keeps phase extras when a form submit omits attackValues', () => {
    const current = {
      phases: [
        {
          name: 'Phase 1',
          attackValues: [{ name: 'Neue Power', attackDiceCount: 6, damageDiceCount: 4 }],
        },
      ],
    };
    const update = {
      phases: [{ name: 'Phase 1', combat: { armor: 2 } }],
    };
    preserveNpcExtraPowersInSystemUpdate(current, update);
    expect(update.phases[0].attackValues).toHaveLength(1);
    expect(update.phases[0].attackValues[0].name).toBe('Neue Power');
    expect(update.phases[0].combat.armor).toBe(2);
  });

  it('keeps root extras when a stale submit sends an empty list', () => {
    const current = {
      attackValues: [{ name: 'Neue Power', attackDiceCount: 6, damageDiceCount: 4 }],
    };
    const update = { attackValues: [] };
    preserveNpcExtraPowersInSystemUpdate(current, update);
    expect(update.attackValues).toHaveLength(1);
    expect(update.attackValues[0].name).toBe('Neue Power');
  });
});
