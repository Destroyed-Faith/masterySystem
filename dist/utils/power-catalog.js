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
import { ALL_POWER_TEMPLATES } from './powers/templates/index.js';
import { POWER_LEVEL_KEYS } from '../types/power-levels.js';
import { ALL_SPECIAL_EFFECTS } from './special-effects.js';
// ─── Constants the UI imports ────────────────────────────────────────────
/** Category keys used in filter UI (in display order). */
export const CATEGORY_ORDER = [
    'active',
    'activeBuff',
    'movement',
    'reaction',
    'passive',
];
export const CATEGORY_LABELS = {
    active: 'Active',
    activeBuff: 'Active Buff',
    movement: 'Movement',
    reaction: 'Reaction',
    passive: 'Passive',
};
/** Requirements for character creation — total 7 powers. */
export const CREATION_POWER_REQUIREMENTS = {
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
];
export const EFFECT_TYPE_LABELS = {
    armor: 'Armor',
    evade: 'Evade',
    initiativeD8: 'Initiative',
    regen: 'Regen',
    tempHP: 'Temp HP',
    saveDice: 'Save Dice',
    damageRider: 'Damage Rider',
    movementBonus: 'Movement',
};
// ─── Helpers ─────────────────────────────────────────────────────────────
function collectSpecialKeysFromTemplate(t, chosenKey) {
    const keys = new Set();
    if (chosenKey)
        keys.add(chosenKey);
    for (const k of POWER_LEVEL_KEYS) {
        const row = t.levels[k];
        for (const s of row?.specials ?? []) {
            if (!s?.key)
                continue;
            const key = String(s.key).toLowerCase();
            if (key === 'special')
                continue; // placeholder for the Active specialSlot
            keys.add(key);
        }
    }
    return [...keys];
}
function collectEffectTypesFromTemplate(t) {
    const types = new Set();
    const visit = (m) => {
        if (!m || typeof m !== 'object')
            return;
        if (m.armor)
            types.add('armor');
        if (m.evade)
            types.add('evade');
        if (m.initiativeD8)
            types.add('initiativeD8');
        if (m.regen)
            types.add('regen');
        if (m.tempHP)
            types.add('tempHP');
        if (m.saveDice && typeof m.saveDice === 'object') {
            const sd = m.saveDice;
            if ((sd.body ?? 0) !== 0 || (sd.mind ?? 0) !== 0 || (sd.spirit ?? 0) !== 0)
                types.add('saveDice');
        }
        if (m.damageRider)
            types.add('damageRider');
        if (m.movementBonus)
            types.add('movementBonus');
    };
    visit(t.mechanics);
    for (const k of POWER_LEVEL_KEYS)
        visit(t.levels[k]?.mechanics);
    return [...types];
}
function makeEntry(t, chosen) {
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
        raw: t,
        sourceKind: 'template',
        sourceName: '',
    };
}
function specialLabel(key) {
    const hit = ALL_SPECIAL_EFFECTS.find((e) => e.id === key);
    if (hit)
        return hit.name.replace(/\(X\)/gi, '').trim();
    return key.charAt(0).toUpperCase() + key.slice(1);
}
// ─── Build ───────────────────────────────────────────────────────────────
function buildEntries() {
    const out = [];
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
let CACHED_ENTRIES = null;
export function getAllCatalogEntries() {
    if (!CACHED_ENTRIES)
        CACHED_ENTRIES = buildEntries();
    return CACHED_ENTRIES;
}
/** Invalidate the catalog cache (mainly for tests). */
export function _resetCatalogCache() {
    CACHED_ENTRIES = null;
}
// ─── Filter ──────────────────────────────────────────────────────────────
export function filterCatalog(filter) {
    const entries = getAllCatalogEntries();
    const term = (filter.search || '').trim().toLowerCase();
    const echoKey = (filter.actorEchoKey || '').trim().toLowerCase();
    return entries.filter((e) => {
        if (filter.category && e.category !== filter.category)
            return false;
        if (filter.subfamily && e.subfamily !== filter.subfamily)
            return false;
        if (filter.templateId && e.templateId !== filter.templateId)
            return false;
        if (filter.tier && e.tier !== filter.tier)
            return false;
        if (filter.special && !(e.specialKeys.includes(filter.special)))
            return false;
        if (filter.effectType && !e.effectTypes.includes(filter.effectType))
            return false;
        if (filter.tag && !e.tags.includes(filter.tag))
            return false;
        if (term) {
            const hay = `${e.name} ${e.templateName}`.toLowerCase();
            if (!hay.includes(term))
                return false;
        }
        if (e.requiresEcho && e.requiresEcho.length > 0) {
            if (!echoKey || !e.requiresEcho.includes(echoKey))
                return false;
        }
        return true;
    });
}
// ─── Option lookups ──────────────────────────────────────────────────────
/** Unique list of subfamilies within a category (sorted). */
export function getSubfamiliesByCategory(category) {
    const subs = new Set();
    for (const e of getAllCatalogEntries())
        if (e.category === category && e.subfamily)
            subs.add(e.subfamily);
    return [...subs].sort();
}
/** Unique list of templateIds in a (category, subfamily). */
export function getTemplatesBySubfamily(category, subfamily) {
    const seen = new Map();
    for (const e of getAllCatalogEntries()) {
        if (e.category !== category || e.subfamily !== subfamily)
            continue;
        if (!seen.has(e.templateId))
            seen.set(e.templateId, e.templateName);
    }
    return [...seen.entries()].map(([templateId, templateName]) => ({ templateId, templateName }));
}
/** @deprecated legacy — returns empty list (trees removed). */
export function getAllSourceNames() {
    return [];
}
export function getActiveTagOptions() {
    const tags = new Set();
    for (const e of getAllCatalogEntries()) {
        if (e.category !== 'active')
            continue;
        for (const t of e.tags)
            tags.add(t);
    }
    return [...tags].sort();
}
function buildLabeledSpecialList(keys) {
    return [...keys]
        .map((key) => ({ key, label: specialLabel(key) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
export function getActiveSpecialOptions() {
    return collectSpecialOptions((e) => e.category === 'active');
}
export function getAllSpecialOptions() {
    return collectSpecialOptions(() => true);
}
export function getVisibleSpecialOptions(filter) {
    const entries = filterCatalog({ ...filter });
    const keys = new Set();
    for (const e of entries)
        for (const k of e.specialKeys)
            keys.add(k);
    return buildLabeledSpecialList(keys);
}
export function getVisibleEffectTypeOptions(filter) {
    const entries = filterCatalog({ ...filter });
    const present = new Set();
    for (const e of entries)
        for (const t of e.effectTypes)
            present.add(t);
    return EFFECT_TYPE_KEYS.filter((k) => present.has(k)).map((k) => ({ key: k, label: EFFECT_TYPE_LABELS[k] }));
}
function collectSpecialOptions(predicate) {
    const keys = new Set();
    for (const e of getAllCatalogEntries()) {
        if (!predicate(e))
            continue;
        for (const k of e.specialKeys)
            keys.add(k);
    }
    return buildLabeledSpecialList(keys);
}
/** Lookup a catalog entry by its display name. Legacy sourceKind/sourceName are ignored. */
export function findCatalogEntryByName(name, _sourceKind, _sourceName) {
    return getAllCatalogEntries().find((e) => e.name === name);
}
/** Lookup the template behind a CatalogEntry. */
export function findTemplateById(templateId) {
    return ALL_POWER_TEMPLATES.find((t) => t.templateId === templateId);
}
//# sourceMappingURL=power-catalog.js.map