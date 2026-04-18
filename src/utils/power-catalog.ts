/**
 * Power Catalog – unified access to all selectable powers (Mastery Trees + Spell Schools)
 *
 * Provides a single flat list with normalized category / tag / special metadata so
 * the character-creation UI can filter powers without caring about their origin
 * (legacy PowerDefinition vs. new NewArtifactPowerData).
 */

import type { NewArtifactPowerData, PowerCategory } from '../types/item.js';
import { ALL_MASTERY_POWERS } from './powers/index.js';
import { ALL_MAGIC_POWERS } from './magic-powers.js';
import type { PowerDefinition } from './powers/types.js';
import { ALL_SPECIAL_EFFECTS } from './special-effects.js';

export type PowerSourceKind = 'mastery' | 'magic';

export interface CatalogEntry {
    name: string;
    sourceKind: PowerSourceKind;
    sourceName: string; // tree name or spell school name
    category: PowerCategory;
    tags: string[];
    specialKeys: string[]; // unique special keys (lowercased, e.g. "shock", "freeze")
    description: string;
    raw: NewArtifactPowerData | PowerDefinition; // original definition (for later rendering)
}

/** Category keys used in filter UI (in display order). */
export const CATEGORY_ORDER: PowerCategory[] = [
    'active',
    'activeBuff',
    'movement',
    'reaction',
    'passive',
    'utility'
];

export const CATEGORY_LABELS: Record<PowerCategory, string> = {
    active: 'Active',
    activeBuff: 'Active Buff',
    movement: 'Movement',
    reaction: 'Reaction',
    passive: 'Passive',
    utility: 'Utility'
};

/** Requirements for character creation – total 8 powers. */
export const CREATION_POWER_REQUIREMENTS: Record<PowerCategory, number> = {
    active: 2,
    activeBuff: 1,
    movement: 1,
    reaction: 1,
    passive: 2,
    utility: 1
};

/** Legacy powerType → new category mapping. */
function mapLegacyPowerType(pt: string | undefined): PowerCategory {
    switch (pt) {
        case 'buff':
            return 'activeBuff';
        case 'active':
        case 'passive':
        case 'reaction':
        case 'movement':
        case 'utility':
            return pt as PowerCategory;
        default:
            return 'active';
    }
}

/** True if the raw definition uses the new NewArtifactPowerData structure. */
function isNewPowerDefinition(p: any): p is NewArtifactPowerData {
    return p && typeof p === 'object' && typeof p.category === 'string' && typeof p.levels === 'object' && !Array.isArray(p.levels);
}

/** Normalize specials from a definition into a unique list of lowercase keys. */
function collectSpecialKeys(def: NewArtifactPowerData | PowerDefinition): string[] {
    const keys = new Set<string>();
    if (isNewPowerDefinition(def)) {
        for (const levelKey of ['1', '2', '3', '4'] as const) {
            const row = def.levels?.[levelKey];
            if (!row) continue;
            for (const s of row.specials || []) {
                if (s?.key) keys.add(String(s.key).toLowerCase());
            }
        }
    } else {
        // Legacy format: levels[] has `special?: string` (free-form "Bleeding(2), Mark(1)" etc.)
        const legacy = def as PowerDefinition;
        for (const lvl of legacy.levels || []) {
            const raw = (lvl as any).special;
            if (!raw || typeof raw !== 'string' || raw === '—') continue;
            // Split on commas, strip (X) and whitespace.
            for (const chunk of raw.split(',')) {
                const key = chunk.replace(/\([^)]*\)/g, '').trim().toLowerCase();
                if (key) keys.add(key);
            }
        }
    }
    return Array.from(keys);
}

/** Map tree/school source → catalog entries. */
function buildEntries(): CatalogEntry[] {
    const entries: CatalogEntry[] = [];

    for (const p of ALL_MASTERY_POWERS) {
        const isNew = isNewPowerDefinition(p);
        const category: PowerCategory = isNew
            ? (p as NewArtifactPowerData).category
            : mapLegacyPowerType((p as PowerDefinition).powerType);
        const sourceName = (p as any).tree || '';
        const tags: string[] = isNew ? ((p as NewArtifactPowerData).tags || []) : [];
        entries.push({
            name: p.name,
            sourceKind: 'mastery',
            sourceName,
            category,
            tags: tags.map(t => String(t).toLowerCase()),
            specialKeys: collectSpecialKeys(p),
            description: (p as any).description || '',
            raw: p
        });
    }

    for (const p of ALL_MAGIC_POWERS) {
        // ALL_MAGIC_POWERS is PowerDefinition[] (legacy) with `tree` set to the school name.
        const category = mapLegacyPowerType((p as PowerDefinition).powerType);
        entries.push({
            name: p.name,
            sourceKind: 'magic',
            sourceName: (p as any).tree || '',
            category,
            // Spells are tagged as "spell" for the filter.
            tags: ['spell'],
            specialKeys: collectSpecialKeys(p),
            description: (p as any).description || '',
            raw: p
        });
    }

    return entries;
}

let CACHED_ENTRIES: CatalogEntry[] | null = null;

/** All selectable powers across trees + schools. */
export function getAllCatalogEntries(): CatalogEntry[] {
    if (!CACHED_ENTRIES) {
        CACHED_ENTRIES = buildEntries();
    }
    return CACHED_ENTRIES;
}

export interface CatalogFilter {
    category?: PowerCategory | null;
    tag?: string | null; // lowercased
    special?: string | null; // lowercased special key
    search?: string | null; // free text
}

/** Filter entries based on the provided criteria. */
export function filterCatalog(filter: CatalogFilter): CatalogEntry[] {
    const entries = getAllCatalogEntries();
    const term = (filter.search || '').trim().toLowerCase();
    return entries.filter(e => {
        if (filter.category && e.category !== filter.category) return false;
        if (filter.tag && !e.tags.includes(filter.tag)) return false;
        if (filter.special && !e.specialKeys.includes(filter.special)) return false;
        if (term && !(e.name.toLowerCase().includes(term) || e.sourceName.toLowerCase().includes(term))) return false;
        return true;
    });
}

/** All tag values found on "active" powers (lowercased, unique, alphabetical). */
export function getActiveTagOptions(): string[] {
    const tags = new Set<string>();
    for (const e of getAllCatalogEntries()) {
        if (e.category !== 'active') continue;
        for (const t of e.tags) tags.add(t);
    }
    return Array.from(tags).sort();
}

/** All special keys used by "active" powers (lowercased, unique, alphabetical + enriched by ALL_SPECIAL_EFFECTS). */
export function getActiveSpecialOptions(): Array<{ key: string; label: string }> {
    const keys = new Set<string>();
    for (const e of getAllCatalogEntries()) {
        if (e.category !== 'active') continue;
        for (const k of e.specialKeys) keys.add(k);
    }
    // Resolve pretty labels via ALL_SPECIAL_EFFECTS (fallback: capitalize key).
    const labelFor = (k: string): string => {
        const hit = ALL_SPECIAL_EFFECTS.find(eff => eff.id === k || eff.name.toLowerCase().replace(/\(x\)/g, '').trim() === k);
        if (hit) return hit.name.replace(/\(X\)/gi, '').trim();
        return k.charAt(0).toUpperCase() + k.slice(1);
    };
    return Array.from(keys)
        .map(key => ({ key, label: labelFor(key) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

/** Look up a catalog entry by name across both sources (used by the dialog to fetch raw data). */
export function findCatalogEntryByName(name: string, sourceKind?: PowerSourceKind, sourceName?: string): CatalogEntry | undefined {
    return getAllCatalogEntries().find(e =>
        e.name === name &&
        (!sourceKind || e.sourceKind === sourceKind) &&
        (!sourceName || e.sourceName === sourceName)
    );
}
