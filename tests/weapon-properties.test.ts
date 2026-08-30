import { describe, expect, it } from 'vitest';

import {
  defensiveEvadeBonus,
  hasLoadProperty,
  hasWeaponProperty,
  isLightWeapon,
  isWieldedTwoHanded,
  versatileBonusDice,
} from '../src/utils/weapon-properties.js';

function weapon(opts: {
  innates?: string[];
  hands?: number;
  twoHandedFlag?: boolean;
  type?: string;
}) {
  return {
    type: opts.type ?? 'weapon',
    system: {
      innateAbilities: opts.innates ?? [],
      hands: opts.hands ?? 1,
      equipped: true,
    },
    flags: {
      'mastery-system': {
        equipment: opts.twoHandedFlag ? { twoHanded: true } : {},
      },
    },
  };
}

describe('weapon properties (PG Weapon Properties)', () => {
  it('detects properties from innate lines', () => {
    const w = weapon({ innates: ['Finesse', 'Light', 'Thrown (16 m)'] });
    expect(hasWeaponProperty(w, 'light')).toBe(true);
    expect(hasWeaponProperty(w, 'thrown')).toBe(true);
    expect(hasWeaponProperty(w, 'versatile')).toBe(false);
    expect(isLightWeapon(w)).toBe(true);
    expect(hasLoadProperty(weapon({ innates: ['Ranged (32 m)', 'Load'] }))).toBe(true);
  });

  it('Versatile grants +2d8 only while wielded two-handed', () => {
    const oneHand = weapon({ innates: ['Versatile'] });
    expect(versatileBonusDice(oneHand)).toBe(0);
    const twoHand = weapon({ innates: ['Versatile'], twoHandedFlag: true });
    expect(isWieldedTwoHanded(twoHand)).toBe(true);
    expect(versatileBonusDice(twoHand)).toBe(2);
    // Naturally two-handed weapons never get the Versatile bonus (no innate).
    expect(versatileBonusDice(weapon({ hands: 2 }))).toBe(0);
  });

  it('Defensive adds +MR Evade (max +6) only two-handed', () => {
    const staff = weapon({ innates: ['Defensive'], hands: 2 });
    expect(defensiveEvadeBonus({ system: { mastery: { rank: 3 } } }, staff)).toBe(3);
    expect(defensiveEvadeBonus({ system: { mastery: { rank: 8 } } }, staff)).toBe(6);
    const oneHanded = weapon({ innates: ['Defensive'], hands: 1 });
    expect(defensiveEvadeBonus({ system: { mastery: { rank: 3 } } }, oneHanded)).toBe(0);
    expect(defensiveEvadeBonus({ system: { mastery: { rank: 3 } } }, weapon({ hands: 2 }))).toBe(0);
  });
});
