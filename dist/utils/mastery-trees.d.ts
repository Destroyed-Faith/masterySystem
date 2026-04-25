/**
 * @deprecated Mastery Trees facade — legacy compatibility only.
 *
 * Trees have been retired in favour of Templates. All power selection now
 * flows through `src/utils/powers/templates/*` and the template-based
 * CatalogEntry in `src/utils/power-catalog.ts`. These exports remain as
 * empty stubs so any remaining callsite compiles until the next cleanup.
 */
export interface MasteryTreeDefinition {
    name: string;
}
/** @deprecated — empty under the Templates system. */
export declare const MASTERY_TREES: Record<string, MasteryTreeDefinition>;
/** @deprecated — always empty under the Templates system. */
export declare function getAllMasteryTrees(): MasteryTreeDefinition[];
/** @deprecated — always `undefined` under the Templates system. */
export declare function getMasteryTree(_key: string): MasteryTreeDefinition | undefined;
//# sourceMappingURL=mastery-trees.d.ts.map