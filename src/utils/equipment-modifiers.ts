/**
 * Equipped-only equipment effects for rolls (initiative, physical skills).
 * Mirrors armor skill-penalty resolution used in item-info-dialog.
 */

import { getArmorDefinitionForType, getShieldDefinitionForType } from './equipment.js';

function collectItems(actor: any): any[] {
  if (!actor?.items) return [];
  const items = actor.items;
  if (Array.isArray(items)) return items;
  if (items instanceof Map) return Array.from(items.values());
  if (typeof items.values === 'function') return Array.from(items.values());
  return [];
}

export function getEquippedWeapon(actor: any): any | null {
  for (const item of collectItems(actor)) {
    if (item.type === 'weapon' && (item.system as any)?.equipped === true) {
      return item;
    }
  }
  return null;
}

export function getEquippedArmor(actor: any): any | null {
  for (const item of collectItems(actor)) {
    if (item.type === 'armor' && (item.system as any)?.equipped === true) {
      return item;
    }
  }
  return null;
}

export function getEquippedShield(actor: any): any | null {
  for (const item of collectItems(actor)) {
    if (item.type === 'shield' && (item.system as any)?.equipped === true) {
      return item;
    }
  }
  return null;
}

/** Resolved skill-penalty line for armor (item override or type table). */
export function resolveArmorSkillPenaltyText(armorItem: any): string {
  if (!armorItem) return '';
  const sys: any = armorItem.system || {};
  const raw = sys.skillPenalty;
  if (raw != null && String(raw).trim() !== '') return String(raw);
  const def = getArmorDefinitionForType(sys.type);
  const t = def?.skillPenalty;
  return t && t !== '—' ? t : '';
}

/** Shield: type table only (no per-item override in template yet). */
export function resolveShieldSkillPenaltyText(shieldItem: any): string {
  if (!shieldItem) return '';
  const sys: any = shieldItem.system || {};
  const raw = sys.skillPenalty;
  if (raw != null && String(raw).trim() !== '') return String(raw);
  const def = getShieldDefinitionForType(sys.type);
  const t = def?.skillPenalty;
  return t && t !== '—' ? t : '';
}

/**
 * Count penalty d8 mentioned in armor/shield strings (e.g. "−1d8", "-2d8").
 * Sums all matches in one string; caller sums armor + shield.
 */
export function parsePhysicalSkillPenaltyDiceCount(text: string): number {
  if (!text || text === '—') return 0;
  const s = String(text);
  let sum = 0;
  const re = /[−\-]\s*(\d+)\s*d8/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    sum += parseInt(m[1], 10) || 0;
  }
  return sum;
}

/** Total d8 removed from physical skill pool (armor + shield, equipped only). */
export function getEquippedPhysicalSkillPenaltyDice(actor: any): number {
  const armor = getEquippedArmor(actor);
  const shield = getEquippedShield(actor);
  return (
    parsePhysicalSkillPenaltyDiceCount(resolveArmorSkillPenaltyText(armor)) +
    parsePhysicalSkillPenaltyDiceCount(resolveShieldSkillPenaltyText(shield))
  );
}

function initiativeModifierFromArmor(armorItem: any): number {
  if (!armorItem) return 0;
  const sys: any = armorItem.system || {};
  if (sys.initiativeModifier != null && Number.isFinite(Number(sys.initiativeModifier))) {
    return Number(sys.initiativeModifier);
  }
  const def = getArmorDefinitionForType(sys.type);
  const v = def?.initiativeModifier;
  return v != null ? v : 0;
}

function initiativeModifierFromShield(shieldItem: any): number {
  if (!shieldItem) return 0;
  const sys: any = shieldItem.system || {};
  if (sys.initiativeModifier != null && Number.isFinite(Number(sys.initiativeModifier))) {
    return Number(sys.initiativeModifier);
  }
  const def = getShieldDefinitionForType(sys.type);
  const v = def?.initiativeModifier;
  return v != null ? v : 0;
}

/**
 * Heavy weapon: −10 to initiative; with Balanced, −5 instead.
 */
export function getEquippedWeaponInitiativePenalty(weaponItem: any): number {
  if (!weaponItem || (weaponItem.system as any)?.equipped !== true) return 0;
  const innates: string[] = Array.isArray((weaponItem.system as any)?.innateAbilities)
    ? (weaponItem.system as any).innateAbilities.map((x: unknown) => String(x))
    : [];
  const hasHeavy = innates.some((a) => /^\s*heavy\s*$/i.test(a.trim()) || /^heavy$/i.test(a.trim()));
  if (!hasHeavy) return 0;
  const hasBalanced = innates.some((a) => /balanced/i.test(a));
  return hasBalanced ? -5 : -10;
}

/** Flat initiative modifier from equipped armor + shield + weapon (Heavy). */
export function getEquippedEquipmentInitiativeModifier(actor: any): number {
  return (
    initiativeModifierFromArmor(getEquippedArmor(actor)) +
    initiativeModifierFromShield(getEquippedShield(actor)) +
    getEquippedWeaponInitiativePenalty(getEquippedWeapon(actor))
  );
}

function fmtInitiativeSigned(n: number): string {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : `${n}`;
}

/** Rows for character sheet: how armor / shield / weapon affect initiative (equipped only). */
export function getInitiativeEquipmentRows(actor: any): Array<{
  label: string;
  detail: string;
  value: number;
  display: string;
}> {
  const armor = getEquippedArmor(actor);
  const shield = getEquippedShield(actor);
  const weapon = getEquippedWeapon(actor);
  const av = initiativeModifierFromArmor(armor);
  const sv = initiativeModifierFromShield(shield);
  const wv = weapon ? getEquippedWeaponInitiativePenalty(weapon) : 0;

  return [
    {
      label: 'Armor',
      detail: armor?.name ?? 'Not equipped',
      value: av,
      display: armor ? fmtInitiativeSigned(av) : '—'
    },
    {
      label: 'Shield',
      detail: shield?.name ?? 'Not equipped',
      value: sv,
      display: shield ? fmtInitiativeSigned(sv) : '—'
    },
    {
      label: 'Weapon',
      detail: weapon ? (wv !== 0 ? `${weapon.name} (Heavy)` : weapon.name) : 'Not equipped',
      value: wv,
      display: weapon ? fmtInitiativeSigned(wv) : '—'
    }
  ];
}

/**
 * Strict equipped-only weapon for attack type (no unequipped / name fallbacks).
 * Multiple equipped weapons should not occur (preUpdateItem enforces one per type).
 */
export function resolveEquippedWeaponForAttackType(
  items: any[],
  attackType: 'melee' | 'ranged'
): any | null {
  const equippedWeapons = items.filter(
    (i: any) => i.type === 'weapon' && (i.system as any)?.equipped === true
  );
  if (equippedWeapons.length === 0) return null;

  if (attackType === 'ranged') {
    return equippedWeapons.find((w: any) => (w.system as any)?.weaponType === 'ranged') || null;
  }

  return (
    equippedWeapons.find((w: any) => (w.system as any)?.weaponType !== 'ranged') || null
  );
}
