/**
 * Mastery Powers - All powers from Mastery Trees in the Players Guide
 *
 * This file contains the complete power definitions for each Mastery Tree.
 * Powers are organized by tree and include all mechanical details.
 */
export interface PowerLevel {
    level: number;
    type: string;
    range?: string;
    aoe?: string;
    duration?: string;
    effect: string;
    special?: string;
    cost?: {
        action?: boolean;
        movement?: boolean;
        reaction?: boolean;
        stones?: number;
        charges?: number;
    };
    roll?: {
        attribute?: string;
        tn?: number;
        damage?: string;
        damageType?: string;
        penetration?: number;
    };
}
export interface PowerDefinition {
    name: string;
    tree: string;
    powerType: 'active' | 'buff' | 'utility' | 'passive' | 'reaction' | 'movement';
    passiveCategory?: 'armor' | 'evade' | 'toHit' | 'damage' | 'roll' | 'save' | 'hitPoint' | 'healing' | 'awareness' | 'attribute';
    description: string;
    levels: PowerLevel[];
}
/**
 * All Mastery Powers organized by tree
 */
export declare const MASTERY_POWERS: Record<string, PowerDefinition[]>;
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
//# sourceMappingURL=mastery-powers.d.ts.map