/**
 * Powers Index - Aggregates all Mastery Tree Powers
 *
 * This file imports all individual tree powers and exports them as a unified collection.
 * Each tree is in its own file for better maintainability.
 */
import { BATTLEMAGE_POWERS } from './battlemage.js';
import { CRUSADER_POWERS } from './crusader.js';
import { BERSERKER_POWERS } from './berserker.js';
import { SANCTIFIER_POWERS } from './sanctifier.js';
import { ALCHEMIST_POWERS } from './alchemist.js';
import { CATALYST_POWERS } from './catalyst.js';
/**
 * All Mastery Powers organized by tree
 */
export const ALL_MASTERY_POWERS = {
    'Battlemage': BATTLEMAGE_POWERS,
    'Crusader': CRUSADER_POWERS,
    'Berserker of the Blood Moon': BERSERKER_POWERS,
    'Sanctifier': SANCTIFIER_POWERS,
    'Alchemist': ALCHEMIST_POWERS,
    'Catalyst': CATALYST_POWERS
};
/**
 * Get all powers for a specific Mastery Tree
 */
export function getPowersForTree(treeName) {
    return ALL_MASTERY_POWERS[treeName] || [];
}
/**
 * Get a specific power by tree and name
 */
export function getPower(treeName, powerName) {
    const powers = ALL_MASTERY_POWERS[treeName] || [];
    return powers.find(p => p.name === powerName);
}
/**
 * Get all available tree names that have powers defined
 */
export function getTreesWithPowers() {
    return Object.keys(ALL_MASTERY_POWERS).filter(tree => ALL_MASTERY_POWERS[tree].length > 0);
}
// Re-export types for convenience
export * from './types.js';
//# sourceMappingURL=index.js.map