/**
 * Shared UI option lists and normalization for EmbeddedPowerData (artifact powers).
 */
import { isOldPowerStructure, migrateArtifactPower } from './power-migration.js';
export const EMBEDDED_POWER_RANGE_KINDS = ['self', 'touch', 'melee', 'distance'];
export const EMBEDDED_POWER_AOE_SHAPES = [
    'none',
    'single',
    'weapon',
    'aura',
    'radius',
    'cone',
    'line',
    'burst'
];
export const EMBEDDED_POWER_DURATION_KINDS = [
    'instant',
    'rounds',
    'masteryRounds',
    'masteryRankRounds',
    'untilNextTurn',
    'scene'
];
export const EMBEDDED_POWER_CATEGORIES = [
    'active',
    'activeBuff',
    'utility',
    'movement',
    'reaction',
    'passive'
];
export const EMBEDDED_POWER_ACTION_COSTS = ['attack', 'movement', 'full', 'reaction', 'none', 'utility'];
export const EMBEDDED_POWER_LIMIT_PERS = ['round', 'combat', 'day', 'week'];
/** Common power tags for embedded-power UI (Custom… allows any string). */
export const EMBEDDED_POWER_TAG_PRESETS = [
    'spell',
    'charged',
    'stance',
    'movement',
    'summon',
    'ritual',
    'aura'
];
export const EMBEDDED_POWER_LIMIT_USE_MAX = 6;
export function createEmptyPowerLevelRow() {
    return {
        type: '',
        range: null,
        aoe: null,
        duration: { kind: 'instant' },
        effect: { text: '' },
        specials: []
    };
}
function mergeLevelRow(row) {
    const base = createEmptyPowerLevelRow();
    if (!row || typeof row !== 'object')
        return base;
    const r = row;
    return {
        type: typeof r.type === 'string' ? r.type : base.type,
        range: r.range === undefined ? base.range : r.range,
        aoe: r.aoe === undefined ? base.aoe : r.aoe,
        duration: { ...base.duration, ...(r.duration || {}) },
        effect: {
            text: typeof r.effect?.text === 'string' ? r.effect.text : base.effect.text,
            dice: r.effect?.dice != null && String(r.effect.dice).trim() !== ''
                ? String(r.effect.dice)
                : undefined
        },
        specials: Array.isArray(r.specials) ? r.specials : [],
        trigger: typeof r.trigger === 'string' ? r.trigger : undefined,
        lvl: typeof r.lvl === 'number' ? r.lvl : undefined
    };
}
/** Ensure all four level keys exist with sane defaults. */
export function ensurePowerLevels(power) {
    const keys = ['1', '2', '3', '4'];
    const src = power.levels || {};
    const out = {};
    for (const k of keys) {
        out[k] = mergeLevelRow(src[k]);
    }
    return out;
}
function cloneJson(x) {
    return JSON.parse(JSON.stringify(x));
}
/**
 * Migrate legacy powers and normalize shape for the embedded-power editor.
 */
function randomIdFallback() {
    const fn = globalThis.foundry?.utils?.randomID;
    return typeof fn === 'function' ? fn() : `ep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
/** Assign stable `id` to any embedded power missing one (required for tree inheritance locks). */
export function ensureEmbeddedPowerIds(powers) {
    const used = new Set();
    for (const p of powers) {
        const id = p.id && String(p.id).trim();
        if (id)
            used.add(id);
    }
    return powers.map((p) => {
        const id = p.id && String(p.id).trim();
        if (id)
            return p;
        let nid;
        do {
            nid = randomIdFallback();
        } while (used.has(nid));
        used.add(nid);
        return { ...p, id: nid };
    });
}
export function normalizePowersForEditor(powers) {
    const arr = Array.isArray(powers) ? powers : [];
    const mapped = arr.map((p) => {
        const base = isOldPowerStructure(p) ? migrateArtifactPower(p) : cloneJson(p);
        const raw = base;
        const x = {
            ...raw,
            name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Unnamed',
            category: raw.category || 'active',
            tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
            cost: raw.cost && typeof raw.cost === 'object' ? { ...raw.cost } : {},
            levels: ensurePowerLevels(raw)
        };
        return x;
    });
    return ensureEmbeddedPowerIds(mapped);
}
export function createDefaultEmbeddedPower(randomId) {
    const id = randomId ?? globalThis.foundry?.utils?.randomID?.() ?? undefined;
    return {
        ...(id ? { id } : {}),
        name: 'New Power',
        category: 'active',
        tags: [],
        cost: { action: 'attack' },
        levels: {
            '1': createEmptyPowerLevelRow(),
            '2': createEmptyPowerLevelRow(),
            '3': createEmptyPowerLevelRow(),
            '4': createEmptyPowerLevelRow()
        }
    };
}
//# sourceMappingURL=embedded-power-ui-constants.js.map