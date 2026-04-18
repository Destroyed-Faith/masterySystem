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
 * All mastery powers from all trees (flat list)
 */
export declare const ALL_MASTERY_POWERS: (PowerDefinition | NewArtifactPowerData)[];
/**
 * Get all powers for a specific Mastery Tree
 * @param treeName - The display name of the Mastery Tree (e.g. "Dreadstalker")
 */
export declare function getPowersForTree(treeName: string): (PowerDefinition | NewArtifactPowerData)[];
/**
 * Get a specific power by tree and name
 */
export declare function getPower(treeName: string, powerName: string): (PowerDefinition | NewArtifactPowerData) | undefined;
export type { PowerDefinition, PowerLevelDefinition } from './types.js';
//# sourceMappingURL=index.d.ts.map