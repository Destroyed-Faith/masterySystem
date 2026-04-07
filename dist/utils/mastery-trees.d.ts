/**
 * Mastery Trees — thematic groupings for powers (display name only).
 */
export interface MasteryTreeDefinition {
    name: string;
}
export declare const MASTERY_TREES: Record<string, MasteryTreeDefinition>;
export declare function getAllMasteryTrees(): MasteryTreeDefinition[];
export declare function getMasteryTree(key: string): MasteryTreeDefinition | undefined;
//# sourceMappingURL=mastery-trees.d.ts.map