/**
 * Special Aura, Summon Damage Aura, and Summon Armor Aura.
 *
 * These are live queries. They never write Special stacks, Armor, or extra
 * damage dice onto the affected actor. Damage Aura and Healing Aura stay
 * end-of-turn pulses in `aura-pulse.ts` and are not handled here.
 */
/** Printed Special Aura radii. PL 1–3 are unavailable (0). */
export declare const SPECIAL_AURA_RADIUS_M: readonly [0, 0, 0, 2, 3, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8];
/** Printed Summon Damage / Summon Armor radii. PL 16 is 40 m. */
export declare const SUMMON_AURA_RADIUS_M: readonly [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40];
/** Printed Summon Damage Aura dice (d8) for PL 1–16. */
export declare const SUMMON_DAMAGE_AURA_DICE: readonly [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
/** Printed Summon Armor Aura bonus for PL 1–16. */
export declare const SUMMON_ARMOR_AURA_BONUS: readonly [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/**
 * Eligible diminishing Special(X) types from the Special Aura entry.
 * Binary, hard-control, and other unlisted Specials are refused.
 */
export declare const SPECIAL_AURA_ELIGIBLE: Set<string>;
/**
 * +1 when at least one in-range Special Aura matches this Special.
 * Overlapping auras do not add again.
 */
export declare function specialAuraEffectiveStep(actor: any, specialId: string): number;
/** Extra d8 for one legal attack by this Summon, or 0. */
export declare function summonDamageAuraBonusDice(attacker: any): number;
/** Extra Armor for this Summon while it is inside the owner's aura, or 0. */
export declare function summonArmorAuraBonus(summon: any): number;
//# sourceMappingURL=aura-modifiers.d.ts.map