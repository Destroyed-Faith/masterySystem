/**
 * Spell Schools Index
 * Exports all spells from all schools
 */
export * from './types.js';
export * from './pyromancy.js';
export * from './malefic-arts.js';
export * from './old-pact.js';
export * from './thorn-whisper.js';
export * from './breach-break.js';
export * from './aegis-benedictions.js';
export * from './bound-mind.js';
import type { SpellDefinition } from './types.js';
/**
 * All spells grouped by school
 */
export declare const ALL_SPELLS: Record<string, SpellDefinition[]>;
/**
 * Get all spells from all schools
 */
export declare function getAllSpells(): SpellDefinition[];
/**
 * Get spells by school key
 */
export declare function getSpellsBySchool(schoolKey: string): SpellDefinition[];
/**
 * Get spell by name (searches all schools)
 */
export declare function getSpellByName(name: string): SpellDefinition | undefined;
//# sourceMappingURL=index.d.ts.map