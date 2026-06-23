/**
 * Virtual unarmed weapon — no inventory item required.
 *
 * When a character has no equipped weapon, melee attacks use these stats
 * automatically (Players Guide: unarmed = inherent, not an item).
 */
export declare const VIRTUAL_UNARMED_WEAPON_ID = "__mastery_virtual_unarmed__";
/** Canonical virtual weapon shape (compatible with damage / attack resolution). */
export declare function createVirtualUnarmedWeapon(): {
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
};
export declare function isVirtualUnarmedWeapon(item: any | null | undefined): boolean;
/** True for embedded items named "Unarmed" that were auto-seeded (legacy). */
export declare function isLegacyUnarmedItem(item: any): boolean;
/** True when a wieldable artifact contributes weapon damage (profile or derived). */
export declare function artifactCarriesWeaponProfile(artifact: any): boolean;
/**
 * Convert an equipped artifact that carries weapon damage into a weapon-shaped
 * object the attack/damage pipeline understands. Falls back to `baseProfile`
 * derivation when the baked `artifactWeapon` blob is absent (common on bound
 * general artifacts such as the Moonlight Greatsword).
 */
export declare function artifactToVirtualWeapon(artifact: any): any | null;
/**
 * Resolve equipped weapon for an attack type. Conventional weapons win; an
 * artifact natural weapon (e.g. Dragon Head bite) is used when no conventional
 * weapon of that type is equipped. Melee finally falls back to virtual unarmed;
 * ranged returns null.
 */
export declare function resolveEquippedWeaponForAttackType(items: any[], attackType: 'melee' | 'ranged'): any | null;
/** After weapon-id lookup fails, apply virtual unarmed for player melee attacks. */
export declare function applyMeleeUnarmedFallback(weapon: any | null | undefined, attackType: 'melee' | 'ranged' | undefined): any | null;
//# sourceMappingURL=unarmed-fallback.d.ts.map