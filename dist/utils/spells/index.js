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
import { PYROMANCY_SPELLS } from './pyromancy.js';
import { MALEFIC_ARTS_SPELLS } from './malefic-arts.js';
import { OLD_PACT_SPELLS } from './old-pact.js';
import { THORN_WHISPER_SPELLS } from './thorn-whisper.js';
import { BREACH_BREAK_SPELLS } from './breach-break.js';
import { AEGIS_BENEDICTIONS_SPELLS } from './aegis-benedictions.js';
import { BOUND_MIND_SPELLS } from './bound-mind.js';
/**
 * All spells grouped by school
 */
export const ALL_SPELLS = {
    pyromancy: PYROMANCY_SPELLS,
    maleficArts: MALEFIC_ARTS_SPELLS,
    oldPact: OLD_PACT_SPELLS,
    thornWhisper: THORN_WHISPER_SPELLS,
    breachBreak: BREACH_BREAK_SPELLS,
    aegisBenedictions: AEGIS_BENEDICTIONS_SPELLS,
    boundMind: BOUND_MIND_SPELLS
};
/**
 * Get all spells from all schools
 */
export function getAllSpells() {
    return Object.values(ALL_SPELLS).flat();
}
/**
 * Get spells by school key
 */
export function getSpellsBySchool(schoolKey) {
    return ALL_SPELLS[schoolKey] || [];
}
/**
 * Get spell by name (searches all schools)
 */
export function getSpellByName(name) {
    return getAllSpells().find(spell => spell.name === name);
}
//# sourceMappingURL=index.js.map