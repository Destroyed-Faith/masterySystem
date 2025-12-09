/**
 * Spells (Mastery Spell Trees) index
 * Aggregates all spells from all schools
 */

import type { SpellDefinition } from './types.js';

// Import all spell schools
import { PYROMANCY_SPELLS } from './pyromancy.js';
// TODO: Import remaining spell schools as they are created
// import { MALEFIC_ARTS_SPELLS } from './malefic-arts.js';
// import { OLD_PACT_SPELLS } from './old-pact.js';
// import { THORN_WHISPER_SPELLS } from './thorn-whisper.js';
// import { BREACH_BREAK_SPELLS } from './breach-break.js';
// import { AEGIS_BENEDICTIONS_SPELLS } from './aegis-benedictions.js';

/**
 * All spells from all schools
 */
export const ALL_SPELLS: SpellDefinition[] = [
    ...PYROMANCY_SPELLS,
    // TODO: Add remaining spell schools as they are created
    // ...MALEFIC_ARTS_SPELLS,
    // ...OLD_PACT_SPELLS,
    // ...THORN_WHISPER_SPELLS,
    // ...BREACH_BREAK_SPELLS,
    // ...AEGIS_BENEDICTIONS_SPELLS,
];

/**
 * Get all spells for a specific Spell School
 * @param schoolName - The name of the Spell School
 * @returns Array of SpellDefinition objects for that school
 */
export function getSpellsForSchool(schoolName: string): SpellDefinition[] {
    return ALL_SPELLS.filter(spell => spell.school === schoolName);
}

/**
 * Get a specific spell by school and name
 * @param schoolName - The name of the Spell School
 * @param spellName - The name of the spell
 * @returns SpellDefinition or undefined if not found
 */
export function getSpell(schoolName: string, spellName: string): SpellDefinition | undefined {
    return ALL_SPELLS.find(
        spell => spell.school === schoolName && spell.name === spellName
    );
}

/**
 * Get all available school names that have spells defined
 */
export function getSchoolsWithSpells(): string[] {
    const schoolNames = new Set<string>();
    ALL_SPELLS.forEach(spell => schoolNames.add(spell.school));
    return Array.from(schoolNames);
}

// Re-export types for convenience
export type { SpellDefinition, SpellLevelDefinition } from './types.js';

