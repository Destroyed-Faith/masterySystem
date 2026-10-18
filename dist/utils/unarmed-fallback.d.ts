/**
 * Virtual unarmed weapon — no inventory item required.
 *
 * When a character has no equipped weapon, melee attacks use these stats
 * automatically (Players Guide: unarmed = inherent, not an item).
 */
export declare const VIRTUAL_UNARMED_WEAPON_ID = "__mastery_virtual_unarmed__";
/** Actor flag: melee Powers / Basic Attack use this natural-weapon artifact id. */
export declare const PREFERRED_NATURAL_WEAPON_FLAG = "preferredNaturalWeaponId";
export declare function getPreferredNaturalWeaponId(actor: any): string | null;
export declare function setPreferredNaturalWeapon(actor: any, itemId: string | null): Promise<void>;
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
/**
 * True when a wieldable artifact is an actual attack weapon.
 * Body armor (Serpent Scales, etc.) must never count — a stale empty
 * `artifactWeapon: {}` blob used to look "truthy" and fall back to 1d8.
 * Declared natural weapons (Dragon Head Bite on headArmor) do count when they
 * bake a damage string, even though the Base Profile is not a hand weapon.
 */
export declare function artifactCarriesWeaponProfile(artifact: any): boolean;
/**
 * Convert an equipped artifact that carries weapon damage into a weapon-shaped
 * object the attack/damage pipeline understands. Falls back to `baseProfile`
 * derivation when the baked `artifactWeapon` blob is absent (common on bound
 * general artifacts such as the Moonlight Greatsword).
 */
export declare function artifactToVirtualWeapon(artifact: any): any | null;
/**
 * Resolve equipped weapon for an attack type.
 * Preferred natural weapon (Bite toggle) wins for melee when set.
 * Otherwise the active Weapon Set main-hand wins (matches UI).
 * Then conventional weapons; an artifact natural weapon is used when
 * no conventional weapon of that type is equipped. Melee finally falls back to
 * virtual unarmed; ranged returns null.
 */
export declare function resolveEquippedWeaponForAttackType(items: any[], attackType: 'melee' | 'ranged', actor?: any): any | null;
/** After weapon-id lookup fails, apply virtual unarmed for player melee attacks. */
export declare function applyMeleeUnarmedFallback(weapon: any | null | undefined, attackType: 'melee' | 'ranged' | undefined): any | null;
//# sourceMappingURL=unarmed-fallback.d.ts.map