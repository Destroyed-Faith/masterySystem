/**
 * Virtual unarmed weapon — no inventory item required.
 *
 * When a character has no equipped weapon, melee attacks use these stats
 * automatically (Players Guide: unarmed = inherent, not an item).
 */

import { deriveArtifactWeaponDamage } from './artifact-base-derive.js';
import { resolveArtifactWeaponKind, weaponBasicsForProfile } from './artifact-rules.js';
import { backfillArtifactWeaponSpecials } from './weapon-specials.js';
import { peekWeaponSets } from './weapon-sets.js';

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

function artifactLevel(sys: Record<string, unknown>): number {
  return Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));
}

/**
 * True when a wieldable artifact is an actual attack weapon.
 * Body armor (Serpent Scales, etc.) must never count — a stale empty
 * `artifactWeapon: {}` blob used to look "truthy" and fall back to 1d8.
 */
export function artifactCarriesWeaponProfile(artifact: any): boolean {
  const sys = artifact?.system || {};
  const level = artifactLevel(sys);
  if (deriveArtifactWeaponDamage(sys.baseProfile, level) != null) return true;
  // Non-weapon profiles (bodyArmor, robe, …) never become attack weapons.
  if (!weaponBasicsForProfile(sys.baseProfile)) return false;
  const dmg = sys.artifactWeapon?.damage;
  return typeof dmg === 'string' && dmg.trim().length > 0;
}

/**
 * Convert an equipped artifact that carries weapon damage into a weapon-shaped
 * object the attack/damage pipeline understands. Falls back to `baseProfile`
 * derivation when the baked `artifactWeapon` blob is absent (common on bound
 * general artifacts such as the Moonlight Greatsword).
 */
export function artifactToVirtualWeapon(artifact: any): any | null {
  if (!artifactCarriesWeaponProfile(artifact)) return null;
  const sys = artifact?.system || {};
  const level = artifactLevel(sys);
  const w = sys.artifactWeapon;
  const derived = deriveArtifactWeaponDamage(sys.baseProfile, level);
  const baked =
    typeof w?.damage === 'string' && w.damage.trim().length > 0 ? w.damage.trim() : '';
  const damage = derived ?? (baked || null);
  if (!damage) return null;

  const weaponType = resolveArtifactWeaponKind(w, sys.baseProfile);
  const basics = weaponBasicsForProfile(sys.baseProfile);
  const specials = backfillArtifactWeaponSpecials(sys, Array.isArray(w?.specials) ? w.specials : []);
  const innateAbilities = Array.isArray(w?.innateAbilities)
    ? w.innateAbilities.map((x: unknown) => String(x))
    : [];
  const freeTrait = String(sys.freeTrait || '').trim();
  if (freeTrait && !innateAbilities.some((a: string) => a.trim() === freeTrait)) {
    innateAbilities.push(freeTrait);
  }

  return {
    id: artifact.id,
    name: artifact.name,
    type: 'weapon',
    system: {
      weaponType,
      damage,
      range: String(w?.range || (weaponType === 'ranged' ? '12m' : '0m')),
      specials,
      equipped: true,
      hands: Number.isFinite(Number(w?.hands)) ? Number(w.hands) : (basics?.hands ?? 0),
      innateAbilities,
      freeTrait,
      attackAttribute: String(sys.attackAttribute || '').trim(),
      description: sys.description || '',
      equipSlots: [],
      fromArtifact: true,
    },
    flags: { 'mastery-system': { artifactWeaponSourceId: artifact.id } },
  };
}

/** Equipped artifacts (bound/echo/worn) that expose weapon damage. */
function artifactWeaponCandidates(items: any[]): any[] {
  return items
    .filter((i: any) => i.type === 'artifact' && isArtifactWieldable(i) && artifactCarriesWeaponProfile(i))
    .map((i: any) => artifactToVirtualWeapon(i))
    .filter((w: any): w is any => !!w);
}

/** Real equipped melee weapon — not virtual or legacy auto-seeded Unarmed. */
function isConventionalMeleeWeapon(item: any): boolean {
  if (!item || item.type !== 'weapon') return false;
  if (isVirtualUnarmedWeapon(item) || isLegacyUnarmedItem(item)) return false;
  return (item.system as any)?.weaponType !== 'ranged';
}

function itemMatchesAttackType(weaponLike: any, attackType: 'melee' | 'ranged'): boolean {
  const kind = (weaponLike?.system as any)?.weaponType === 'ranged' ? 'ranged' : 'melee';
  return kind === attackType;
}

/**
 * Prefer the active Weapon Set main-hand (Claws / Tails / set weapon) over any
 * leftover equipped conventional item. Echo-bound artifacts can stay equipped
 * after a swap; without this, a stale 1d8 weapon often wins over 6d8 Claws.
 *
 * Returns `undefined` when the actor has no set guidance (caller falls through).
 */
function tryResolveActiveSetWeapon(
  actor: any,
  attackType: 'melee' | 'ranged',
): any | null | undefined {
  if (!actor) return undefined;
  try {
    const state = peekWeaponSets(actor);
    if (state.stowed) {
      return attackType === 'melee' ? createVirtualUnarmedWeapon() : null;
    }
    const mainId = state.sets?.[state.active]?.mainhand;
    // Empty set: do not force Unarmed — fall through so bound/echo artifacts
    // (and equipped weapons) still resolve when sets were never filled.
    if (!mainId) return undefined;

    let main: any = null;
    if (typeof actor.items?.get === 'function') {
      main = actor.items.get(mainId) ?? null;
    }
    if (!main && Array.isArray(actor.items)) {
      main = actor.items.find((i: any) => String(i?.id) === String(mainId)) ?? null;
    }
    if (!main && actor.items?.values) {
      main =
        Array.from(actor.items.values()).find((i: any) => String(i?.id) === String(mainId)) ?? null;
    }
    if (!main) return undefined;

    if (main.type === 'artifact') {
      const vw = artifactToVirtualWeapon(main);
      if (!vw) return undefined;
      return itemMatchesAttackType(vw, attackType) ? vw : undefined;
    }
    if (main.type === 'weapon') {
      // Seeded Unarmed in a provisional set must not block bound artifacts.
      if (isLegacyUnarmedItem(main) || isVirtualUnarmedWeapon(main)) return undefined;
      return itemMatchesAttackType(main, attackType) ? main : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve equipped weapon for an attack type.
 * When `actor` is provided, the active Weapon Set main-hand wins (matches UI).
 * Otherwise conventional weapons win; an artifact natural weapon is used when
 * no conventional weapon of that type is equipped. Melee finally falls back to
 * virtual unarmed; ranged returns null.
 */
export function resolveEquippedWeaponForAttackType(
  items: any[],
  attackType: 'melee' | 'ranged',
  actor?: any,
): any | null {
  const fromSet = tryResolveActiveSetWeapon(actor, attackType);
  if (fromSet !== undefined) return fromSet;

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

  const conventionalMelee = equippedWeapons.find(isConventionalMeleeWeapon);
  if (conventionalMelee) return conventionalMelee;

  const artifactMelee = artifactWeapons.find((w: any) => (w.system as any)?.weaponType !== 'ranged');
  if (artifactMelee) return artifactMelee;

  return createVirtualUnarmedWeapon();
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
