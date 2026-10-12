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

  it('empty active set falls through to equipped scan (bound artifact still wins)', () => {
    const artifact = {
      id: 'art-moon',
      name: 'Moonlight Greatsword',
      type: 'artifact',
      system: {
        equipped: true,
        binding: 'bound',
        baseProfile: 'twoHandedWeapon',
        currentLevel: 4,
        artifactWeapon: { damage: '8d8', weaponType: 'melee', hands: 2, specials: [] },
      },
    };
    const actor = makeActor([artifact], { active: 1, mainhand: null });
    const resolved = resolveEquippedWeaponForAttackType([artifact], 'melee', actor);
    expect(resolved?.id).toBe('art-moon');
    expect(resolved?.system?.damage).toBe('8d8');
  });

  it('stowed fists force Unarmed even when an artifact is still equipped', () => {
    const artifact = {
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
    };
    const byId = new Map([[artifact.id, artifact]]);
    const actor = {
      items: {
        get: (id: string) => byId.get(id),
        values: () => [artifact].values(),
      },
      getFlag: (_s: string, key: string) => {
        if (key !== WEAPON_SETS_FLAG) return undefined;
        return {
          schemaVersion: WEAPON_SETS_SCHEMA,
          active: 1,
          stowed: true,
          sets: {
            1: { mainhand: 'art-claws', offhand: 'art-claws' },
            2: { mainhand: null, offhand: null },
          },
        };
      },
    };
    const resolved = resolveEquippedWeaponForAttackType([artifact], 'melee', actor);
    expect(resolved?.system?.virtualUnarmed).toBe(true);
    expect(resolved?.system?.damage).toBe('1d8');
  });
});
