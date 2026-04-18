/**
 * Power Catalog – unified access to all selectable powers (Mastery Trees + Spell Schools)
 *
 * Provides a single flat list with normalized category / tag / special metadata so
 * the character-creation UI can filter powers without caring about their origin
 * (legacy PowerDefinition vs. new NewArtifactPowerData).
 */
import { ALL_MASTERY_POWERS } from './powers/index.js';
import { ALL_MAGIC_POWERS } from './magic-powers.js';
import { ALL_SPECIAL_EFFECTS } from './special-effects.js';
/** Category keys used in filter UI (in display order). */
export const CATEGORY_ORDER = [
    'active',
    'activeBuff',
    'movement',
    'reaction',
    'passive',
    'utility'
];
export const CATEGORY_LABELS = {
    active: 'Active',
    activeBuff: 'Active Buff',
    movement: 'Movement',
    reaction: 'Reaction',
    passive: 'Passive',
    utility: 'Utility'
};
/** Requirements for character creation – total 8 powers. */
export const CREATION_POWER_REQUIREMENTS = {
    active: 2,
    activeBuff: 1,
    movement: 1,
    reaction: 1,
    passive: 2,
    utility: 1
};
/** Legacy powerType → new category mapping. */
function mapLegacyPowerType(pt) {
    switch (pt) {
        case 'buff':
            return 'activeBuff';
        case 'active':
        case 'passive':
        case 'reaction':
        case 'movement':
        case 'utility':
            return pt;
        default:
            return 'active';
    }
}
/** True if the raw definition uses the new NewArtifactPowerData structure. */
function isNewPowerDefinition(p) {
    return p && typeof p === 'object' && typeof p.category === 'string' && typeof p.levels === 'object' && !Array.isArray(p.levels);
}
/** Normalize specials from a definition into a unique list of lowercase keys. */
function collectSpecialKeys(def) {
    const keys = new Set();
    if (isNewPowerDefinition(def)) {
        for (const levelKey of ['1', '2', '3', '4']) {
            const row = def.levels?.[levelKey];
            if (!row)
                continue;
            for (const s of row.specials || []) {
                if (s?.key)
                    keys.add(String(s.key).toLowerCase());
            }
        }
    }
    else {
        // Legacy format: levels[] has `special?: string` (free-form "Bleeding(2), Mark(1)" etc.)
        const legacy = def;
        for (const lvl of legacy.levels || []) {
            const raw = lvl.special;
            if (!raw || typeof raw !== 'string' || raw === '—')
                continue;
            // Split on commas, strip (X) and whitespace.
            for (const chunk of raw.split(',')) {
                const key = chunk.replace(/\([^)]*\)/g, '').trim().toLowerCase();
                if (key)
                    keys.add(key);
            }
        }
    }
    return Array.from(keys);
}
/** Map tree/school source → catalog entries. */
function buildEntries() {
    const entries = [];
    for (const p of ALL_MASTERY_POWERS) {
        const isNew = isNewPowerDefinition(p);
        const category = isNew
            ? p.category
            : mapLegacyPowerType(p.powerType);
        const sourceName = p.tree || '';
        const tags = isNew ? (p.tags || []) : [];
        entries.push({
            name: p.name,
            sourceKind: 'mastery',
            sourceName,
            category,
            tags: tags.map(t => String(t).toLowerCase()),
            specialKeys: collectSpecialKeys(p),
            description: p.description || '',
            raw: p
        });
    }
    for (const p of ALL_MAGIC_POWERS) {
        // ALL_MAGIC_POWERS is PowerDefinition[] (legacy) with `tree` set to the school name.
        const category = mapLegacyPowerType(p.powerType);
        entries.push({
            name: p.name,
            sourceKind: 'magic',
            sourceName: p.tree || '',
            category,
            // Spells are tagged as "spell" for the filter.
            tags: ['spell'],
            specialKeys: collectSpecialKeys(p),
            description: p.description || '',
            raw: p
        });
    }
    return entries;
}
let CACHED_ENTRIES = null;
/** All selectable powers across trees + schools. */
export function getAllCatalogEntries() {
    if (!CACHED_ENTRIES) {
        CACHED_ENTRIES = buildEntries();
    }
    return CACHED_ENTRIES;
}
/** Filter entries based on the provided criteria. */
export function filterCatalog(filter) {
    const entries = getAllCatalogEntries();
    const term = (filter.search || '').trim().toLowerCase();
    return entries.filter(e => {
        if (filter.category && e.category !== filter.category)
            return false;
        if (filter.tag && !e.tags.includes(filter.tag))
            return false;
        if (filter.special && !e.specialKeys.includes(filter.special))
            return false;
        if (term && !(e.name.toLowerCase().includes(term) || e.sourceName.toLowerCase().includes(term)))
            return false;
        return true;
    });
}
/** All tag values found on "active" powers (lowercased, unique, alphabetical). */
export function getActiveTagOptions() {
    const tags = new Set();
    for (const e of getAllCatalogEntries()) {
        if (e.category !== 'active')
            continue;
        for (const t of e.tags)
            tags.add(t);
    }
    return Array.from(tags).sort();
}
/** All special keys used by "active" powers (lowercased, unique, alphabetical + enriched by ALL_SPECIAL_EFFECTS). */
export function getActiveSpecialOptions() {
    const keys = new Set();
    for (const e of getAllCatalogEntries()) {
        if (e.category !== 'active')
            continue;
        for (const k of e.specialKeys)
            keys.add(k);
    }
    // Resolve pretty labels via ALL_SPECIAL_EFFECTS (fallback: capitalize key).
    const labelFor = (k) => {
        const hit = ALL_SPECIAL_EFFECTS.find(eff => eff.id === k || eff.name.toLowerCase().replace(/\(x\)/g, '').trim() === k);
        if (hit)
            return hit.name.replace(/\(X\)/gi, '').trim();
        return k.charAt(0).toUpperCase() + k.slice(1);
    };
    return Array.from(keys)
        .map(key => ({ key, label: labelFor(key) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
/** Look up a catalog entry by name across both sources (used by the dialog to fetch raw data). */
export function findCatalogEntryByName(name, sourceKind, sourceName) {
    return getAllCatalogEntries().find(e => e.name === name &&
        (!sourceKind || e.sourceKind === sourceKind) &&
        (!sourceName || e.sourceName === sourceName));
}
//# sourceMappingURL=power-catalog.js.map