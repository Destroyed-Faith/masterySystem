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
/** Innate-ability strings on a weapon item (catalog `innateAbilities`). */
export declare function weaponInnates(item: any): string[];
/** True when one innate line starts with the given property name. */
export declare function hasWeaponProperty(item: any, property: string): boolean;
export declare function isLightWeapon(item: any): boolean;
/** Naturally two-handed, or a Versatile weapon gripped two-handed. */
export declare function isWieldedTwoHanded(item: any): boolean;
/** Versatile: +2d8 weapon damage while wielded two-handed. */
export declare function versatileBonusDice(weapon: any): number;
/**
 * Set: +1d8 weapon damage when the wielder did not move this round.
 * Uses the per-turn movement tracker flag (`movedThisTurnM`); outside combat
 * the bonus does not apply (no round structure to measure against).
 */
export declare function setBonusDice(actor: any, weapon: any): number;
/** Defensive: +MR Evade (max +6) while wielding the weapon two-handed. */
export declare function defensiveEvadeBonus(actor: any, weapon: any): number;
/** True when the weapon has the Load property (Light/Heavy Crossbow). */
export declare function hasLoadProperty(item: any): boolean;
/** True when a Load weapon is currently Unloaded and cannot fire. */
export declare function isWeaponUnloaded(item: any): boolean;
/** Mark a Load weapon as Unloaded (after it fires). */
export declare function markWeaponUnloaded(item: any): Promise<void>;
/** Reload a Load weapon (Attack-Action reload or Quick Load). */
export declare function markWeaponLoaded(item: any): Promise<void>;
//# sourceMappingURL=weapon-properties.d.ts.map