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
 *  - uiEffect    : UI-only Active Effect discovery filter
 *  - uiDelivery  : UI-only Active Delivery discovery filter
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
import {
    CANONICAL_PASSIVE_TEMPLATE_IDS,
    isCanonicalPassiveTemplateId,
    PASSIVE_SELECTION_GROUP_ORDER,
    PASSIVE_SELECTION_GROUPS,
} from './passive-selection-groups.js';
import {
    activeBuffMatchesUiFocus,
    activeMatchesUiDelivery,
    activeMatchesUiEffect,
} from './power-purchase-ui-filters.js';

/** Final Passive catalogue (28) — TOC order Offensive → Defensive → Utility. */
export const FINAL_PASSIVE_TEMPLATE_IDS: readonly string[] = PASSIVE_SELECTION_GROUP_ORDER.flatMap(
    (g) => PASSIVE_SELECTION_GROUPS[g],
);

export { CANONICAL_PASSIVE_TEMPLATE_IDS, isCanonicalPassiveTemplateId };

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

/**
 * Final Active Buff catalogue (`docs/Rules/active-buffs.md` TOC order).
 * New-Power pickers may only offer these 18; legacy templates remain in
 * `ACTIVE_BUFF_TEMPLATES` for owned items and direct `templateId` grants.
 */
export const FINAL_ACTIVE_BUFF_TEMPLATE_IDS = [
    'ab-armor',
    'ab-evade',
    'ab-armor-aura',
    'ab-temp-hp',
    'ab-damage-reduction',
    'ab-phasing',
    'ab-spell-resistance',
    'ab-cleanse-maintenance',
    'ab-invisibility',
    'ab-reinforced-parry',
    'ab-reinforced-damage-negation',
    'ab-damage',
    'ab-critical',
    'ab-damage-aura',
    'ab-summon-damage-aura',
    'ab-thorns',
    'ab-summon-armor-aura',
    'ab-intensified-absorption',
] as const;

export type FinalActiveBuffTemplateId = (typeof FINAL_ACTIVE_BUFF_TEMPLATE_IDS)[number];

const FINAL_ACTIVE_BUFF_INDEX = new Map<string, number>(
    FINAL_ACTIVE_BUFF_TEMPLATE_IDS.map((id, i) => [id, i]),
);

/** True when `templateId` is in the official 18-buff selection catalogue. */
export function isSelectableActiveBuffTemplateId(templateId: string | null | undefined): boolean {
    return FINAL_ACTIVE_BUFF_INDEX.has(String(templateId || '').trim());
}

/** Player-facing names for catalog subfamilies (not raw keys like `damage-single`). */
export const SUBFAMILY_LABELS: Record<string, string> = {
    'damage-single': 'Single-Target Special Attack',
    'damage-aoe': 'Area Special Attack',
    'weapon-attack': 'Weapon Attack',
    'weapon-single': 'Weapon Attack',
    control: 'Control & Movement',
    'hard-control': 'Hard Control',
    'persistent-zone': 'Zones & Persistent Effects',
    mixed: 'Mixed Effects',
    barrier: 'Barrier',
    illusion: 'Illusion',
    'support-heal': 'Heal',
    'support-cleanse': 'Cleanse',
    'support-dispel': 'Dispel',
};

export const SUBFAMILY_HINTS: Record<string, string> = {
    'damage-single': 'One target. Damage and Special come from the Power itself, not your weapon.',
    'damage-aoe': 'Hits an area. Damage and Special come from the Power itself, not your weapon.',
    'weapon-attack': 'Uses your equipped weapon’s damage dice and weapon Specials.',
    'weapon-single': 'Uses your equipped weapon’s damage dice and weapon Specials.',
    control: 'Locks down or repositions a target.',
    'hard-control': 'Stronger lock-down that spends more of the Power’s budget on control.',
    'persistent-zone': 'Leaves a zone or lasting field on the map.',
    mixed: 'Combines damage, support, or other riders in one Power.',
    barrier: 'Creates a wall, cover, or protective field.',
    illusion: 'Fakes presence, concealment, or a false effect.',
};

export function labelPowerSubfamily(key: string): string {
    const k = String(key || '').trim();
    if (!k) return '';
    if (SUBFAMILY_LABELS[k]) return SUBFAMILY_LABELS[k];
    return k
        .split('-')
        .map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
        .join(' ');
}

export function powerSubfamilyHint(key: string): string {
    return SUBFAMILY_HINTS[String(key || '').trim()] || '';
}

/**
 * Requirements for character creation per category.
 *
 * Starting character (Combat Package): **2 Passive (R4)**, **1 Active Buff (R4)**,
 * **1 Reaction (R4)**, **2 Active (R2)** — no Movement Power.
 */
export const CREATION_POWER_REQUIREMENTS: Record<PowerCategory, number> = {
    active: 2,
    passive: 2,
    activeBuff: 1,
    reaction: 1,
    movement: 0,
};

/**
 * PG "Starting Powers": Passives at creation = available Passive Slots.
 * MR 2 (default) → 2 Passives; MR 1 campaigns → 1 Passive.
 */
export function creationPowerRequirementsForMasteryRank(
    masteryRank: number,
): Record<PowerCategory, number> {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 2));
    return {
        ...CREATION_POWER_REQUIREMENTS,
        passive: mr <= 1 ? 1 : CREATION_POWER_REQUIREMENTS.passive,
    };
}

/** Total Powers at character creation (sum of requirements above). */
export const CREATION_POWER_TOTAL = 6;

/** Defensive powers (Passive ×2, Active Buff, Reaction) start at Rank 4. */
export const CREATION_DEFENSIVE_RANK = 4;

/** Offensive Actives start at Rank 2. */
export const CREATION_OFFENSIVE_RANK = 2;

/** Import fallback only. New characters start at MR 2; package Powers use the MR power-level cap (MR 2 → Level 4). */
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
export function resolvePowerCategoryFromItem(
    power: { system?: { category?: PowerCategory; powerType?: string } },
): PowerCategory | null {
    const sys = power.system || {};
    let cat: PowerCategory | undefined = sys.category;
    if (!cat) {
        const pt = sys.powerType;
        if (pt === 'buff') cat = 'activeBuff';
        else if (pt === 'utility') cat = 'active';
        else if (pt === 'active' || pt === 'passive' || pt === 'reaction' || pt === 'movement') {
            cat = pt;
        }
    }
    if (cat && cat in CREATION_POWER_REQUIREMENTS) return cat;
    return null;
}

/** Stable identity for duplicate detection (`templateId`, plus Special for Actives). */
export function powerIdentityKey(input: {
    templateId?: string;
    templateName?: string;
    category?: PowerCategory;
    chosenSpecial?: { key?: string } | null;
}): string {
    const tid = String(input.templateId || '').trim();
    if (tid) {
        const special = String(input.chosenSpecial?.key || '').trim();
        return special ? `${tid}::${special}` : tid;
    }
    const cat = String(input.category || '').trim();
    const name = String(input.templateName || '').trim();
    if (cat && name) return `${cat}::${name}`;
    return name;
}

export function powerIdentityKeyFromItem(
    item: { system?: { templateId?: string; templateName?: string; category?: PowerCategory; chosenSpecial?: { key?: string } } },
): string {
    const sys = item.system || {};
    return powerIdentityKey({
        templateId: sys.templateId,
        templateName: sys.templateName,
        category: sys.category,
        chosenSpecial: sys.chosenSpecial,
    });
}

export function powerIdentityKeyFromEntry(entry: CatalogEntry): string {
    return powerIdentityKey({
        templateId: entry.templateId,
        templateName: entry.templateName,
        category: entry.category,
        chosenSpecial: entry.chosenSpecial,
    });
}

/**
 * DF Core v0.9.9.1: an otherwise legal Ranged Active may use Spell Delivery
 * with or without a Special. Damage-only Spells are legal. Melee stays martial.
 */
export function activeTemplateCanBeSpell(templateId: string): boolean {
    if (!String(templateId || '').includes('active-ranged')) return false;
    return ALL_POWER_TEMPLATES.some((t) => t.templateId === templateId);
}

/** A configured Special means the Spell does not count against the special-less cap. */
export function powerHasConfiguredSpecial(input: {
    chosenSpecial?: { key?: string } | null;
    special?: string | null;
}): boolean {
    const key = String(input.chosenSpecial?.key || input.special || '').trim();
    return !!key && key !== 'none';
}

/** Up to Mastery Rank Spell Powers may lack a Special. */
export function speciallessSpellLimit(masteryRank: number): number {
    return Math.max(0, Math.floor(Number(masteryRank) || 0));
}

export function isSpeciallessSpellItem(item: { system?: any }): boolean {
    const sys = item?.system ?? {};
    if (sys.isSpell !== true) return false;
    return !powerHasConfiguredSpecial(sys);
}

export function countSpeciallessSpells(items: Array<{ system?: any }>): number {
    let n = 0;
    for (const item of items) {
        if (isSpeciallessSpellItem(item)) n += 1;
    }
    return n;
}

export function canLearnAnotherSpeciallessSpell(currentCount: number, masteryRank: number): boolean {
    return Math.max(0, Math.floor(Number(currentCount) || 0)) < speciallessSpellLimit(masteryRank);
}

export function collectOwnedPowerIdentityKeys(
    powers: Iterable<{ system?: { templateId?: string; templateName?: string; category?: PowerCategory; chosenSpecial?: { key?: string } } }>,
): Set<string> {
    const out = new Set<string>();
    for (const p of powers) {
        const k = powerIdentityKeyFromItem(p);
        if (k) out.add(k);
    }
    return out;
}

export function actorAlreadyHasPower(
    existingPowers: Iterable<{ system?: { templateId?: string; templateName?: string; category?: PowerCategory; chosenSpecial?: { key?: string } } }>,
    entry: CatalogEntry,
): boolean {
    const key = powerIdentityKeyFromEntry(entry);
    if (!key) return false;
    for (const p of existingPowers) {
        if (powerIdentityKeyFromItem(p) === key) return true;
    }
    return false;
}

/** @returns First duplicate label if any power appears more than once. */
export function findDuplicatePowerLabel(
    powers: Iterable<{ name?: string; system?: { templateId?: string; templateName?: string; category?: PowerCategory; chosenSpecial?: { key?: string } } }>,
): string | null {
    const seen = new Map<string, string>();
    for (const p of powers) {
        const key = powerIdentityKeyFromItem(p);
        if (!key) continue;
        const label = String(p.system?.templateName || p.name || key);
        if (seen.has(key)) return label;
        seen.set(key, label);
    }
    return null;
}

/** Count embedded power items by `PowerCategory` (legacy `powerType` fallback). */
export function countPowersByCategory(
    powers: Iterable<{ system?: { category?: PowerCategory; powerType?: string } }>,
): Record<PowerCategory, number> {
    const counts: Record<PowerCategory, number> = {
        active: 0,
        activeBuff: 0,
        movement: 0,
        reaction: 0,
        passive: 0,
    };
    for (const p of powers) {
        const cat = resolvePowerCategoryFromItem(p);
        if (cat) counts[cat]++;
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

    /**
     * UI-only Active discovery filter (Effect dropdown).
     * Matches templates whose purchase-UI metadata lists this effect.
     * Ignored when empty; does not change mechanical categories.
     */
    uiEffect?: string | null;
    /**
     * UI-only Active discovery filter (Delivery dropdown).
     * Matches templates whose purchase-UI metadata lists this delivery.
     */
    uiDelivery?: string | null;

    /**
     * UI-only Active Buff focus (`all` / `defensive` / `offensive`).
     * Empty or `all` keeps every approved buff; does not change mechanics.
     */
    uiActiveBuffFocus?: string | null;

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
    /** Actor's Echo sub-choice (e.g. bane-greenwarden). Also matches requiresEcho. */
    actorSubChoiceKey?: string | null;

    /**
     * Include `artifact-only` catalog tags (buff extension / empowerment, etc.).
     * Default false for Add Power pickers. Direct `templateId` lookups still
     * include them so artifact grants keep working.
     */
    includeArtifactOnly?: boolean;

    /**
     * Include Active Buffs outside the final 18-buff rulebook catalogue
     * (retired Healing, Combined buffs, Penetration, …). Default false for
     * pickers. Direct `templateId` lookups still resolve legacy templates.
     */
    includeNonFinalActiveBuffs?: boolean;

    /**
     * Include Passives outside the final 28-passive rulebook catalogue.
     * Default false for pickers. Direct `templateId` lookups still resolve
     * legacy / artifact-only templates.
     */
    includeNonFinalPassives?: boolean;
}

/**
 * Visible `<option>` label for a catalog entry.
 * Active Buffs use the canonical rulebook heading (`Active Buff: Armor`).
 */
export function catalogSelectOptionLabel(entry: CatalogEntry): string {
    if (entry.category === 'activeBuff' || entry.category === 'passive') {
        return String(entry.name || entry.templateName || entry.templateId).trim();
    }
    const badges: string[] = [];
    if (entry.chosenSpecial) badges.push(entry.chosenSpecial.key);
    const badgeStr = badges.length ? ` (${badges.join(', ')})` : '';
    const sub = labelPowerSubfamily(entry.subfamily);
    const subPart = sub ? ` · ${sub}` : '';
    return `${entry.templateName}${badgeStr}${subPart} [${CATEGORY_LABELS[entry.category]}]`;
}

/** Sort Active Buff entries into rulebook TOC order; other categories keep input order. */
export function sortCatalogEntriesForPicker(entries: CatalogEntry[]): CatalogEntry[] {
    return entries
        .map((e, i) => ({ e, i }))
        .sort((a, b) => {
            if (a.e.category === 'activeBuff' && b.e.category === 'activeBuff') {
                const aOrd = FINAL_ACTIVE_BUFF_INDEX.get(a.e.templateId) ?? 999;
                const bOrd = FINAL_ACTIVE_BUFF_INDEX.get(b.e.templateId) ?? 999;
                if (aOrd !== bOrd) return aOrd - bOrd;
            }
            return a.i - b.i;
        })
        .map(({ e }) => e);
}

/** True when the actor's Echo key or sub-choice satisfies an optional requiresEcho list. */
export function echoRequirementMet(
    requires: string[] | undefined,
    echoKey?: string | null,
    subChoiceKey?: string | null,
): boolean {
    if (!requires?.length) return true;
    const have = [echoKey, subChoiceKey]
        .map((k) => String(k || '').trim().toLowerCase())
        .filter(Boolean);
    return requires.some((r) => have.includes(r.toLowerCase()));
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
        if (m.spellResistance) types.add('spellResistance');
        if (m.cleanseMaintenance) types.add('cleanseMaintenance');
        if (m.tempHP) types.add('tempHP');
        if (m.damageRider) types.add('damageRider');
        if (m.movementBonus) types.add('movementBonus');
    };
    visit((t as any).mechanics);
    for (const k of POWER_LEVEL_KEYS) visit(t.levels[k as PowerLevelKey]?.mechanics);
    return [...types];
}

function makeEntry(t: PowerTemplate, chosen: ChosenSpecial | null): CatalogEntry {
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

/** Dispel actives are retired — cleanse covers table play; hide from all pickers. */
export function isDispelCatalogEntry(entry: { templateId: string; subfamily?: string; chosenSpecial?: { key: string } }): boolean {
    if (entry.templateId.includes('dispel')) return true;
    if (entry.subfamily === 'support-dispel') return true;
    if (entry.chosenSpecial?.key === 'dispel-magic') return true;
    return false;
}

function buildEntries(): CatalogEntry[] {
    const out: CatalogEntry[] = [];
    for (const t of ALL_POWER_TEMPLATES) {
        if (t.category === 'active' && t.specialSlot) {
            for (const key of t.specialSlot.eligibleSpecialKeys) {
                const entry = makeEntry(t, { key, tier: t.specialSlot.tier });
                if (isDispelCatalogEntry(entry)) continue;
                out.push(entry);
            }
            continue;
        }
        const entry = makeEntry(t, null);
        if (isDispelCatalogEntry(entry)) continue;
        out.push(entry);
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
    const subChoiceKey = (filter.actorSubChoiceKey || '').trim().toLowerCase();
    const filtered = entries.filter((e) => {
        if (filter.category && e.category !== filter.category) return false;
        if (filter.subfamily && e.subfamily !== filter.subfamily) return false;
        if (filter.templateId && e.templateId !== filter.templateId) return false;
        if (filter.tier && e.tier !== filter.tier) return false;
        if (filter.special && !(e.specialKeys.includes(filter.special))) return false;
        if (filter.uiEffect && !activeMatchesUiEffect(e.templateId, filter.uiEffect)) return false;
        if (filter.uiDelivery && !activeMatchesUiDelivery(e.templateId, filter.uiDelivery)) return false;
        if (
            e.category === 'activeBuff' &&
            filter.uiActiveBuffFocus &&
            !activeBuffMatchesUiFocus(e.templateId, filter.uiActiveBuffFocus)
        ) {
            return false;
        }
        if (filter.effectType && !e.effectTypes.includes(filter.effectType)) return false;
        if (filter.tag && !e.tags.includes(filter.tag)) return false;
        // Artifact-only meta-passives (e.g. "DR Buff Extension") must not appear
        // next to real "Damage Reduction" in Add Power — unless explicitly asked
        // or resolving a concrete templateId grant.
        if (
            !filter.includeArtifactOnly &&
            !filter.templateId &&
            e.tags.includes('artifact-only')
        ) {
            return false;
        }
        // Final Active Buff catalogue only — unless resolving a concrete templateId
        // (legacy owned powers / grants) or an explicit include flag.
        if (
            e.category === 'activeBuff' &&
            !filter.includeNonFinalActiveBuffs &&
            !filter.templateId &&
            !isSelectableActiveBuffTemplateId(e.templateId)
        ) {
            return false;
        }
        // Final Passive catalogue (28) — same gate pattern.
        if (
            e.category === 'passive' &&
            !filter.includeNonFinalPassives &&
            !filter.includeArtifactOnly &&
            !filter.templateId &&
            !isCanonicalPassiveTemplateId(e.templateId)
        ) {
            return false;
        }
        if (term) {
            const hay = `${e.name} ${e.templateName}`.toLowerCase();
            if (!hay.includes(term)) return false;
        }
        // Echo gates apply only when an actor Echo context is supplied. Bare
        // catalogue listings keep echo-locked identities (e.g. Passive: Thorns).
        if (e.requiresEcho && e.requiresEcho.length > 0 && (echoKey || subChoiceKey)) {
            if (!echoRequirementMet(e.requiresEcho, echoKey, subChoiceKey)) return false;
        }
        return true;
    });
    return sortCatalogEntriesForPicker(filtered);
}

/** Resolve a single catalog entry by template id and optional special key. */
export function findCatalogEntry(
    templateId: string,
    special?: string | null,
): CatalogEntry | null {
    const matches = filterCatalog({
        templateId,
        special: special ?? null,
    });
    if (matches.length === 0) return null;
    if (special) {
        return matches.find((m) => m.chosenSpecial?.key === special) ?? matches[0] ?? null;
    }
    return matches.find((m) => !m.chosenSpecial) ?? matches[0] ?? null;
}

// ─── Option lookups ──────────────────────────────────────────────────────

/** Unique list of subfamilies within a category (sorted). */
export function getSubfamiliesByCategory(category: PowerCategory): string[] {
    const subs = new Set<string>();
    // Use filterCatalog so artifact-only subfamilies (buff-extension, …) stay out of pickers.
    for (const e of filterCatalog({ category })) if (e.subfamily) subs.add(e.subfamily);
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
