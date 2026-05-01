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
 * Players Guide 2988–3008 ("Choose your Powers"): a starting character
 * picks **4 Powers total** with no per-category split — only the total
 * count and the requirement that two of them be raised to Rank 2 at
 * creation. We keep this map for backward compatibility with the older
 * 7-powers-by-category UI but set every category to `0`; the actual
 * gate now lives in `CREATION_POWER_TOTAL` and `CREATION_POWERS_AT_RANK_2`
 * below.
 *
 * @deprecated UI code should branch on `CREATION_POWER_TOTAL` /
 *             `CREATION_POWERS_AT_RANK_2` instead of summing this map.
 */
export declare const CREATION_POWER_REQUIREMENTS: Record<PowerCategory, number>;
/** Players Guide 3002: total Powers picked at character creation. */
export declare const CREATION_POWER_TOTAL = 4;
/** Players Guide 3004: Powers raised to Rank 2 at character creation. */
export declare const CREATION_POWERS_AT_RANK_2 = 2;
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