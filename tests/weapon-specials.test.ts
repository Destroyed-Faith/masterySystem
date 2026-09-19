import { describe, expect, it } from 'vitest';
import { buildAvailableRaiseOptions } from '../src/combat/raise-resolution.js';
import {
  backfillArtifactWeaponSpecials,
  mergeWeaponSpecialsIntoSnapshot,
  parkWeaponSpecialsForRaises,
  selectOnHitSpecialEffects,
  weaponSpecialEntries,
} from '../src/utils/weapon-specials.js';
import { artifactToVirtualWeapon } from '../src/utils/unarmed-fallback.js';

describe('weapon specials', () => {
  it('reads artifact refs and conventional strings', () => {
    expect(
      weaponSpecialEntries({
        system: {
          specials: [
            { specialId: 'penetration', value: 4 },
            { specialId: 'precision', value: 2 },
            { specialId: 'finesse' },
          ],
        },
      }).map((s) => s.key),
    ).toEqual(['penetration', 'precision']);
    expect(weaponSpecialEntries({ system: { specials: ['Brutal Impact(3)', '—'] } })).toEqual([
      { key: 'brutal-impact', rank: 3 },
    ]);
  });

  it('adds missing weapon specials to the raise snapshot without doubling an existing rank', () => {
    const merged = mergeWeaponSpecialsIntoSnapshot(
      {
        damageDice: 4,
        specials: [{ key: 'penetration', rank: 2 }],
        rangeM: null,
        aoeRadiusM: null,
        durationSteps: 0,
        hasRange: false,
        hasAoe: false,
        hasDuration: false,
      },
      [
        { key: 'penetration', rank: 4 },
        { key: 'precision', rank: 2 },
      ],
    );
    expect(merged.specials).toEqual([
      { key: 'penetration', rank: 2 },
      { key: 'precision', rank: 2 },
    ]);
    const labels = buildAvailableRaiseOptions(merged, false).map((o) => o.id);
    expect(labels).toContain('damage');
    expect(labels).toContain('special:penetration');
    expect(labels).toContain('special:precision');
  });

  it('keeps the power Special on the hit and parks the weapon Special for a Raise', () => {
    const parked = parkWeaponSpecialsForRaises(
      {
        damageDice: 1,
        specials: [
          { key: 'slow', rank: 6 },
          { key: 'precision', rank: 2 },
        ],
        rangeM: null,
        aoeRadiusM: null,
        durationSteps: 0,
        hasRange: false,
        hasAoe: false,
        hasDuration: false,
      },
      ['slow'],
    );
    expect(parked.onHit.specials).toEqual([{ key: 'slow', rank: 6 }]);
    expect(parked.raiseSource.specials).toEqual([{ key: 'precision', rank: 2 }]);
  });

  it('does not turn a weapon Special on unless the snapshot already lists it', () => {
    expect(
      selectOnHitSpecialEffects([
        { type: 'power-special', effect: 'Penetration(6)' },
        { type: 'weapon', effect: 'Penetration(4)' },
        { type: 'weapon', effect: 'Precision(2)' },
        { type: 'weapon', effect: 'Finesse' },
      ]),
    ).toEqual(['Penetration(6)']);
  });

  it('backfills an empty crossbow artifact from its base type', () => {
    const specials = backfillArtifactWeaponSpecials(
      { baseTypeKey: 'weapon:heavy-crossbow', baseValues: [] },
      [],
    );
    expect(specials).toEqual([
      { specialId: 'penetration', value: 4 },
      { specialId: 'precision', value: 4 },
    ]);
  });

  it('backfills empty artifactWeapon specials from base values when converting to a virtual weapon', () => {
    const weapon = artifactToVirtualWeapon({
      id: 'sword',
      name: 'Moonlight',
      type: 'artifact',
      system: {
        currentLevel: 4,
        baseProfile: 'twoHandedWeapon',
        artifactWeapon: { weaponType: 'melee', damage: '7d8', hands: 2, specials: [] },
        baseValues: [
          { type: 'weaponDamage', label: 'Weapon Damage', value: '7d8' },
          { type: 'weaponSpecial', label: 'Requiem', value: 4 },
        ],
      },
    });
    expect(weapon.system.specials).toEqual([{ specialId: 'requiem', value: 4 }]);
  });
});
