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
    if (item.system?.virtualUnarmed === true)
        return false;
    if (item.getFlag?.('mastery-system', 'virtualUnarmed') === true)
        return false;
    return true;
}
/** True when an artifact is worn/bound and should contribute its weapon. */
function isArtifactWieldable(item) {
    if (!item || item.type !== 'artifact')
        return false;
    const sys = item.system || {};
    if (sys.equipped === true)
        return true;
    const binding = String(sys.binding || '').toLowerCase();
    if (binding === 'bound' || binding === 'echo')
        return true;
    try {
        const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof flagSlot === 'string' && flagSlot.length > 0)
            return true;
    }
    catch {
        /* ignore */
    }
    return false;
}
/**
 * Convert an equipped artifact that carries an `artifactWeapon` profile (e.g.
 * the Dragon Head's bite) into a weapon-shaped object the attack/damage
 * pipeline understands. Returns `null` when the artifact has no weapon profile.
 */
export function artifactToVirtualWeapon(artifact) {
    const sys = artifact?.system || {};
    const w = sys.artifactWeapon;
    if (!w)
        return null;
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
function artifactWeaponCandidates(items) {
    return items
        .filter((i) => i.type === 'artifact' && isArtifactWieldable(i) && i.system?.artifactWeapon)
        .map((i) => artifactToVirtualWeapon(i))
        .filter((w) => !!w);
}
/**
 * Resolve equipped weapon for an attack type. Conventional weapons win; an
 * artifact natural weapon (e.g. Dragon Head bite) is used when no conventional
 * weapon of that type is equipped. Melee finally falls back to virtual unarmed;
 * ranged returns null.
 */
export function resolveEquippedWeaponForAttackType(items, attackType) {
    const equippedWeapons = items.filter((i) => i.type === 'weapon' && i.system?.equipped === true);
    const artifactWeapons = artifactWeaponCandidates(items);
    if (attackType === 'ranged') {
        return (equippedWeapons.find((w) => w.system?.weaponType === 'ranged') ||
            artifactWeapons.find((w) => w.system?.weaponType === 'ranged') ||
            null);
    }
    return (equippedWeapons.find((w) => w.system?.weaponType !== 'ranged') ||
        artifactWeapons.find((w) => w.system?.weaponType !== 'ranged') ||
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