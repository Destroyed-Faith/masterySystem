/**
 * Weapon-property automation (Players Guide "Weapon Properties").
 *
 *   • Versatile — wielded two-handed: +2d8 weapon damage.
 *   • Set — did not move this round: +1d8 weapon damage.
 *   • Defensive — wielded two-handed: +Mastery Rank Evade (max +6).
 *   • Light — may be wielded in the off-hand.
 *   • Load — after firing the weapon is Unloaded; reload = 1 Attack Action
 *     (or Quick Load via Movement, capped at MR per turn).
 */

import { getItemEquipmentFlags, isNaturallyTwoHandedItem } from './weapon-sets.js';

const FLAG_SCOPE = 'mastery-system';
const FLAG_UNLOADED = 'weaponUnloaded';

/** Innate-ability strings on a weapon item (catalog `innateAbilities`). */
export function weaponInnates(item: any): string[] {
  const raw = item?.system?.innateAbilities;
  if (!Array.isArray(raw)) return [];
  return raw.map((a: unknown) => String(a ?? '').trim()).filter(Boolean);
}

/** True when one innate line starts with the given property name. */
export function hasWeaponProperty(item: any, property: string): boolean {
  const p = property.toLowerCase();
  return weaponInnates(item).some((a) => a.toLowerCase().startsWith(p));
}

export function isLightWeapon(item: any): boolean {
  return item?.type === 'weapon' && hasWeaponProperty(item, 'light');
}

/** Naturally two-handed, or a Versatile weapon gripped two-handed. */
export function isWieldedTwoHanded(item: any): boolean {
  if (!item) return false;
  if (isNaturallyTwoHandedItem(item)) return true;
  return getItemEquipmentFlags(item).twoHanded === true;
}

/** Versatile: +2d8 weapon damage while wielded two-handed. */
export function versatileBonusDice(weapon: any): number {
  if (!weapon || !hasWeaponProperty(weapon, 'versatile')) return 0;
  return isWieldedTwoHanded(weapon) ? 2 : 0;
}

/**
 * Set: +1d8 weapon damage when the wielder did not move this round.
 * Uses the per-turn movement tracker flag (`movedThisTurnM`); outside combat
 * the bonus does not apply (no round structure to measure against).
 */
export function setBonusDice(actor: any, weapon: any): number {
  if (!weapon || !hasWeaponProperty(weapon, 'set')) return 0;
  const combat = (globalThis as any).game?.combat;
  if (!combat?.started) return 0;
  const moved = Number(actor?.getFlag?.(FLAG_SCOPE, 'movedThisTurnM') ?? 0);
  return moved > 0 ? 0 : 1;
}

/** Defensive: +MR Evade (max +6) while wielding the weapon two-handed. */
export function defensiveEvadeBonus(actor: any, weapon: any): number {
  if (!weapon || !hasWeaponProperty(weapon, 'defensive')) return 0;
  if (!isWieldedTwoHanded(weapon)) return 0;
  const mr = Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
  return Math.min(mr, 6);
}

/* ------------------------------------------------------------------ */
/* Load / Unloaded state                                               */
/* ------------------------------------------------------------------ */

/** True when the weapon has the Load property (Light/Heavy Crossbow). */
export function hasLoadProperty(item: any): boolean {
  return hasWeaponProperty(item, 'load');
}

/** True when a Load weapon is currently Unloaded and cannot fire. */
export function isWeaponUnloaded(item: any): boolean {
  if (!hasLoadProperty(item)) return false;
  const flag =
    item?.getFlag?.(FLAG_SCOPE, FLAG_UNLOADED) ??
    item?.flags?.[FLAG_SCOPE]?.[FLAG_UNLOADED];
  return flag === true;
}

/** Mark a Load weapon as Unloaded (after it fires). */
export async function markWeaponUnloaded(item: any): Promise<void> {
  if (!hasLoadProperty(item)) return;
  await item?.setFlag?.(FLAG_SCOPE, FLAG_UNLOADED, true);
}

/** Reload a Load weapon (Attack-Action reload or Quick Load). */
export async function markWeaponLoaded(item: any): Promise<void> {
  if (item?.getFlag?.(FLAG_SCOPE, FLAG_UNLOADED)) {
    await item.unsetFlag(FLAG_SCOPE, FLAG_UNLOADED);
  }
}
