/**
 * Power Catalog — Template-based, post-Trees implementation.
 *
 * The catalog consumes `ALL_POWER_TEMPLATES` from
 * `src/utils/powers/templates/index.ts` and expands every Active template
 * with a `specialSlot` into one CatalogEntry per eligible Special (see
 * plan §5). Movement / Reaction / Active-Buff / Passive templates produce
 * exactly one entry each.
 *
 * Filter axes (CatalogFilter):
 *  - category    : PowerCategory
 *  - subfamily   : string (e.g. 'teleport', 'damage-aoe', 'conditional-combined')
 *  - templateId  : canonical template id (e.g. 'active-ranged-damage-t4')
 *  - tier        : 3 | 4 | 5 | 6     (Actives only)
 *  - special     : Special key   (Actives only — matches chosenSpecial.key)
 *  - search      : free-text across name + templateName
 *
 * Legacy filter axes (`tag`, `effectType`, `sourceName`) are preserved as
 * no-ops / best-effort compatibility shims so callers that still pass them
 * continue to compile while they migrate to the new three-stage UI.
 */
import type { ActiveSpecialTier, ChosenSpecial, EmbeddedPowerData, PowerCategory } from '../types/item.js';
import { type PowerTemplate } from './powers/templates/index.js';
/** Category keys used in filter UI (in display order). */
export declare const CATEGORY_ORDER: PowerCategory[];
export declare const CATEGORY_LABELS: Record<PowerCategory, string>;
/**
 * Requirements for character creation per category.
 *
 * Starting character: **2 Active**, **2 Passive**, **1 Reaction**,
 * **1 Movement**, **1 Active Buff** — all at **Rank 2**.
 */
export declare const CREATION_POWER_REQUIREMENTS: Record<PowerCategory, number>;
/** Total Powers picked at character creation (sum of requirements above). */
export declare const CREATION_POWER_TOTAL = 7;
/** All starting Powers must be Rank 2 (= total count). */
export declare const CREATION_POWERS_AT_RANK_2 = 7;
/** Count embedded power items by `PowerCategory` (legacy `powerType` fallback). */
export declare function countPowersByCategory(powers: Iterable<{
    system?: {
        category?: PowerCategory;
        powerType?: string;
    };
}>): Record<PowerCategory, number>;
/** Structural mechanics axes used by the secondary "Effect Type" filter. */
export declare const EFFECT_TYPE_KEYS: readonly ["armor", "evade", "initiativeD8", "regen", "tempHP", "saveDice", "damageRider", "movementBonus"];
export type EffectTypeKey = typeof EFFECT_TYPE_KEYS[number];
export declare const EFFECT_TYPE_LABELS: Record<EffectTypeKey, string>;
/** @deprecated legacy PowerSourceKind retained only for compile compatibility. */
export type PowerSourceKind = 'mastery' | 'magic' | 'template';
export interface CatalogEntry {
    /** Display name (template + chosen Special suffix for Actives). */
    name: string;
    /** Canonical template id (stable across expansions). */
    templateId: string;
    /** Base template display name without the chosen-special suffix. */
    templateName: string;
    category: PowerCategory;
    subfamily: string;
    /** Only set for Active damage templates after expansion. */
    chosenSpecial?: ChosenSpecial;
    tier?: ActiveSpecialTier;
    tags: string[];
    specialKeys: string[];
    effectTypes: string[];
    description: string;
    /** Optional echo-gating (rarely used under Templates; kept for parity). */
    requiresEcho?: string[];
    raw: EmbeddedPowerData;
    /** @deprecated — legacy shims (always 'template'/''). */
    sourceKind: PowerSourceKind;
    /** @deprecated — legacy shim, always empty string. */
    sourceName: string;
}
export interface CatalogFilter {
    category?: PowerCategory | null;
    subfamily?: string | null;
    templateId?: string | null;
    tier?: ActiveSpecialTier | null;
    special?: string | null;
    /** Free-text search over name / templateName. */
    search?: string | null;
    /** @deprecated — legacy, retained for compile compatibility. */
    tag?: string | null;
    /** @deprecated — legacy, retained for compile compatibility. */
    effectType?: string | null;
    /** @deprecated — trees are gone; ignored. */
    sourceName?: string | null;
    /** Actor's Echo key, lowercased. Echo-gated entries are hidden if missing. */
    actorEchoKey?: string | null;
}
export declare function getAllCatalogEntries(): CatalogEntry[];
/** Invalidate the catalog cache (mainly for tests). */
export declare function _resetCatalogCache(): void;
export declare function filterCatalog(filter: CatalogFilter): CatalogEntry[];
/** Unique list of subfamilies within a category (sorted). */
export declare function getSubfamiliesByCategory(category: PowerCategory): string[];
/** Unique list of templateIds in a (category, subfamily). */
export declare function getTemplatesBySubfamily(category: PowerCategory, subfamily: string): Array<{
    templateId: string;
    templateName: string;
}>;
/** @deprecated legacy — returns empty list (trees removed). */
export declare function getAllSourceNames(): string[];
export declare function getActiveTagOptions(): string[];
export declare function getActiveSpecialOptions(): Array<{
    key: string;
    label: string;
}>;
export declare function getAllSpecialOptions(): Array<{
    key: string;
    label: string;
}>;
export declare function getVisibleSpecialOptions(filter: Omit<CatalogFilter, 'special'>): Array<{
    key: string;
    label: string;
}>;
export declare function getVisibleEffectTypeOptions(filter: Omit<CatalogFilter, 'effectType'>): Array<{
    key: string;
    label: string;
}>;
/** Lookup a catalog entry by its display name. Legacy sourceKind/sourceName are ignored. */
export declare function findCatalogEntryByName(name: string, _sourceKind?: PowerSourceKind, _sourceName?: string): CatalogEntry | undefined;
/** Lookup the template behind a CatalogEntry. */
export declare function findTemplateById(templateId: string): PowerTemplate | undefined;
//# sourceMappingURL=power-catalog.d.ts.map