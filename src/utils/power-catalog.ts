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

/** Canonical set of accepted Special keys. Anything outside this set is
 * considered a descriptive / conditional phrase (e.g. "if-target-marked",
 * "expose-on-hit") and is filtered out so the Power Picker only surfaces
 * real, actionable Specials. */
const CANONICAL_SPECIAL_IDS: ReadonlySet<string> = new Set(
    ALL_SPECIAL_EFFECTS.map(e => e.id)
);

function isCanonicalSpecial(key: string): boolean {
    return CANONICAL_SPECIAL_IDS.has(key);
}

export type PowerSourceKind = 'mastery' | 'magic';

export interface CatalogEntry {
    name: string;
    sourceKind: PowerSourceKind;
    sourceName: string; // tree name or spell school name
    category: PowerCategory;
    tags: string[];
    specialKeys: string[]; // unique special keys (lowercased, e.g. "shock", "freeze")
    /** Structural effect-types derived from mechanics blocks on any level.
     *  Feeds the "Effect Type" filter in the Power Picker. Keys match
     *  EFFECT_TYPE_KEYS below (e.g. "armor", "evade", "damageRider"). */
    effectTypes: string[];
    description: string;
    /** Optional echo-gating: entry is only visible if the actor's Echo key matches one of these values (lowercased). */
    requiresEcho?: string[];
    raw: NewArtifactPowerData | PowerDefinition; // original definition (for later rendering)
}

/** Keys used for the "Effect Type" filter in the Power Picker. Derived
 * entirely from the mechanics block that was attached by the translation
 * engine. The actual label shown in the UI is provided via EFFECT_TYPE_LABELS. */
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

/** Category keys used in filter UI (in display order). */
export const CATEGORY_ORDER: PowerCategory[] = [
    'active',
    'activeBuff',
    'movement',
    'reaction',
    'passive'
];

export const CATEGORY_LABELS: Record<PowerCategory, string> = {
    active: 'Active',
    activeBuff: 'Active Buff',
    movement: 'Movement',
    reaction: 'Reaction',
    passive: 'Passive'
};

/** Requirements for character creation – total 7 powers. */
export const CREATION_POWER_REQUIREMENTS: Record<PowerCategory, number> = {
    active: 2,
    activeBuff: 1,
    movement: 1,
    reaction: 1,
    passive: 2
};

/** Legacy powerType → new category mapping. Utility is retired; map to active for safety. */
function mapLegacyPowerType(pt: string | undefined): PowerCategory {
    switch (pt) {
        case 'buff':
            return 'activeBuff';
        case 'active':
        case 'passive':
        case 'reaction':
        case 'movement':
            return pt as PowerCategory;
        case 'utility':
            return 'active';
        default:
            return 'active';
    }
}

/** True if the raw definition uses the new NewArtifactPowerData structure. */
function isNewPowerDefinition(p: any): p is NewArtifactPowerData {
    return p && typeof p === 'object' && typeof p.category === 'string' && typeof p.levels === 'object' && !Array.isArray(p.levels);
}

/** Walk every level's `mechanics` block and collect the structural effect
 * types that are present. Used for the "Effect Type" picker filter. */
function collectEffectTypes(def: NewArtifactPowerData | PowerDefinition): string[] {
    const types = new Set<string>();
    const visit = (m: any) => {
        if (!m || typeof m !== 'object') return;
        if (m.armor !== undefined && m.armor !== 0) types.add('armor');
        if (m.evade !== undefined && m.evade !== 0) types.add('evade');
        if (m.initiativeD8 !== undefined && m.initiativeD8 !== 0) types.add('initiativeD8');
        if (m.regen !== undefined && m.regen !== 0) types.add('regen');
        if (m.tempHP !== undefined && m.tempHP !== 0 && m.tempHP !== '') types.add('tempHP');
        if (m.saveDice && typeof m.saveDice === 'object') {
            const sd = m.saveDice;
            if ((sd.body ?? 0) !== 0 || (sd.mind ?? 0) !== 0 || (sd.spirit ?? 0) !== 0) types.add('saveDice');
        }
        if (m.damageRider && typeof m.damageRider === 'object') types.add('damageRider');
        if (m.movementBonus !== undefined && m.movementBonus !== 0) types.add('movementBonus');
    };
    if (isNewPowerDefinition(def)) {
        visit((def as any).mechanics);
        for (const levelKey of ['1', '2', '3', '4'] as const) {
            const row: any = def.levels?.[levelKey];
            visit(row?.mechanics);
        }
    } else {
        visit((def as any).mechanics);
        for (const lvl of (def as PowerDefinition).levels || []) {
            visit((lvl as any).mechanics);
        }
    }
    return Array.from(types);
}

/** Normalize specials from a definition into a unique list of lowercase keys.
 * Only canonical Special IDs (see CANONICAL_SPECIAL_IDS) are kept — descriptive
 * or conditional phrases like "if-target-marked" or "expose-on-hit" are
 * intentionally dropped so the Power Picker Specials filter shows only
 * actionable, player-usable Specials. */
function collectSpecialKeys(def: NewArtifactPowerData | PowerDefinition): string[] {
    const keys = new Set<string>();
    if (isNewPowerDefinition(def)) {
        for (const levelKey of ['1', '2', '3', '4'] as const) {
            const row = def.levels?.[levelKey];
            if (!row) continue;
            for (const s of row.specials || []) {
                if (!s?.key) continue;
                const key = String(s.key).toLowerCase();
                if (isCanonicalSpecial(key)) keys.add(key);
            }
        }
    } else {
        // Legacy format: levels[] has `special?: string` (free-form "Bleeding(2), Mark(1)" etc.)
        const legacy = def as PowerDefinition;
        for (const lvl of legacy.levels || []) {
            const raw = (lvl as any).special;
            if (!raw || typeof raw !== 'string' || raw === '—') continue;
            for (const chunk of raw.split(',')) {
                const key = chunk.replace(/\([^)]*\)/g, '').trim().toLowerCase();
                if (key && isCanonicalSpecial(key)) keys.add(key);
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
        const rawEcho = (p as any).requiresEcho as string[] | undefined;
        const requiresEcho = rawEcho && rawEcho.length
            ? rawEcho.map(k => String(k).toLowerCase())
            : undefined;
        entries.push({
            name: p.name,
            sourceKind: 'mastery',
            sourceName,
            category,
            tags: tags.map(t => String(t).toLowerCase()),
            specialKeys: collectSpecialKeys(p),
            effectTypes: collectEffectTypes(p),
            description: (p as any).description || '',
            requiresEcho,
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
            effectTypes: collectEffectTypes(p),
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
    /** Structural effect type from the mechanics block (e.g. "armor", "damageRider"). */
    effectType?: string | null;
    search?: string | null; // free text
    /**
     * Actor's Echo key (e.g. "dragonborn"). Echo-gated entries are only returned
     * when their requiresEcho list contains this key (case-insensitive).
     * If undefined/null, echo-gated entries are hidden (safe default for non-actor contexts).
     */
    actorEchoKey?: string | null;
}

/** Filter entries based on the provided criteria. */
export function filterCatalog(filter: CatalogFilter): CatalogEntry[] {
    const entries = getAllCatalogEntries();
    const term = (filter.search || '').trim().toLowerCase();
    const echoKey = (filter.actorEchoKey || '').trim().toLowerCase();
    return entries.filter(e => {
        if (filter.category && e.category !== filter.category) return false;
        if (filter.tag && !e.tags.includes(filter.tag)) return false;
        if (filter.special && !e.specialKeys.includes(filter.special)) return false;
        if (filter.effectType && !e.effectTypes.includes(filter.effectType)) return false;
        if (term && !(e.name.toLowerCase().includes(term) || e.sourceName.toLowerCase().includes(term))) return false;
        if (e.requiresEcho && e.requiresEcho.length > 0) {
            if (!echoKey || !e.requiresEcho.includes(echoKey)) return false;
        }
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
    return collectSpecialOptions(e => e.category === 'active');
}

/** All special keys used by any catalog entry (unique, sorted). */
export function getAllSpecialOptions(): Array<{ key: string; label: string }> {
    return collectSpecialOptions(() => true);
}

/** Specials present on the *visible* subset of entries (respects category /
 * tag / actor-echo filters). Used by the Power Picker to auto-hide Specials
 * that would yield an empty result list. The `special` field of `filter` is
 * intentionally ignored so we don't depend on the currently-selected special
 * to compute the choices. */
export function getVisibleSpecialOptions(
    filter: Omit<CatalogFilter, 'special'>,
): Array<{ key: string; label: string }> {
    const effective: CatalogFilter = { ...filter };
    const entries = filterCatalog(effective);
    const keys = new Set<string>();
    for (const e of entries) {
        for (const k of e.specialKeys) keys.add(k);
    }
    return buildLabeledSpecialList(keys);
}

/** Effect types present on the *visible* subset of entries (respects all
 * filters except `effectType` itself so the dropdown isn't self-referential).
 * Used by the Power Picker to auto-hide types with no matching Power. */
export function getVisibleEffectTypeOptions(
    filter: Omit<CatalogFilter, 'effectType'>,
): Array<{ key: string; label: string }> {
    const effective: CatalogFilter = { ...filter };
    const entries = filterCatalog(effective);
    const present = new Set<string>();
    for (const e of entries) {
        for (const t of e.effectTypes) present.add(t);
    }
    return EFFECT_TYPE_KEYS
        .filter(k => present.has(k))
        .map(k => ({ key: k, label: EFFECT_TYPE_LABELS[k] }));
}

function buildLabeledSpecialList(keys: Set<string>): Array<{ key: string; label: string }> {
    const labelFor = (k: string): string => {
        const hit = ALL_SPECIAL_EFFECTS.find(eff => eff.id === k || eff.name.toLowerCase().replace(/\(x\)/g, '').trim() === k);
        if (hit) return hit.name.replace(/\(X\)/gi, '').trim();
        return k.charAt(0).toUpperCase() + k.slice(1);
    };
    return Array.from(keys)
        .map(key => ({ key, label: labelFor(key) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

function collectSpecialOptions(predicate: (e: CatalogEntry) => boolean): Array<{ key: string; label: string }> {
    const keys = new Set<string>();
    for (const e of getAllCatalogEntries()) {
        if (!predicate(e)) continue;
        for (const k of e.specialKeys) keys.add(k);
    }
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
