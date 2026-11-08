/**
 * K8 Artifact Delivery Unification
 *
 * Artifacts may support any Delivery the wielder already has. Delivery damage
 * contributes once (no WD+SF double-count). Mundane equipment unchanged.
 * Special-only Attacks never receive delivery damage.
 */
import { describe, expect, it } from 'vitest';
import {
  getSpellDeliveryBonusDice,
  listArtifactDeliveryDamageSources,
  listSpellDeliveryDamageSources,
  resolveArtifactItemDeliveryContribution,
  resolveMartialArtifactWeaponFormula,
} from '../src/combat/artifact-delivery-damage.js';
import {
  isSpecialOnlyAttack,
  martialWeaponDamageApplies,
  spellFocusDamageApplies,
} from '../src/combat/damage-transfer.js';
import {
  artifactCarriesWeaponProfile,
  artifactToVirtualWeapon,
} from '../src/utils/unarmed-fallback.js';
import { artifactIsSpellFocusOnly } from '../src/utils/artifact-rules.js';
import { getActorSpellFocusBonusDice, listActorSpellFocusSources } from '../src/utils/artifact-base-values.js';

function greatswordArtifact(level: number, opts?: { withFocus?: boolean }) {
  const baseValues: any[] = [
    { slot: 'a', type: 'weaponDamage', value: `${4 + level}d8` },
  ];
  if (opts?.withFocus) {
    baseValues.push({ slot: 'b', type: 'spellFocus', value: 4 });
  }
  return {
    id: 'gs-1',
    type: 'artifact',
    name: 'Moonlight Greatsword',
    system: {
      equipped: true,
      currentLevel: level,
      baseProfile: 'twoHandedWeapon',
      artifactKind: 'weapon',
      slot: 'mainHand',
      paperdollSlots: ['mainhand', 'offhand'],
      artifactWeapon: { damage: `${4 + level}d8`, weaponType: 'melee', hands: 2 },
      baseValues,
    },
  };
}

function staffFocusOnly(level: number) {
  const dice = 2 + level; // mirrors Staff L1=3 … style; tests pin explicit value
  return {
    id: 'staff-1',
    type: 'artifact',
    name: 'Staff of the Dark',
    system: {
      equipped: true,
      currentLevel: level,
      baseProfile: 'custom',
      artifactKind: 'gear',
      slot: 'mainHand',
      paperdollSlots: ['mainhand', 'offhand'],
      baseValues: [
        { slot: 'a', type: 'spellFocus', label: 'Spell Focus Bonus', value: `+${dice}d8` },
      ],
    },
  };
}

function ringNoDamage() {
  return {
    id: 'ring-1',
    type: 'artifact',
    name: 'Ring of Kept Names',
    system: {
      equipped: true,
      currentLevel: 1,
      baseProfile: 'ring',
      slot: 'ring',
      baseValues: [{ slot: 'a', type: 'minorFeature', label: 'Names', value: 0 }],
    },
  };
}

function mundaneSword() {
  return {
    id: 'sword-1',
    type: 'weapon',
    name: 'Longsword',
    system: {
      equipped: true,
      weaponType: 'melee',
      damage: '2d8',
      innateAbilities: [],
    },
  };
}

function mundaneWand() {
  return {
    id: 'wand-1',
    type: 'weapon',
    name: 'Wand',
    system: {
      equipped: true,
      weaponType: 'melee',
      damage: '1d8',
      innateAbilities: ['Spell Focus (+2d8)'],
    },
  };
}

describe('Artifact Delivery Unification — contribution resolution', () => {
  it('1. Greatsword Artifact contributes Weapon Damage for Martial Delivery', () => {
    const gs = greatswordArtifact(1);
    const c = resolveArtifactItemDeliveryContribution(gs, 'martial');
    expect(c?.kind).toBe('weaponDamage');
    expect(c?.dice).toBe(5);
    expect(c?.formula).toBe('5d8');
    expect(resolveMartialArtifactWeaponFormula(gs)).toBe('5d8');
  });

  it('2. Same Greatsword supports Spell Delivery via Weapon Damage when Focus is locked', () => {
    const gs = greatswordArtifact(1); // SF unlocks at L4 in catalogue; absent here
    const c = resolveArtifactItemDeliveryContribution(gs, 'spell');
    expect(c?.kind).toBe('weaponDamage');
    expect(c?.dice).toBe(5);
    const actor = { items: [gs] };
    expect(listSpellDeliveryDamageSources(actor)).toEqual([
      { name: 'Moonlight Greatsword', dice: 5 },
    ]);
    expect(getSpellDeliveryBonusDice(actor)).toBe(5);
    expect(getActorSpellFocusBonusDice(actor)).toBe(5);
  });

  it('3. Spell Focus Artifact supports Martial Delivery via Focus dice', () => {
    const staff = staffFocusOnly(5);
    expect(artifactIsSpellFocusOnly(staff.system)).toBe(true);
    const c = resolveArtifactItemDeliveryContribution(staff, 'martial');
    expect(c?.kind).toBe('spellFocus');
    expect(c?.dice).toBe(7);
    expect(c?.formula).toBe('7d8');
    expect(artifactCarriesWeaponProfile(staff)).toBe(true);
    const vw = artifactToVirtualWeapon(staff);
    expect(vw?.system.damage).toBe('7d8');
    expect(vw?.system.fromArtifact).toBe(true);
  });

  it('4. Artifact with no delivery damage contributes nothing', () => {
    const ring = ringNoDamage();
    expect(resolveArtifactItemDeliveryContribution(ring, 'martial')).toBeNull();
    expect(resolveArtifactItemDeliveryContribution(ring, 'spell')).toBeNull();
    expect(artifactCarriesWeaponProfile(ring)).toBe(false);
    expect(listArtifactDeliveryDamageSources({ items: [ring] }, 'spell')).toEqual([]);
  });

  it('5. Special-only Attack never receives delivery damage gates', () => {
    expect(
      isSpecialOnlyAttack({
        specialOnly: true,
        templateId: 'active-ranged-instant-special-t5',
      }),
    ).toBe(true);
    expect(
      martialWeaponDamageApplies({
        specialOnly: true,
        ignoreWeaponDamage: true,
        powerIsSpell: false,
      }),
    ).toBe(false);
    expect(
      spellFocusDamageApplies({
        isSpell: true,
        specialOnly: true,
        templateId: 'active-ranged-instant-special-t5',
      }),
    ).toBe(false);
  });

  it('6. Never double-counts Weapon Damage and Spell Focus from the same Artifact', () => {
    const gs = greatswordArtifact(4, { withFocus: true });
    const martial = resolveArtifactItemDeliveryContribution(gs, 'martial');
    const spell = resolveArtifactItemDeliveryContribution(gs, 'spell');
    expect(martial?.kind).toBe('weaponDamage');
    expect(martial?.dice).toBe(8);
    expect(spell?.kind).toBe('spellFocus');
    expect(spell?.dice).toBe(4);
    // Spell path uses Focus only — never WD+SF together
    expect(getSpellDeliveryBonusDice({ items: [gs] })).toBe(4);
    expect(getSpellDeliveryBonusDice({ items: [gs] })).not.toBe(8 + 4);
    expect(listSpellDeliveryDamageSources({ items: [gs] })).toHaveLength(1);
  });

  it('7. Spell delivery without character Spell access is not invented here — gates stay on power authorship; empty actor yields 0', () => {
    expect(getSpellDeliveryBonusDice({ items: [] })).toBe(0);
    expect(
      spellFocusDamageApplies({ isSpell: false }),
    ).toBe(false);
  });

  it('8. Mundane equipment restrictions unchanged', () => {
    const sword = mundaneSword();
    const wand = mundaneWand();
    // Mundane sword is not an Artifact contribution
    expect(resolveArtifactItemDeliveryContribution(sword, 'martial')).toBeNull();
    expect(resolveArtifactItemDeliveryContribution(sword, 'spell')).toBeNull();
    // Mundane wand still contributes printed Spell Focus innate only on spell path
    const actor = { items: [sword, wand] };
    expect(listSpellDeliveryDamageSources(actor)).toEqual([{ name: 'Wand', dice: 2 }]);
    expect(listActorSpellFocusSources(actor)).toEqual([{ name: 'Wand', dice: 2 }]);
    // Mundane sword does not become Spell delivery damage
    expect(listSpellDeliveryDamageSources({ items: [sword] })).toEqual([]);
  });

  it('9. Chat-facing sources expose Artifact name and dice for Spell delivery', () => {
    const staff = staffFocusOnly(1);
    const sources = listActorSpellFocusSources({ items: [staff] });
    expect(sources).toEqual([{ name: 'Staff of the Dark', dice: 3 }]);
  });

  it('10. Multiple independent Artifacts each contribute once', () => {
    const gs = greatswordArtifact(1);
    const staff = staffFocusOnly(1);
    const sources = listSpellDeliveryDamageSources({ items: [gs, staff] });
    expect(sources).toHaveLength(2);
    expect(sources.find((s) => s.name === 'Moonlight Greatsword')?.dice).toBe(5);
    expect(sources.find((s) => s.name === 'Staff of the Dark')?.dice).toBe(3);
    expect(getSpellDeliveryBonusDice({ items: [gs, staff] })).toBe(8);
  });

  it('11. Existing Focus-only Staff data remains classified and reload-compatible', () => {
    const staff = staffFocusOnly(3);
    expect(artifactIsSpellFocusOnly(staff.system)).toBe(true);
    // Spell path still uses Focus
    expect(resolveArtifactItemDeliveryContribution(staff, 'spell')?.dice).toBe(5);
    // Martial path now reuses the same Focus dice (no new schema fields)
    expect(resolveArtifactItemDeliveryContribution(staff, 'martial')?.dice).toBe(5);
  });

  it('12. Instant Damage AoE Spell still eligible for Focus; Special-only Instant AoE is not', () => {
    expect(
      spellFocusDamageApplies({
        isSpell: true,
        instantAoe: true,
        aoeMeleeWeapon: true,
      }),
    ).toBe(true);
    expect(
      spellFocusDamageApplies({
        isSpell: true,
        instantAoe: true,
        specialOnly: true,
        templateId: 'active-ranged-aoe-damage-t5',
      }),
    ).toBe(false);
    expect(
      martialWeaponDamageApplies({
        powerIsSpell: true,
        ignoreWeaponDamage: true,
        instantAoe: true,
      }),
    ).toBe(false);
  });
});
