/**
 * Virtual unarmed weapon — no inventory item required.
 *
 * When a character has no equipped weapon, melee attacks use these stats
 * automatically (Players Guide: unarmed = inherent, not an item).
 */

export const VIRTUAL_UNARMED_WEAPON_ID = '__mastery_virtual_unarmed__';

/** Canonical virtual weapon shape (compatible with damage / attack resolution). */
export function createVirtualUnarmedWeapon(): {
  id: string;
  name: string;
  type: 'weapon';
  system: {
    weaponType: 'melee';
    damage: string;
    range: string;
    specials: string[];
    equipped: boolean;
    hands: number;
    innateAbilities: string[];
    description: string;
    equipSlots: string[];
    virtualUnarmed: true;
  };
  flags: Record<string, unknown>;
} {
  return {
    id: VIRTUAL_UNARMED_WEAPON_ID,
    name: 'Unarmed',
    type: 'weapon',
    system: {
      weaponType: 'melee',
      damage: '1d8',
      range: '0m',
      specials: [],
      equipped: true,
      hands: 1,
      innateAbilities: [],
      description: 'Basic unarmed strikes using fists, feet, or natural weapons.',
      equipSlots: ['mainhand'],
      virtualUnarmed: true,
    },
    flags: { 'mastery-system': { virtualUnarmed: true } },
  };
}

export function isVirtualUnarmedWeapon(item: any | null | undefined): boolean {
  if (!item) return false;
  if (item.id === VIRTUAL_UNARMED_WEAPON_ID) return true;
  if (item.system?.virtualUnarmed === true) return true;
  return item.getFlag?.('mastery-system', 'virtualUnarmed') === true;
}

/** True for embedded items named "Unarmed" that were auto-seeded (legacy). */
export function isLegacyUnarmedItem(item: any): boolean {
  if (!item || item.type !== 'weapon') return false;
  if (String(item.name || '').trim().toLowerCase() !== 'unarmed') return false;
  if (item.system?.virtualUnarmed === true) return false;
  if (item.getFlag?.('mastery-system', 'virtualUnarmed') === true) return false;
  return true;
}

/**
 * Resolve equipped weapon for an attack type. Melee falls back to the virtual
 * unarmed profile when nothing is equipped; ranged returns null.
 */
export function resolveEquippedWeaponForAttackType(
  items: any[],
  attackType: 'melee' | 'ranged',
): any | null {
  const equippedWeapons = items.filter(
    (i: any) => i.type === 'weapon' && (i.system as any)?.equipped === true,
  );
  if (equippedWeapons.length === 0) {
    return attackType === 'melee' ? createVirtualUnarmedWeapon() : null;
  }

  if (attackType === 'ranged') {
    return equippedWeapons.find((w: any) => (w.system as any)?.weaponType === 'ranged') || null;
  }

  return (
    equippedWeapons.find((w: any) => (w.system as any)?.weaponType !== 'ranged') ||
    createVirtualUnarmedWeapon()
  );
}

/** After weapon-id lookup fails, apply virtual unarmed for player melee attacks. */
export function applyMeleeUnarmedFallback(
  weapon: any | null | undefined,
  attackType: 'melee' | 'ranged' | undefined,
): any | null {
  if (weapon) return weapon;
  if (attackType === 'ranged') return null;
  return createVirtualUnarmedWeapon();
}
