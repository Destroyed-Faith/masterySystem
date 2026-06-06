/**
 * Virtual unarmed weapon — no inventory item required.
 *
 * When a character has no equipped weapon, melee attacks use these stats
 * automatically (Players Guide: unarmed = inherent, not an item).
 */
export const VIRTUAL_UNARMED_WEAPON_ID = '__mastery_virtual_unarmed__';
/** Canonical virtual weapon shape (compatible with damage / attack resolution). */
export function createVirtualUnarmedWeapon() {
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
export function isVirtualUnarmedWeapon(item) {
    if (!item)
        return false;
    if (item.id === VIRTUAL_UNARMED_WEAPON_ID)
        return true;
    if (item.system?.virtualUnarmed === true)
        return true;
    return item.getFlag?.('mastery-system', 'virtualUnarmed') === true;
}
/** True for embedded items named "Unarmed" that were auto-seeded (legacy). */
export function isLegacyUnarmedItem(item) {
    if (!item || item.type !== 'weapon')
        return false;
    if (String(item.name || '').trim().toLowerCase() !== 'unarmed')
        return false;
    const sys = item.system || {};
    const dmg = String(sys.damage ?? sys.weaponDamage ?? '').trim();
    return dmg === '1d8' || dmg === '1';
}
/**
 * Resolve equipped weapon for an attack type. Melee falls back to the virtual
 * unarmed profile when nothing is equipped; ranged returns null.
 */
export function resolveEquippedWeaponForAttackType(items, attackType) {
    const equippedWeapons = items.filter((i) => i.type === 'weapon' && i.system?.equipped === true);
    if (equippedWeapons.length === 0) {
        return attackType === 'melee' ? createVirtualUnarmedWeapon() : null;
    }
    if (attackType === 'ranged') {
        return equippedWeapons.find((w) => w.system?.weaponType === 'ranged') || null;
    }
    return (equippedWeapons.find((w) => w.system?.weaponType !== 'ranged') ||
        createVirtualUnarmedWeapon());
}
/** After weapon-id lookup fails, apply virtual unarmed for player melee attacks. */
export function applyMeleeUnarmedFallback(weapon, attackType) {
    if (weapon)
        return weapon;
    if (attackType === 'ranged')
        return null;
    return createVirtualUnarmedWeapon();
}
//# sourceMappingURL=unarmed-fallback.js.map