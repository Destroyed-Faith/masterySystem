/**
 * Mastery Powers Index
 *
 * This file automatically aggregates all Mastery Tree powers from individual files.
 * Each tree should export a const TREE_NAME_POWERS: PowerDefinition[] or NewArtifactPowerData[]
 *
 * NOTE: Migrating to new structure (v0.4.18+). Old PowerDefinition format is still supported for backwards compatibility.
 */
import type { PowerDefinition } from './types.js';
import type { NewArtifactPowerData } from '../../types/item.js';
/**
 * All mastery powers from all trees
 * Supports both old PowerDefinition and new NewArtifactPowerData structures
 */
export declare const ALL_MASTERY_POWERS: (PowerDefinition | NewArtifactPowerData)[];
/**
 * Get all powers for a specific Mastery Tree
 * @param treeName - The name of the Mastery Tree
 * @returns Array of PowerDefinition or NewArtifactPowerData objects for that tree
 */
export declare function getPowersForTree(treeName: string): (PowerDefinition | NewArtifactPowerData)[];
/**
 * Get a specific power by tree and name
 * @param treeName - The name of the Mastery Tree
 * @param powerName - The name of the power
 * @returns PowerDefinition or NewArtifactPowerData or undefined if not found
 */
export declare function getPower(treeName: string, powerName: string): (PowerDefinition | NewArtifactPowerData) | undefined;
export type { PowerDefinition, PowerLevelDefinition } from './types.js';
//# sourceMappingURL=index.d.ts.map