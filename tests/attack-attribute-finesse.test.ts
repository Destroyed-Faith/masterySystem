import { describe, expect, it } from 'vitest';
import { getAttackAttribute, weaponHasFinesse } from '../src/combat/attack-executor.js';
import { artifactToVirtualWeapon } from '../src/utils/unarmed-fallback.js';

describe('artifact Free Trait Finesse', () => {
  const finessePower = {
    source: 'power',
    item: { system: { tree: 'Crusader', isSpell: false } },
  } as any;

  it('reads Finesse from the Free Trait field, not only innate rows', () => {
    const artifact = {
      id: 'moon',
      name: 'Moonlight Greatsword',
      type: 'artifact',
      system: {
        freeTrait: 'Finesse',
        artifactWeapon: { weaponType: 'melee', damage: '5d8', innateAbilities: ['Heavy'] },
        baseProfile: 'twoHandedWeapon',
        currentLevel: 1,
      },
    };
    expect(weaponHasFinesse(artifact)).toBe(true);

    const virtual = artifactToVirtualWeapon(artifact);
    expect(virtual?.system.innateAbilities).toContain('Finesse');
    expect(weaponHasFinesse(virtual)).toBe(true);
    expect(getAttackAttribute({ items: [artifact] }, virtual, finessePower, 'melee')).toBe('agility');
  });

  it('beats a Might mastery tree on weapon-carried attack powers', () => {
    const weapon = {
      type: 'weapon',
      system: { innateAbilities: ['Finesse'], weaponType: 'melee' },
    };
    expect(getAttackAttribute({}, weapon, finessePower, 'melee')).toBe('agility');
  });

  it('resolves the equipped artifact when the caller passes no weapon', () => {
    const artifact = {
      id: 'moon',
      name: 'Moonlight Greatsword',
      type: 'artifact',
      system: {
        equipped: true,
        binding: 'bound',
        freeTrait: 'Finesse',
        artifactWeapon: { weaponType: 'melee', damage: '5d8', innateAbilities: [] },
        baseProfile: 'twoHandedWeapon',
        currentLevel: 1,
      },
    };
    const actor = { items: [artifact] };
    expect(getAttackAttribute(actor, null, finessePower, 'melee')).toBe('agility');
  });

  it('leaves Might in place without Finesse', () => {
    const weapon = {
      type: 'weapon',
      system: { innateAbilities: ['Heavy'], weaponType: 'melee' },
    };
    expect(getAttackAttribute({}, weapon, finessePower, 'melee')).toBe('might');
  });

  it('hard Attack Attribute override beats Default, Finesse, and the power tree', () => {
    const artifact = {
      id: 'moon',
      name: 'Moonlight Greatsword',
      type: 'artifact',
      system: {
        equipped: true,
        binding: 'bound',
        freeTrait: 'Finesse',
        attackAttribute: 'intellect',
        artifactWeapon: { weaponType: 'melee', damage: '5d8', innateAbilities: ['Finesse'] },
        baseProfile: 'twoHandedWeapon',
        currentLevel: 1,
      },
    };
    const virtual = artifactToVirtualWeapon(artifact);
    expect(virtual?.system.attackAttribute).toBe('intellect');
    expect(getAttackAttribute({ items: [artifact] }, virtual, finessePower, 'melee')).toBe('intellect');
    expect(getAttackAttribute({ items: [artifact] }, null, finessePower, 'melee')).toBe('intellect');
  });

  it('Default Attack Attribute keeps the inferred pool', () => {
    const weapon = {
      type: 'weapon',
      system: { innateAbilities: ['Heavy'], attackAttribute: 'default', weaponType: 'melee' },
    };
    expect(getAttackAttribute({}, weapon, finessePower, 'melee')).toBe('might');
  });
});
