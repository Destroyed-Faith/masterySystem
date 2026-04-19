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
    /** Structural effect-types derived from mechanics blocks on any level.
     *  Feeds the "Effect Type" filter in the Power Picker. Keys match
     *  EFFECT_TYPE_KEYS below (e.g. "armor", "evade", "damageRider"). */
    effectTypes: string[];
    description: string;
    /** Optional echo-gating: entry is only visible if the actor's Echo key matches one of these values (lowercased). */
    requiresEcho?: string[];
    raw: NewArtifactPowerData | PowerDefinition;
}
/** Keys used for the "Effect Type" filter in the Power Picker. Derived
 * entirely from the mechanics block that was attached by the translation
 * engine. The actual label shown in the UI is provided via EFFECT_TYPE_LABELS. */
export declare const EFFECT_TYPE_KEYS: readonly ["armor", "evade", "initiativeD8", "regen", "tempHP", "saveDice", "damageRider", "movementBonus"];
export type EffectTypeKey = typeof EFFECT_TYPE_KEYS[number];
export declare const EFFECT_TYPE_LABELS: Record<EffectTypeKey, string>;
/** Category keys used in filter UI (in display order). */
export declare const CATEGORY_ORDER: PowerCategory[];
export declare const CATEGORY_LABELS: Record<PowerCategory, string>;
/** Requirements for character creation – total 7 powers. */
export declare const CREATION_POWER_REQUIREMENTS: Record<PowerCategory, number>;
/** All selectable powers across trees + schools. */
export declare function getAllCatalogEntries(): CatalogEntry[];
export interface CatalogFilter {
    category?: PowerCategory | null;
    tag?: string | null;
    special?: string | null;
    /** Structural effect type from the mechanics block (e.g. "armor", "damageRider"). */
    effectType?: string | null;
    search?: string | null;
    /**
     * Mastery tree or school name (e.g. "Dragon", "Ashguard"). Matched
     * case-insensitively against entry.sourceName for exact equality.
     */
    sourceName?: string | null;
    /**
     * Actor's Echo key (e.g. "dragonborn"). Echo-gated entries are only returned
     * when their requiresEcho list contains this key (case-insensitive).
     * If undefined/null, echo-gated entries are hidden (safe default for non-actor contexts).
     */
    actorEchoKey?: string | null;
}
/** Filter entries based on the provided criteria. */
export declare function filterCatalog(filter: CatalogFilter): CatalogEntry[];
/** Unique, sorted list of all catalog sourceName values (trees + schools). */
export declare function getAllSourceNames(): string[];
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
/** Specials present on the *visible* subset of entries (respects category /
 * tag / actor-echo filters). Used by the Power Picker to auto-hide Specials
 * that would yield an empty result list. The `special` field of `filter` is
 * intentionally ignored so we don't depend on the currently-selected special
 * to compute the choices. */
export declare function getVisibleSpecialOptions(filter: Omit<CatalogFilter, 'special'>): Array<{
    key: string;
    label: string;
}>;
/** Effect types present on the *visible* subset of entries (respects all
 * filters except `effectType` itself so the dropdown isn't self-referential).
 * Used by the Power Picker to auto-hide types with no matching Power. */
export declare function getVisibleEffectTypeOptions(filter: Omit<CatalogFilter, 'effectType'>): Array<{
    key: string;
    label: string;
}>;
/** Look up a catalog entry by name across both sources (used by the dialog to fetch raw data). */
export declare function findCatalogEntryByName(name: string, sourceKind?: PowerSourceKind, sourceName?: string): CatalogEntry | undefined;
//# sourceMappingURL=power-catalog.d.ts.map