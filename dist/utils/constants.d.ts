/**
 * Constants for the Mastery System
 * Based on Player's Guide v0.5.26
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
export declare const MAX_ATTRIBUTE = 80;
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
 * XP Costs for Progression (new spec).
 *
 *   Attributes — band cost = floor((nextValue - 1) / 8) + 1, going from 1 XP
 *       (values 1–8) up to 10 XP (values 73–80). `ATTRIBUTE` is the explicit
 *       lookup table; `attributeBandCost(next)` is the runtime helper.
 *
 *   Skills    — same banded table as Attributes (1 / 2 / … / 10 XP) instead
 *       of the old `R × SKILL_PER_RANK` ramp. `SKILL` aliases `ATTRIBUTE`.
 *
 *   Powers    — `cost = 2 × newLevel` for levels 1..16 (Players Guide
 *       "Power Costs": Level 1 = 2 XP … Level 16 = 32 XP). POWER_LEVEL[i] is
 *       the cost for buying level `i + 1`. `powerLevelCost(level)` is the helper.
 *
 *   Artifacts — flat 8 XP per +1 level (`ARTIFACT_LEVEL`). MR gating still
 *       limits the maximum reachable level (see `getMaxArtifactSystemLevelForMasteryRank`).
 */
export declare const XP_COSTS: {
    ATTRIBUTE: {
        min: number;
        max: number;
        cost: number;
    }[];
    readonly SKILL: {
        min: number;
        max: number;
        cost: number;
    }[];
    POWER_LEVEL: number[];
    ARTIFACT_LEVEL: number;
};
/** XP cost to raise an Attribute (or Skill) to `nextValue` (1..80). */
export declare function attributeBandCost(nextValue: number): number;
/** XP cost to raise a Power to `level` (1..16); `cost = 2 × level`. */
export declare function powerLevelCost(level: number): number;
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
 *  | 50 – 70      | 8  | Godlevel     |
 */
export declare const MR_ADVANCEMENT: {
    stones: number;
    mr: number;
    tier: string;
}[];
/**
 * Divine Scale label within MR8 (50–70 Stones). Returns `null` for any
 * Stone total below 50 (i.e. MR 7 or lower).
 */
export declare function getDivineScale(totalStones: number): 'Lesser God' | 'True God' | 'High God' | 'Apex God' | null;
/**
 * Attribute Check TN by source Mastery Rank (Player's Guide "Attribute Checks
 * Against Effects"): `TN = 8 × Source Mastery Rank`.
 */
export declare const ATTRIBUTE_CHECK_TN_BY_MR: Record<number, number>;
/** Attribute Check TN = 8 × Source Mastery Rank. */
export declare function attributeCheckTn(sourceMasteryRank: number): number;
export declare const ECHO_SPEEDS: Record<string, number>;
//# sourceMappingURL=constants.d.ts.map