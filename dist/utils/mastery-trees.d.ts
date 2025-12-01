/**
 * Mastery Trees configuration for Mastery System
 */
export interface MasteryTreeDefinition {
    name: string;
    focus: string;
    roles: string[];
    requirements?: string;
    bonus?: string;
}
export declare const MASTERY_TREES: Record<string, MasteryTreeDefinition>;
/**
 * Get all mastery trees
 */
export declare function getAllMasteryTrees(): MasteryTreeDefinition[];
/**
 * Get mastery tree by key
 */
export declare function getMasteryTree(key: string): MasteryTreeDefinition | undefined;
//# sourceMappingURL=mastery-trees.d.ts.map