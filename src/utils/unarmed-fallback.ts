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

/** True when an artifact is worn/bound and should contribute its weapon. */
function isArtifactWieldable(item: any): boolean {
  if (!item || item.type !== 'artifact') return false;
  const sys = item.system || {};
  if (sys.equipped === true) return true;
  const binding = String(sys.binding || '').toLowerCase();
  if (binding === 'bound' || binding === 'echo') return true;
  try {
    const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
    if (typeof flagSlot === 'string' && flagSlot.length > 0) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Convert an equipped artifact that carries an `artifactWeapon` profile (e.g.
 * the Dragon Head's bite) into a weapon-shaped object the attack/damage
 * pipeline understands. Returns `null` when the artifact has no weapon profile.
 */
export function artifactToVirtualWeapon(artifact: any): any | null {
  const sys = artifact?.system || {};
  const w = sys.artifactWeapon;
  if (!w) return null;
  const weaponType = w.weaponType === 'ranged' ? 'ranged' : 'melee';
  const specials = Array.isArray(w.specials) ? w.specials : [];
  return {
    id: artifact.id,
    name: artifact.name,
    type: 'weapon',
    system: {
      weaponType,
      damage: String(w.damage || '1d8'),
      range: String(w.range || (weaponType === 'ranged' ? '12m' : '0m')),
      specials,
      equipped: true,
      hands: Number.isFinite(Number(w.hands)) ? Number(w.hands) : 0,
      innateAbilities: Array.isArray(w.innateAbilities) ? w.innateAbilities : [],
      description: sys.description || '',
      equipSlots: [],
      fromArtifact: true,
    },
    flags: { 'mastery-system': { artifactWeaponSourceId: artifact.id } },
  };
}

/** Equipped artifacts (bound/echo/worn) that expose an `artifactWeapon` profile. */
function artifactWeaponCandidates(items: any[]): any[] {
  return items
    .filter((i: any) => i.type === 'artifact' && isArtifactWieldable(i) && (i.system as any)?.artifactWeapon)
    .map((i: any) => artifactToVirtualWeapon(i))
    .filter((w: any): w is any => !!w);
}

/**
 * Resolve equipped weapon for an attack type. Conventional weapons win; an
 * artifact natural weapon (e.g. Dragon Head bite) is used when no conventional
 * weapon of that type is equipped. Melee finally falls back to virtual unarmed;
 * ranged returns null.
 */
export function resolveEquippedWeaponForAttackType(
  items: any[],
  attackType: 'melee' | 'ranged',
): any | null {
  const equippedWeapons = items.filter(
    (i: any) => i.type === 'weapon' && (i.system as any)?.equipped === true,
  );
  const artifactWeapons = artifactWeaponCandidates(items);

  if (attackType === 'ranged') {
    return (
      equippedWeapons.find((w: any) => (w.system as any)?.weaponType === 'ranged') ||
      artifactWeapons.find((w: any) => (w.system as any)?.weaponType === 'ranged') ||
      null
    );
  }

  return (
    equippedWeapons.find((w: any) => (w.system as any)?.weaponType !== 'ranged') ||
    artifactWeapons.find((w: any) => (w.system as any)?.weaponType !== 'ranged') ||
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
