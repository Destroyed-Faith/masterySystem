/**
 * Powers Index - Aggregates all Mastery Tree Powers
 *
 * This file imports all individual tree powers and exports them as a unified collection.
 * Each tree is in its own file for better maintainability.
 */
import { PowerDefinition } from './types';
/**
 * All Mastery Powers organized by tree
 */
export declare const ALL_MASTERY_POWERS: Record<string, PowerDefinition[]>;
/**
 * Get all powers for a specific Mastery Tree
 */
export declare function getPowersForTree(treeName: string): PowerDefinition[];
/**
 * Get a specific power by tree and name
 */
export declare function getPower(treeName: string, powerName: string): PowerDefinition | undefined;
/**
 * Get all available tree names that have powers defined
 */
export declare function getTreesWithPowers(): string[];
export * from './types';
//# sourceMappingURL=index.d.ts.map