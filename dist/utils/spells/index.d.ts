/**
 * Spells (Mastery Spell Trees) index
 * Aggregates all spells from all schools
 */
import type { SpellDefinition } from './types.js';
/**
 * All spells from all schools
 */
export declare const ALL_SPELLS: SpellDefinition[];
/**
 * Get all spells for a specific Spell School
 * @param schoolName - The name of the Spell School
 * @returns Array of SpellDefinition objects for that school
 */
export declare function getSpellsForSchool(schoolName: string): SpellDefinition[];
/**
 * Get a specific spell by school and name
 * @param schoolName - The name of the Spell School
 * @param spellName - The name of the spell
 * @returns SpellDefinition or undefined if not found
 */
export declare function getSpell(schoolName: string, spellName: string): SpellDefinition | undefined;
/**
 * Get all available school names that have spells defined
 */
export declare function getSchoolsWithSpells(): string[];
export type { SpellDefinition, SpellLevelDefinition } from './types.js';
//# sourceMappingURL=index.d.ts.map