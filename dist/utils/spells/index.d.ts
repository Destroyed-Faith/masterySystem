/**
 * Spell Schools Index
 * Exports all spells from active spell schools.
 *
 * Deprecated schools are kept on disk for backward compatibility with existing
 * actor items, but are no longer exported or aggregated here so they cannot
 * appear in the Power Picker / search.
 */
export * from './types.js';
export * from './black-writ.js';
export * from './pact-breach.js';
export * from './split-tempest.js';
export * from './pyre-calculus.js';
import type { SpellDefinition } from './types.js';
/**
 * All active spells grouped by school (deprecated schools excluded).
 */
export declare const ALL_SPELLS: Record<string, SpellDefinition[]>;
/**
 * Get all spells from all active schools.
 */
export declare function getAllSpells(): SpellDefinition[];
/**
 * Get spells by school key (active schools only).
 */
export declare function getSpellsBySchool(schoolKey: string): SpellDefinition[];
/**
 * Get spell by name (searches all active schools).
 */
export declare function getSpellByName(name: string): SpellDefinition | undefined;
//# sourceMappingURL=index.d.ts.map