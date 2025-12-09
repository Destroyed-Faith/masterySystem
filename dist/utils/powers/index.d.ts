/**
 * Mastery Powers Index
 *
 * This file automatically aggregates all Mastery Tree powers from individual files.
 * Each tree should export a const TREE_NAME_POWERS: PowerDefinition[]
 */
import type { PowerDefinition } from './types.js';
/**
 * All mastery powers from all trees
 */
export declare const ALL_MASTERY_POWERS: PowerDefinition[];
/**
 * Get all powers for a specific Mastery Tree
 * @param treeName - The name of the Mastery Tree
 * @returns Array of PowerDefinition objects for that tree
 */
export declare function getPowersForTree(treeName: string): PowerDefinition[];
/**
 * Get a specific power by tree and name
 * @param treeName - The name of the Mastery Tree
 * @param powerName - The name of the power
 * @returns PowerDefinition or undefined if not found
 */
export declare function getPower(treeName: string, powerName: string): PowerDefinition | undefined;
export type { PowerDefinition, PowerLevelDefinition } from './types.js';
//# sourceMappingURL=index.d.ts.map