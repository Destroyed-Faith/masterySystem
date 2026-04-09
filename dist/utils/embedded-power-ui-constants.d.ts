/**
 * Shared UI option lists and normalization for EmbeddedPowerData (artifact powers).
 */
import type { EmbeddedPowerData, PowerLevelKey, PowerLevelRow } from '../types/item.js';
export declare const EMBEDDED_POWER_RANGE_KINDS: readonly ["self", "touch", "melee", "distance"];
export declare const EMBEDDED_POWER_AOE_SHAPES: readonly ["none", "single", "weapon", "aura", "radius", "cone", "line", "burst"];
export declare const EMBEDDED_POWER_DURATION_KINDS: readonly ["instant", "rounds", "masteryRounds", "masteryRankRounds", "untilNextTurn", "scene"];
export declare const EMBEDDED_POWER_CATEGORIES: readonly ["active", "activeBuff", "utility", "movement", "reaction", "passive"];
export declare const EMBEDDED_POWER_ACTION_COSTS: readonly ["attack", "movement", "full", "reaction", "none", "utility"];
export declare const EMBEDDED_POWER_LIMIT_PERS: readonly ["round", "combat", "day", "week"];
/** Common power tags for embedded-power UI (Custom… allows any string). */
export declare const EMBEDDED_POWER_TAG_PRESETS: readonly ["spell", "charged", "stance", "movement", "summon", "ritual", "aura"];
export declare const EMBEDDED_POWER_LIMIT_USE_MAX = 6;
export declare function createEmptyPowerLevelRow(): PowerLevelRow;
/** Ensure all four level keys exist with sane defaults. */
export declare function ensurePowerLevels(power: {
    levels?: Record<string, unknown>;
}): Record<PowerLevelKey, PowerLevelRow>;
/** Assign stable `id` to any embedded power missing one (required for tree inheritance locks). */
export declare function ensureEmbeddedPowerIds(powers: EmbeddedPowerData[]): EmbeddedPowerData[];
export declare function normalizePowersForEditor(powers: unknown[] | null | undefined): EmbeddedPowerData[];
export declare function createDefaultEmbeddedPower(randomId?: string): EmbeddedPowerData;
//# sourceMappingURL=embedded-power-ui-constants.d.ts.map