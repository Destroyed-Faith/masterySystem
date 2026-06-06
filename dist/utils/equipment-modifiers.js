/**
 * Equipped-only equipment effects for rolls (initiative, physical skills).
 * Mirrors armor skill-penalty resolution used in item-info-dialog.
 */
import { getArmorDefinitionForType, getShieldDefinitionForType } from './equipment.js';
import { resolveEquippedWeaponForAttackType as resolveEquippedWeaponForAttackTypeWithUnarmed } from './unarmed-fallback.js';
function collectItems(actor) {
    if (!actor?.items)
        return [];
    const items = actor.items;
    if (Array.isArray(items))
        return items;
    if (items instanceof Map)
        return Array.from(items.values());
    if (typeof items.values === 'function')
        return Array.from(items.values());
    return [];
}
export function getEquippedWeapon(actor) {
    for (const item of collectItems(actor)) {
        if (item.type === 'weapon' && item.system?.equipped === true) {
            return item;
        }
    }
    return null;
}
export function getEquippedArmor(actor) {
    for (const item of collectItems(actor)) {
        if (item.type === 'armor' && item.system?.equipped === true) {
            return item;
        }
    }
    return null;
}
export function getEquippedShield(actor) {
    for (const item of collectItems(actor)) {
        if (item.type === 'shield' && item.system?.equipped === true) {
            return item;
        }
    }
    return null;
}
/** Resolved skill-penalty line for armor (item override or type table). */
export function resolveArmorSkillPenaltyText(armorItem) {
    if (!armorItem)
        return '';
    const sys = armorItem.system || {};
    const raw = sys.skillPenalty;
    if (raw != null && String(raw).trim() !== '')
        return String(raw);
    const def = getArmorDefinitionForType(sys.type);
    const t = def?.skillPenalty;
    return t && t !== '—' ? t : '';
}
/** Shield: type table only (no per-item override in template yet). */
export function resolveShieldSkillPenaltyText(shieldItem) {
    if (!shieldItem)
        return '';
    const sys = shieldItem.system || {};
    const raw = sys.skillPenalty;
    if (raw != null && String(raw).trim() !== '')
        return String(raw);
    const def = getShieldDefinitionForType(sys.type);
    const t = def?.skillPenalty;
    return t && t !== '—' ? t : '';
}
/**
 * Count penalty d8 mentioned in armor/shield strings (e.g. "−1d8", "-2d8").
 * Sums all matches in one string; caller sums armor + shield.
 */
export function parsePhysicalSkillPenaltyDiceCount(text) {
    if (!text || text === '—')
        return 0;
    const s = String(text);
    let sum = 0;
    const re = /[−\-]\s*(\d+)\s*d8/gi;
    let m;
    while ((m = re.exec(s)) !== null) {
        sum += parseInt(m[1], 10) || 0;
    }
    return sum;
}
/** Total d8 removed from physical skill pool (armor + shield, equipped only). */
export function getEquippedPhysicalSkillPenaltyDice(actor) {
    const armor = getEquippedArmor(actor);
    const shield = getEquippedShield(actor);
    return (parsePhysicalSkillPenaltyDiceCount(resolveArmorSkillPenaltyText(armor)) +
        parsePhysicalSkillPenaltyDiceCount(resolveShieldSkillPenaltyText(shield)));
}
function initiativeModifierFromArmor(armorItem) {
    if (!armorItem)
        return 0;
    const sys = armorItem.system || {};
    if (sys.initiativeModifier != null && Number.isFinite(Number(sys.initiativeModifier))) {
        return Number(sys.initiativeModifier);
    }
    const def = getArmorDefinitionForType(sys.type);
    const v = def?.initiativeModifier;
    return v != null ? v : 0;
}
function initiativeModifierFromShield(shieldItem) {
    if (!shieldItem)
        return 0;
    const sys = shieldItem.system || {};
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
export function getEquippedWeaponInitiativePenalty(weaponItem) {
    if (!weaponItem || weaponItem.system?.equipped !== true)
        return 0;
    const innates = Array.isArray(weaponItem.system?.innateAbilities)
        ? weaponItem.system.innateAbilities.map((x) => String(x))
        : [];
    const hasHeavy = innates.some((a) => /^\s*heavy\s*$/i.test(a.trim()) || /^heavy$/i.test(a.trim()));
    if (!hasHeavy)
        return 0;
    const hasBalanced = innates.some((a) => /balanced/i.test(a));
    return hasBalanced ? -5 : -10;
}
/** Flat initiative modifier from equipped armor + shield + weapon (Heavy). */
export function getEquippedEquipmentInitiativeModifier(actor) {
    return (initiativeModifierFromArmor(getEquippedArmor(actor)) +
        initiativeModifierFromShield(getEquippedShield(actor)) +
        getEquippedWeaponInitiativePenalty(getEquippedWeapon(actor)));
}
function fmtInitiativeSigned(n) {
    if (n === 0)
        return '0';
    return n > 0 ? `+${n}` : `${n}`;
}
/** Rows for character sheet: how armor / shield / weapon affect initiative (equipped only). */
export function getInitiativeEquipmentRows(actor) {
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
 * Equipped weapon for attack type. Melee falls back to virtual unarmed when
 * nothing is equipped (see `unarmed-fallback.ts`).
 */
export function resolveEquippedWeaponForAttackType(items, attackType) {
    return resolveEquippedWeaponForAttackTypeWithUnarmed(items, attackType);
}
//# sourceMappingURL=equipment-modifiers.js.map