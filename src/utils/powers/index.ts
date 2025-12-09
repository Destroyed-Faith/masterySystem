/**
 * Mastery Powers Index
 * 
 * This file automatically aggregates all Mastery Tree powers from individual files.
 * Each tree should export a const TREE_NAME_POWERS: PowerDefinition[]
 */

import type { PowerDefinition } from './types.js';

// Import all tree powers
import { CRUSADER_POWERS } from './crusader.js';
import { BATTLEMAGE_POWERS } from './battlemage.js';
import { BERSERKER_POWERS } from './berserker.js';
import { SANCTIFIER_POWERS } from './sanctifier.js';
import { ALCHEMIST_POWERS } from './alchemist.js';
import { CATALYST_POWERS } from './catalyst.js';

// TODO: Import remaining trees as they are created
// import { JUGGERNAUT_POWERS } from './juggernaut.js';
// import { GRIM_HUNTER_POWERS } from './grim-hunter.js';
// import { WILD_STALKER_POWERS } from './wild-stalker.js';
// ... etc

/**
 * All mastery powers from all trees
 */
export const ALL_MASTERY_POWERS: PowerDefinition[] = [
    ...CRUSADER_POWERS,
    ...BATTLEMAGE_POWERS,
    ...BERSERKER_POWERS,
    ...SANCTIFIER_POWERS,
    ...ALCHEMIST_POWERS,
    ...CATALYST_POWERS,
    // TODO: Add remaining trees as they are created
];

/**
 * Get all powers for a specific Mastery Tree
 * @param treeName - The name of the Mastery Tree
 * @returns Array of PowerDefinition objects for that tree
 */
export function getPowersForTree(treeName: string): PowerDefinition[] {
    return ALL_MASTERY_POWERS.filter(power => power.tree === treeName);
}

/**
 * Get a specific power by tree and name
 * @param treeName - The name of the Mastery Tree
 * @param powerName - The name of the power
 * @returns PowerDefinition or undefined if not found
 */
export function getPower(treeName: string, powerName: string): PowerDefinition | undefined {
    return ALL_MASTERY_POWERS.find(
        power => power.tree === treeName && power.name === powerName
    );
}

// Re-export types
export type { PowerDefinition, PowerLevelDefinition } from './types.js';

