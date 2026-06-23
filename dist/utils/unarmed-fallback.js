/**
 * Virtual unarmed weapon — no inventory item required.
 *
 * When a character has no equipped weapon, melee attacks use these stats
 * automatically (Players Guide: unarmed = inherent, not an item).
 */
import { deriveArtifactWeaponDamage } from './artifact-base-derive.js';
import { resolveArtifactWeaponKind, weaponBasicsForProfile } from './artifact-rules.js';
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
function artifactLevel(sys) {
    return Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));
}
/** True when a wieldable artifact contributes weapon damage (profile or derived). */
export function artifactCarriesWeaponProfile(artifact) {
    const sys = artifact?.system || {};
    if (sys.artifactWeapon)
        return true;
    return deriveArtifactWeaponDamage(sys.baseProfile, artifactLevel(sys)) != null;
}
/**
 * Convert an equipped artifact that carries weapon damage into a weapon-shaped
 * object the attack/damage pipeline understands. Falls back to `baseProfile`
 * derivation when the baked `artifactWeapon` blob is absent (common on bound
 * general artifacts such as the Moonlight Greatsword).
 */
export function artifactToVirtualWeapon(artifact) {
    const sys = artifact?.system || {};
    const level = artifactLevel(sys);
    const w = sys.artifactWeapon;
    const derived = deriveArtifactWeaponDamage(sys.baseProfile, level);
    if (!w && !derived)
        return null;
    const weaponType = resolveArtifactWeaponKind(w, sys.baseProfile);
    const basics = weaponBasicsForProfile(sys.baseProfile);
    const specials = Array.isArray(w?.specials) ? w.specials : [];
    const damage = derived ??
        (typeof w?.damage === 'string' && w.damage.trim().length > 0 ? w.damage.trim() : '1d8');
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
            innateAbilities: Array.isArray(w?.innateAbilities) ? w.innateAbilities : [],
            description: sys.description || '',
            equipSlots: [],
            fromArtifact: true,
        },
        flags: { 'mastery-system': { artifactWeaponSourceId: artifact.id } },
    };
}
/** Equipped artifacts (bound/echo/worn) that expose weapon damage. */
function artifactWeaponCandidates(items) {
    return items
        .filter((i) => i.type === 'artifact' && isArtifactWieldable(i) && artifactCarriesWeaponProfile(i))
        .map((i) => artifactToVirtualWeapon(i))
        .filter((w) => !!w);
}
/** Real equipped melee weapon — not virtual or legacy auto-seeded Unarmed. */
function isConventionalMeleeWeapon(item) {
    if (!item || item.type !== 'weapon')
        return false;
    if (isVirtualUnarmedWeapon(item) || isLegacyUnarmedItem(item))
        return false;
    return item.system?.weaponType !== 'ranged';
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
    const conventionalMelee = equippedWeapons.find(isConventionalMeleeWeapon);
    if (conventionalMelee)
        return conventionalMelee;
    const artifactMelee = artifactWeapons.find((w) => w.system?.weaponType !== 'ranged');
    if (artifactMelee)
        return artifactMelee;
    return createVirtualUnarmedWeapon();
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