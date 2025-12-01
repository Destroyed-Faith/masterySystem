/**
 * Powers configuration for Mastery System
 * All powers organized by Mastery Tree
 */
export interface PowerLevel {
    level: number;
    type: string;
    range: string;
    aoe: string;
    duration: string;
    effect: string;
    special?: string;
}
export interface PowerDefinition {
    name: string;
    tree: string;
    description: string;
    levels: PowerLevel[];
}
export declare const POWERS: Record<string, PowerDefinition[]>;
/**
 * Get all powers for a specific Mastery Tree
 */
export declare function getPowersByTree(treeName: string): PowerDefinition[];
/**
 * Get a specific power by name and tree
 */
export declare function getPower(treeName: string, powerName: string): PowerDefinition | undefined;
/**
 * Get all available Mastery Trees that have powers
 */
export declare function getTreesWithPowers(): string[];
//# sourceMappingURL=powers.d.ts.map