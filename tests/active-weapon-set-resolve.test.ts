/**
 * Active Weapon Set must win over leftover equipped conventional weapons
 * (echo Claws stay equipped after a swap — stale 1d8 must not beat 6d8 Claws).
 */
import { describe, expect, it } from 'vitest';
import { resolveEquippedWeaponForAttackType } from '../src/utils/unarmed-fallback';
import { WEAPON_SETS_FLAG, WEAPON_SETS_SCHEMA } from '../src/utils/weapon-sets';

function makeActor(items: any[], sets: { active: 1 | 2; mainhand: string | null }) {
  const byId = new Map(items.map((i) => [i.id, i]));
  return {
    items: {
      get: (id: string) => byId.get(id),
      values: () => items.values(),
      [Symbol.iterator]: () => items[Symbol.iterator](),
    },
    getFlag: (_s: string, key: string) => {
      if (key !== WEAPON_SETS_FLAG) return undefined;
      return {
        schemaVersion: WEAPON_SETS_SCHEMA,
        active: sets.active,
        stowed: false,
        sets: {
          1: { mainhand: sets.mainhand, offhand: sets.mainhand },
          2: { mainhand: null, offhand: null },
        },
      };
    },
  };
}

describe('resolveEquippedWeaponForAttackType — active Weapon Set', () => {
  it('prefers active-set Dragon Claws (6d8) over a leftover equipped 1d8 weapon', () => {
    const claws = {
      id: 'art-claws',
      name: 'Dragon Claws',
      type: 'artifact',
      system: {
        equipped: true,
        binding: 'echo',
        baseProfile: 'twoHandedWeapon',
        currentLevel: 2,
        artifactWeapon: { damage: '6d8', weaponType: 'melee', hands: 2, specials: [] },
      },
      getFlag: () => ({ slot: 'mainhand' }),
    };
    const leftover = {
      id: 'wpn-dagger',
      name: 'Dagger',
      type: 'weapon',
      system: { equipped: true, weaponType: 'melee', damage: '1d8' },
    };
    const actor = makeActor([claws, leftover], { active: 1, mainhand: 'art-claws' });
    const items = [claws, leftover];

    // Without actor: conventional leftover wins (old bug).
    const withoutActor = resolveEquippedWeaponForAttackType(items, 'melee');
    expect(withoutActor?.id).toBe('wpn-dagger');

    // With actor: active set Claws win and expose 6d8.
    const withActor = resolveEquippedWeaponForAttackType(items, 'melee', actor);
    expect(withActor?.id).toBe('art-claws');
    expect(withActor?.system?.damage).toBe('6d8');
  });

  it('falls back to virtual unarmed when the active set is empty', () => {
    const leftover = {
      id: 'wpn-dagger',
      name: 'Dagger',
      type: 'weapon',
      system: { equipped: true, weaponType: 'melee', damage: '1d8' },
    };
    const actor = makeActor([leftover], { active: 1, mainhand: null });
    const resolved = resolveEquippedWeaponForAttackType([leftover], 'melee', actor);
    expect(resolved?.system?.virtualUnarmed).toBe(true);
    expect(resolved?.system?.damage).toBe('1d8');
  });
});
