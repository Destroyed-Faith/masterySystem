/**
 * Power Catalog – unified access to all selectable powers (Mastery Trees + Spell Schools)
 *
 * Provides a single flat list with normalized category / tag / special metadata so
 * the character-creation UI can filter powers without caring about their origin
 * (legacy PowerDefinition vs. new NewArtifactPowerData).
 */
import type { NewArtifactPowerData, PowerCategory } from '../types/item.js';
import type { PowerDefinition } from './powers/types.js';
export type PowerSourceKind = 'mastery' | 'magic';
export interface CatalogEntry {
    name: string;
    sourceKind: PowerSourceKind;
    sourceName: string;
    category: PowerCategory;
    tags: string[];
    specialKeys: string[];
    description: string;
    raw: NewArtifactPowerData | PowerDefinition;
}
/** Category keys used in filter UI (in display order). */
export declare const CATEGORY_ORDER: PowerCategory[];
export declare const CATEGORY_LABELS: Record<PowerCategory, string>;
/** Requirements for character creation – total 8 powers. */
export declare const CREATION_POWER_REQUIREMENTS: Record<PowerCategory, number>;
/** All selectable powers across trees + schools. */
export declare function getAllCatalogEntries(): CatalogEntry[];
export interface CatalogFilter {
    category?: PowerCategory | null;
    tag?: string | null;
    special?: string | null;
    search?: string | null;
}
/** Filter entries based on the provided criteria. */
export declare function filterCatalog(filter: CatalogFilter): CatalogEntry[];
/** All tag values found on "active" powers (lowercased, unique, alphabetical). */
export declare function getActiveTagOptions(): string[];
/** All special keys used by "active" powers (lowercased, unique, alphabetical + enriched by ALL_SPECIAL_EFFECTS). */
export declare function getActiveSpecialOptions(): Array<{
    key: string;
    label: string;
}>;
/** All special keys used by any catalog entry (unique, sorted). */
export declare function getAllSpecialOptions(): Array<{
    key: string;
    label: string;
}>;
/** Look up a catalog entry by name across both sources (used by the dialog to fetch raw data). */
export declare function findCatalogEntryByName(name: string, sourceKind?: PowerSourceKind, sourceName?: string): CatalogEntry | undefined;
//# sourceMappingURL=power-catalog.d.ts.map