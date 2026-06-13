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
/**
 * Requirements for character creation per category.
 *
 * Starting character (Combat Package): **2 Passive (R4)**, **1 Active Buff (R4)**,
 * **1 Reaction (R4)**, **2 Active (R2)** — no Movement Power.
 */
export const CREATION_POWER_REQUIREMENTS = {
    active: 2,
    passive: 2,
    activeBuff: 1,
    reaction: 1,
    movement: 0,
};
/** Total Powers at character creation (sum of requirements above). */
export const CREATION_POWER_TOTAL = 6;
/** Defensive powers (Passive ×2, Active Buff, Reaction) start at Rank 4. */
export const CREATION_DEFENSIVE_RANK = 4;
/** Offensive Actives start at Rank 2. */
export const CREATION_OFFENSIVE_RANK = 2;
/** Mastery Rank set when the combat package is applied. */
export const CREATION_MASTERY_RANK = 4;
/** @deprecated Use CREATION_OFFENSIVE_RANK — only Actives are Rank 2 at creation. */
export const CREATION_POWERS_AT_RANK_2 = 2;
/** Aliases used by the Tower Wizard module (same rules as creation). */
export const TOWER_WIZARD_POWER_REQUIREMENTS = CREATION_POWER_REQUIREMENTS;
export const TOWER_WIZARD_POWER_TOTAL = CREATION_POWER_TOTAL;
export const TOWER_WIZARD_DEFENSIVE_RANK = CREATION_DEFENSIVE_RANK;
export const TOWER_WIZARD_OFFENSIVE_RANK = CREATION_OFFENSIVE_RANK;
export const TOWER_WIZARD_MASTERY_RANK = CREATION_MASTERY_RANK;
/** Resolve a power item's category (`system.category` with legacy `powerType` fallback). */
export function resolvePowerCategoryFromItem(power) {
    const sys = power.system || {};
    let cat = sys.category;
    if (!cat) {
        const pt = sys.powerType;
        if (pt === 'buff')
            cat = 'activeBuff';
        else if (pt === 'utility')
            cat = 'active';
        else if (pt === 'active' || pt === 'passive' || pt === 'reaction' || pt === 'movement') {
            cat = pt;
        }
    }
    if (cat && cat in CREATION_POWER_REQUIREMENTS)
        return cat;
    return null;
}
/** Stable identity for duplicate detection (`templateId`, plus Special for Actives). */
export function powerIdentityKey(input) {
    const tid = String(input.templateId || '').trim();
    if (tid) {
        const special = String(input.chosenSpecial?.key || '').trim();
        return special ? `${tid}::${special}` : tid;
    }
    const cat = String(input.category || '').trim();
    const name = String(input.templateName || '').trim();
    if (cat && name)
        return `${cat}::${name}`;
    return name;
}
export function powerIdentityKeyFromItem(item) {
    const sys = item.system || {};
    return powerIdentityKey({
        templateId: sys.templateId,
        templateName: sys.templateName,
        category: sys.category,
        chosenSpecial: sys.chosenSpecial,
    });
}
export function powerIdentityKeyFromEntry(entry) {
    return powerIdentityKey({
        templateId: entry.templateId,
        templateName: entry.templateName,
        category: entry.category,
        chosenSpecial: entry.chosenSpecial,
    });
}
export function collectOwnedPowerIdentityKeys(powers) {
    const out = new Set();
    for (const p of powers) {
        const k = powerIdentityKeyFromItem(p);
        if (k)
            out.add(k);
    }
    return out;
}
export function actorAlreadyHasPower(existingPowers, entry) {
    const key = powerIdentityKeyFromEntry(entry);
    if (!key)
        return false;
    for (const p of existingPowers) {
        if (powerIdentityKeyFromItem(p) === key)
            return true;
    }
    return false;
}
/** @returns First duplicate label if any power appears more than once. */
export function findDuplicatePowerLabel(powers) {
    const seen = new Map();
    for (const p of powers) {
        const key = powerIdentityKeyFromItem(p);
        if (!key)
            continue;
        const label = String(p.system?.templateName || p.name || key);
        if (seen.has(key))
            return label;
        seen.set(key, label);
    }
    return null;
}
/** Count embedded power items by `PowerCategory` (legacy `powerType` fallback). */
export function countPowersByCategory(powers) {
    const counts = {
        active: 0,
        activeBuff: 0,
        movement: 0,
        reaction: 0,
        passive: 0,
    };
    for (const p of powers) {
        const cat = resolvePowerCategoryFromItem(p);
        if (cat)
            counts[cat]++;
    }
    return counts;
}
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
    // Use the category-prefixed `t.name` (e.g. "Active Buff: Armor",
    // "Reaction: Armor", "Passive: Fortified Frame") as the unique lookup key,
    // so entries that share a `templateName` across categories (e.g. Reaction
    // "Armor" vs Active Buff "Armor") don't collide in
    // `findCatalogEntryByName`. The dropdown label still uses `templateName`
    // plus the category badge, so the user-facing presentation is unchanged.
    const baseName = t.name ?? t.templateName;
    const name = chosen ? `${baseName} — ${specialLabel(chosen.key)}` : baseName;
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
/** Resolve a single catalog entry by template id and optional special key. */
export function findCatalogEntry(templateId, special) {
    const matches = filterCatalog({
        templateId,
        special: special ?? null,
    });
    if (matches.length === 0)
        return null;
    if (special) {
        return matches.find((m) => m.chosenSpecial?.key === special) ?? matches[0] ?? null;
    }
    return matches.find((m) => !m.chosenSpecial) ?? matches[0] ?? null;
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