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

import type {
    ActiveSpecialTier,
    ChosenSpecial,
    EmbeddedPowerData,
    PowerCategory,
    PowerLevelKey,
} from '../types/item.js';
import { ALL_POWER_TEMPLATES, type PowerTemplate } from './powers/templates/index.js';
import { POWER_LEVEL_KEYS } from '../types/power-levels.js';
import { ALL_SPECIAL_EFFECTS } from './special-effects.js';

// ─── Constants the UI imports ────────────────────────────────────────────

/** Category keys used in filter UI (in display order). */
export const CATEGORY_ORDER: PowerCategory[] = [
    'active',
    'activeBuff',
    'movement',
    'reaction',
    'passive',
];

export const CATEGORY_LABELS: Record<PowerCategory, string> = {
    active: 'Active',
    activeBuff: 'Active Buff',
    movement: 'Movement',
    reaction: 'Reaction',
    passive: 'Passive',
};

/** Requirements for character creation — total 7 powers. */
export const CREATION_POWER_REQUIREMENTS: Record<PowerCategory, number> = {
    active: 2,
    activeBuff: 1,
    movement: 1,
    reaction: 1,
    passive: 2,
};

/** Structural mechanics axes used by the secondary "Effect Type" filter. */
export const EFFECT_TYPE_KEYS = [
    'armor',
    'evade',
    'initiativeD8',
    'regen',
    'tempHP',
    'saveDice',
    'damageRider',
    'movementBonus',
] as const;
export type EffectTypeKey = typeof EFFECT_TYPE_KEYS[number];
export const EFFECT_TYPE_LABELS: Record<EffectTypeKey, string> = {
    armor: 'Armor',
    evade: 'Evade',
    initiativeD8: 'Initiative',
    regen: 'Regen',
    tempHP: 'Temp HP',
    saveDice: 'Save Dice',
    damageRider: 'Damage Rider',
    movementBonus: 'Movement',
};

// ─── CatalogEntry & filter types ─────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────

function collectSpecialKeysFromTemplate(t: PowerTemplate, chosenKey?: string): string[] {
    const keys = new Set<string>();
    if (chosenKey) keys.add(chosenKey);
    for (const k of POWER_LEVEL_KEYS) {
        const row = t.levels[k as PowerLevelKey];
        for (const s of row?.specials ?? []) {
            if (!s?.key) continue;
            const key = String(s.key).toLowerCase();
            if (key === 'special') continue; // placeholder for the Active specialSlot
            keys.add(key);
        }
    }
    return [...keys];
}

function collectEffectTypesFromTemplate(t: PowerTemplate): string[] {
    const types = new Set<string>();
    const visit = (m: any) => {
        if (!m || typeof m !== 'object') return;
        if (m.armor) types.add('armor');
        if (m.evade) types.add('evade');
        if (m.initiativeD8) types.add('initiativeD8');
        if (m.regen) types.add('regen');
        if (m.tempHP) types.add('tempHP');
        if (m.saveDice && typeof m.saveDice === 'object') {
            const sd = m.saveDice;
            if ((sd.body ?? 0) !== 0 || (sd.mind ?? 0) !== 0 || (sd.spirit ?? 0) !== 0) types.add('saveDice');
        }
        if (m.damageRider) types.add('damageRider');
        if (m.movementBonus) types.add('movementBonus');
    };
    visit((t as any).mechanics);
    for (const k of POWER_LEVEL_KEYS) visit(t.levels[k as PowerLevelKey]?.mechanics);
    return [...types];
}

function makeEntry(t: PowerTemplate, chosen: ChosenSpecial | null): CatalogEntry {
    const name = chosen ? `${t.templateName} — ${specialLabel(chosen.key)}` : t.templateName ?? t.name;
    return {
        name,
        templateId: t.templateId,
        templateName: t.templateName,
        category: t.category,
        subfamily: t.subfamily ?? '',
        chosenSpecial: chosen ?? undefined,
        tier: chosen?.tier,
        tags: (t.tags ?? []).map((s) => String(s).toLowerCase()),
        specialKeys: collectSpecialKeysFromTemplate(t, chosen?.key),
        effectTypes: collectEffectTypesFromTemplate(t),
        description: t.fluff ?? '',
        requiresEcho: t.requiresEcho?.map((k) => k.toLowerCase()),
        raw: t as EmbeddedPowerData,
        sourceKind: 'template',
        sourceName: '',
    };
}

function specialLabel(key: string): string {
    const hit = ALL_SPECIAL_EFFECTS.find((e) => e.id === key);
    if (hit) return hit.name.replace(/\(X\)/gi, '').trim();
    return key.charAt(0).toUpperCase() + key.slice(1);
}

// ─── Build ───────────────────────────────────────────────────────────────

function buildEntries(): CatalogEntry[] {
    const out: CatalogEntry[] = [];
    for (const t of ALL_POWER_TEMPLATES) {
        if (t.category === 'active' && t.specialSlot) {
            for (const key of t.specialSlot.eligibleSpecialKeys) {
                out.push(makeEntry(t, { key, tier: t.specialSlot.tier }));
            }
            continue;
        }
        out.push(makeEntry(t, null));
    }
    return out;
}

let CACHED_ENTRIES: CatalogEntry[] | null = null;

export function getAllCatalogEntries(): CatalogEntry[] {
    if (!CACHED_ENTRIES) CACHED_ENTRIES = buildEntries();
    return CACHED_ENTRIES;
}

/** Invalidate the catalog cache (mainly for tests). */
export function _resetCatalogCache(): void {
    CACHED_ENTRIES = null;
}

// ─── Filter ──────────────────────────────────────────────────────────────

export function filterCatalog(filter: CatalogFilter): CatalogEntry[] {
    const entries = getAllCatalogEntries();
    const term = (filter.search || '').trim().toLowerCase();
    const echoKey = (filter.actorEchoKey || '').trim().toLowerCase();
    return entries.filter((e) => {
        if (filter.category && e.category !== filter.category) return false;
        if (filter.subfamily && e.subfamily !== filter.subfamily) return false;
        if (filter.templateId && e.templateId !== filter.templateId) return false;
        if (filter.tier && e.tier !== filter.tier) return false;
        if (filter.special && !(e.specialKeys.includes(filter.special))) return false;
        if (filter.effectType && !e.effectTypes.includes(filter.effectType)) return false;
        if (filter.tag && !e.tags.includes(filter.tag)) return false;
        if (term) {
            const hay = `${e.name} ${e.templateName}`.toLowerCase();
            if (!hay.includes(term)) return false;
        }
        if (e.requiresEcho && e.requiresEcho.length > 0) {
            if (!echoKey || !e.requiresEcho.includes(echoKey)) return false;
        }
        return true;
    });
}

// ─── Option lookups ──────────────────────────────────────────────────────

/** Unique list of subfamilies within a category (sorted). */
export function getSubfamiliesByCategory(category: PowerCategory): string[] {
    const subs = new Set<string>();
    for (const e of getAllCatalogEntries()) if (e.category === category && e.subfamily) subs.add(e.subfamily);
    return [...subs].sort();
}

/** Unique list of templateIds in a (category, subfamily). */
export function getTemplatesBySubfamily(category: PowerCategory, subfamily: string): Array<{ templateId: string; templateName: string }> {
    const seen = new Map<string, string>();
    for (const e of getAllCatalogEntries()) {
        if (e.category !== category || e.subfamily !== subfamily) continue;
        if (!seen.has(e.templateId)) seen.set(e.templateId, e.templateName);
    }
    return [...seen.entries()].map(([templateId, templateName]) => ({ templateId, templateName }));
}

/** @deprecated legacy — returns empty list (trees removed). */
export function getAllSourceNames(): string[] {
    return [];
}

export function getActiveTagOptions(): string[] {
    const tags = new Set<string>();
    for (const e of getAllCatalogEntries()) {
        if (e.category !== 'active') continue;
        for (const t of e.tags) tags.add(t);
    }
    return [...tags].sort();
}

function buildLabeledSpecialList(keys: Set<string>): Array<{ key: string; label: string }> {
    return [...keys]
        .map((key) => ({ key, label: specialLabel(key) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

export function getActiveSpecialOptions(): Array<{ key: string; label: string }> {
    return collectSpecialOptions((e) => e.category === 'active');
}

export function getAllSpecialOptions(): Array<{ key: string; label: string }> {
    return collectSpecialOptions(() => true);
}

export function getVisibleSpecialOptions(filter: Omit<CatalogFilter, 'special'>): Array<{ key: string; label: string }> {
    const entries = filterCatalog({ ...filter });
    const keys = new Set<string>();
    for (const e of entries) for (const k of e.specialKeys) keys.add(k);
    return buildLabeledSpecialList(keys);
}

export function getVisibleEffectTypeOptions(filter: Omit<CatalogFilter, 'effectType'>): Array<{ key: string; label: string }> {
    const entries = filterCatalog({ ...filter });
    const present = new Set<string>();
    for (const e of entries) for (const t of e.effectTypes) present.add(t);
    return EFFECT_TYPE_KEYS.filter((k) => present.has(k)).map((k) => ({ key: k, label: EFFECT_TYPE_LABELS[k] }));
}

function collectSpecialOptions(predicate: (e: CatalogEntry) => boolean): Array<{ key: string; label: string }> {
    const keys = new Set<string>();
    for (const e of getAllCatalogEntries()) {
        if (!predicate(e)) continue;
        for (const k of e.specialKeys) keys.add(k);
    }
    return buildLabeledSpecialList(keys);
}

/** Lookup a catalog entry by its display name. Legacy sourceKind/sourceName are ignored. */
export function findCatalogEntryByName(
    name: string,
    _sourceKind?: PowerSourceKind,
    _sourceName?: string,
): CatalogEntry | undefined {
    return getAllCatalogEntries().find((e) => e.name === name);
}

/** Lookup the template behind a CatalogEntry. */
export function findTemplateById(templateId: string): PowerTemplate | undefined {
    return ALL_POWER_TEMPLATES.find((t) => t.templateId === templateId);
}
