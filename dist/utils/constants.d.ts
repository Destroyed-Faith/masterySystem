/**
 * Constants for the Mastery System
 * Based on Destroyed Faith DF Core v0.9.9.0
 */
export declare const EXPLODE_VALUE = 8;
export declare const RAISE_INCREMENT = 4;
/**
 * Auto-Raise: the roller may voluntarily shrink their dice pool in exchange
 * for guaranteed Raises. Each Auto-Raise removes this many dice from the pool
 * and grants +1 Raise on success. Applies to skill rolls, attack rolls, and
 * other generic rolls.
 */
export declare const AUTO_RAISE_DICE_COST = 4;
export declare const MIN_ATTRIBUTE = 0;
export declare const MAX_ATTRIBUTE = 40;
export declare const ATTACK_ACTIONS_PER_TURN = 1;
export declare const REACTIONS_PER_ROUND = 1;
export declare const MOVEMENT_PER_TURN = 1;
/** Normal base Speed in meters (Players Guide / agent.md v0.9.8). */
export declare const BASE_SPEED_M = 8;
export declare const HEALTH_BARS_COUNT = 6;
export declare const HEALTH_PENALTIES: number[];
/**
 * Percentage-of-pool dice penalties per broken health bar. Index = bar index
 * (0 = Healthy ⇒ 0 penalty). Each value is the *fraction* of the rolled pool
 * to subtract (floored, never below 0). Incapacitated (index 5) zeroes the
 * pool — the character is down and effectively cannot act.
 */
export declare const HEALTH_PENALTY_FRACTIONS: number[];
export declare const MAX_MASTERY_RANK = 8;
/** Initiative spent per Temporary Colorless Stone = this × Mastery Rank. */
export declare const INITIATIVE_PER_COLORLESS_STONE = 4;
export declare const CREATION: {
    ATTRIBUTE_DISTRIBUTION: readonly number[];
    ATTRIBUTE_ALLOWED_VALUES: readonly number[];
    SKILL_POINTS: number;
    MAX_ATTRIBUTE_AT_CREATION: number;
    MAX_SKILL_AT_CREATION: number;
    MIN_DISADVANTAGE_POINTS: number;
    MAX_DISADVANTAGE_POINTS: number;
};
export declare const MAX_POWER_LEVEL = 16;
/**
 * XP Costs for Progression (DF Core v0.9.9.0).
 *
 *   Attributes — compressed 1–40 scale. Cost of the new value:
 *       1–4 = 2, 5–8 = 4, …, 37–40 = 20. `attributeBandCost(next)` is the helper.
 *
 *   Skills — unchanged 1–32 bands of 8 (1 / 2 / 3 / 4 XP). Do not use the
 *       Attribute cost table for Skills. `skillBandCost(next)` is the helper.
 *
 *   Powers    — `cost = 2 × newLevel` for levels 1..16 (Players Guide
 *       "Power Costs": Level 1 = 2 XP … Level 16 = 32 XP). POWER_LEVEL[i] is
 *       the cost for buying level `i + 1`. `powerLevelCost(level)` is the helper.
 *
 *   Artifacts — cost by the **new** Artifact Level reached
 *       (`artifactLevelXpCost`): L1 free; L2–3 = 8; L4–6 = 16; L7–9 = 32;
 *       L10 = 64. One level per Upgrade Step. MR gating still limits the
 *       maximum reachable level (see `getMaxArtifactSystemLevelForMasteryRank`).
 */
export declare const XP_COSTS: {
    ATTRIBUTE: {
        min: number;
        max: number;
        cost: number;
    }[];
    SKILL: {
        min: number;
        max: number;
        cost: number;
    }[];
    POWER_LEVEL: number[];
    /** @deprecated Use `artifactLevelXpCost(newLevel)`. L2/L3 band cost. */
    ARTIFACT_LEVEL: number;
};
/** XP cost to raise an Attribute to `nextValue` on the compressed 1–40 scale. */
export declare function attributeBandCost(nextValue: number): number;
/**
 * XP cost to raise a Skill to `nextValue`.
 * Skills keep the pre-v0.9.9 bands: 1–8 = 1, 9–16 = 2, 17–24 = 3, 25–32 = 4.
 */
export declare function skillBandCost(nextValue: number): number;
/** XP cost to raise a Power to `level` (1..16); `cost = 2 × level`. */
export declare function powerLevelCost(level: number): number;
/**
 * XP cost to raise an Artifact to `newLevel` (cost of the level reached).
 * L1 free; L2–3 = 8; L4–6 = 16; L7–9 = 32; L10 = 64.
 */
export declare function artifactLevelXpCost(newLevel: number): number;
/** Total XP invested to bring an Artifact from Level 1 to `level`. */
export declare function totalArtifactXpToLevel(level: number): number;
/**
 * Mastery Rank Advancement (new spec — based on total Stone count).
 *
 *  | Total Stones | MR | Tier         |
 *  |--------------|----|--------------|
 *  | 1 – 7        | 2  | Adept        |
 *  | 8 – 13       | 3  | Expert       |
 *  | 14 – 20      | 4  | Master       |
 *  | 21 – 29      | 5  | Grandmaster  |
 *  | 30 – 39      | 6  | Legend       |
 *  | 40 – 49      | 7  | Mythic       |
 *  | 50 – 112     | 8  | God          |
 */
export declare const MR_ADVANCEMENT: {
    stones: number;
    mr: number;
    tier: string;
}[];
/**
 * Divine Scale label within MR8 (50–112 Stones). Returns `null` for any
 * Stone total below 50 (i.e. MR 7 or lower).
 */
export declare function getDivineScale(totalStones: number): 'Lesser God' | 'True God' | 'High God' | 'Apex God' | 'System Limit' | null;
/**
 * Standard Target Number for a Challenge / source Mastery Rank (v0.9.9.0):
 * `TN = (8 × MR) − 2`. Spell Base TN, Attribute Checks, Death Checks,
 * Stress Breakdown, and Ritual base TN all use this value.
 */
export declare function standardTnForMasteryRank(masteryRank: number): number;
/** @deprecated Use `standardTnForMasteryRank`. Kept so older imports still resolve. */
export declare const ATTRIBUTE_CHECK_TN_BY_MR: Record<number, number>;
/** Attribute Check TN = (8 × Source Mastery Rank) − 2. */
export declare function attributeCheckTn(sourceMasteryRank: number): number;
export declare const ECHO_SPEEDS: Record<string, number>;
//# sourceMappingURL=constants.d.ts.map