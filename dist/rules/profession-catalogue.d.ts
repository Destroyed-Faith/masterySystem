/**
 * Optional Profession suggestions. Not a whitelist — a custom name is always legal.
 *
 * The data is the author-approved 90-entry list in five categories (Trades,
 * Wilderness, Society, Conflict, Knowledge). Characters never store catalogue
 * entries; they store their own name, origin, scope, and rank. Replacing this
 * list therefore never touches a learned or custom Profession on an actor.
 */
export interface ProfessionCatalogueEntry {
    id?: string;
    name: string;
    category: string;
    scope_example: string;
    type?: string;
    source?: string;
}
export declare const PROFESSION_CATALOGUE_VERSION: string;
export declare const PROFESSION_CATALOGUE_NOT_CLOSED_LIST: boolean;
export declare const PROFESSION_CATALOGUE: readonly ProfessionCatalogueEntry[];
/** Category order as printed in the rulebook. */
export declare const PROFESSION_CATALOGUE_CATEGORIES: readonly string[];
export declare function professionCatalogueCategories(): string[];
/**
 * Filter suggestions by category and a free-text query over name and scope.
 * An empty category or query matches everything.
 */
export declare function searchProfessionCatalogue(opts?: {
    query?: string;
    category?: string;
}): ProfessionCatalogueEntry[];
/** Look up one suggestion by its exact name (case-insensitive). */
export declare function findProfessionCatalogueEntry(name: string): ProfessionCatalogueEntry | null;
//# sourceMappingURL=profession-catalogue.d.ts.map