/**
 * Spell Tag System for Mastery System
 *
 * Rules:
 * - Powers with (Spell) tag interact with the Veil
 * - Can be dispelled, suppressed, or countered
 * - Only powers with Spell tag are affected by anti-magic
 */
/**
 * Check if a power/item has the Spell tag
 */
export declare function isSpell(item: any): boolean;
/**
 * Get all active spells on an actor
 */
export declare function getActiveSpells(actor: any): any[];
/**
 * Attempt to dispel a spell
 *
 * @param caster - Actor attempting to dispel
 * @param target - Actor with spell effect
 * @param spellLevel - Level of spell to dispel (optional, targets highest if not specified)
 * @returns True if successful
 */
export declare function dispelSpell(caster: any, target: any, spellLevel?: number): Promise<boolean>;
/**
 * Suppress all spells on a target for X rounds
 *
 * @param target - Actor to suppress spells on
 * @param duration - Rounds to suppress
 * @param source - Actor applying suppression
 */
export declare function suppressSpells(target: any, duration: number, source?: any): Promise<void>;
/**
 * Counterspell - attempt to counter a spell as it's being cast
 *
 * @param caster - Actor casting the spell
 * @param counterer - Actor attempting to counter
 * @param spellLevel - Level of spell being cast
 * @returns True if successfully countered
 */
export declare function counterspell(caster: any, counterer: any, spellLevel: number): Promise<boolean>;
/**
 * Check if target is immune to spells (Anti-Magic Field)
 */
export declare function hasSpellImmunity(actor: any): boolean;
/**
 * Get spell school/type for categorization
 */
export declare function getSpellSchool(item: any): string;
//# sourceMappingURL=spells.d.ts.map