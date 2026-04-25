/**
 * @deprecated Mastery Trees facade — legacy compatibility only.
 *
 * Trees have been retired in favour of Templates. All power selection now
 * flows through `src/utils/powers/templates/*` and the template-based
 * CatalogEntry in `src/utils/power-catalog.ts`. These exports remain as
 * empty stubs so any remaining callsite compiles until the next cleanup.
 */
/** @deprecated — empty under the Templates system. */
export const MASTERY_TREES = {};
/** @deprecated — always empty under the Templates system. */
export function getAllMasteryTrees() {
    return [];
}
/** @deprecated — always `undefined` under the Templates system. */
export function getMasteryTree(_key) {
    return undefined;
}
//# sourceMappingURL=mastery-trees.js.map