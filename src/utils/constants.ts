/**
 * Constants for the Mastery System
 * Based on Player's Guide v0.5.26
 */

// Dice mechanics
export const EXPLODE_VALUE = 8;
export const RAISE_INCREMENT = 4; // Every +4 over TN = 1 Raise

/**
 * Auto-Raise: the roller may voluntarily shrink their dice pool in exchange
 * for guaranteed Raises. Each Auto-Raise removes this many dice from the pool
 * and grants +1 Raise on success. Applies to skill rolls, attack rolls, and
 * other generic rolls.
 */
export const AUTO_RAISE_DICE_COST = 4;

// Attribute ranges
export const MIN_ATTRIBUTE = 0;
export const MAX_ATTRIBUTE = 80; // Theoretical max per Player's Guide scaling table

// Combat
export const ATTACK_ACTIONS_PER_TURN = 1;
export const REACTIONS_PER_ROUND = 1;
export const MOVEMENT_PER_TURN = 1;
/** Normal base Speed in meters (Players Guide / agent.md v0.9.8). */
export const BASE_SPEED_M = 8;

// Health bars
// Six health levels:
//   Healthy → Bruised → Injured → Wounded → Broken → Incapacitated.
// Each non-Incapacitated bar holds `Vitality × 2` boxes; Incapacitated is a
// single-box "you go down at 0" state. Healthy carries no penalty; the other
// broken levels apply a dice-pool penalty that scales as a percentage of the
// active (already-reduced) pool, floored and never below a 1-die minimum:
//   −10% (Bruised), −20% (Injured), −40% (Wounded), −50% (Broken),
//   out cold (Incapacitated).
// `getCurrentPenalty` resolves the percentage against the active pool;
// HEALTH_PENALTIES is kept as a legacy fallback for code paths that need a
// flat per-bar dice penalty (the new percentage helper supersedes it).
export const HEALTH_BARS_COUNT = 6;
export const HEALTH_PENALTIES = [0, -1, -2, -4, -5, -6];
/**
 * Percentage-of-pool dice penalties per broken health bar. Index = bar index
 * (0 = Healthy ⇒ 0 penalty). Each value is the *fraction* of the rolled pool
 * to subtract (floored, never below 0). Incapacitated (index 5) zeroes the
 * pool — the character is down and effectively cannot act.
 */
export const HEALTH_PENALTY_FRACTIONS = [0, 0.1, 0.2, 0.4, 0.5, 1];

// Mastery ranks
export const MAX_MASTERY_RANK = 8;

// Initiative Shop costs
export const INITIATIVE_SHOP = {
    MOVEMENT: {
        COST: 4,
        INCREMENT: 2    // +2m per purchase
    },
    SWAP: {
        COST: 8         // Initiative swap (with consenting player)
    },
    EXTRA_REACTION: {
        COST: 12        // +1 reaction (max 1x/round)
    },
    REMOVE_STRESS: {
        COST: 16        // Remove 1d8 Stress
    },
    EXTRA_ATTACK: {
        COST: 20        // +1 attack (max 1x/round)
    }
};

// Character Creation
export const CREATION = {
    ATTRIBUTE_DISTRIBUTION: [8, 8, 6, 6, 4, 4, 2] as readonly number[],
    ATTRIBUTE_ALLOWED_VALUES: [2, 4, 6, 8] as readonly number[],
    SKILL_POINTS: 40,
    MAX_ATTRIBUTE_AT_CREATION: 8,
    MAX_SKILL_AT_CREATION: 4,
    // Players Guide ~5158–5164: only the *maximum* of 8 Disadvantage Points
    // is canonical. Any minimum is a house rule and ships as 0 by default.
    MIN_DISADVANTAGE_POINTS: 0,
    MAX_DISADVANTAGE_POINTS: 8
};

// Power level cap (1..16). Per-MR caps live in `calculateMaxPowerLevel`.
export const MAX_POWER_LEVEL = 16;

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
 *   Powers    — `cost = newLevel` for levels 1..16. POWER_LEVEL[i] is the
 *       cost for buying level `i + 1`. `powerLevelCost(level)` is the helper.
 *
 *   Artifacts — flat 8 XP per +1 level (`ARTIFACT_LEVEL`). MR gating still
 *       limits the maximum reachable level (see `getMaxArtifactSystemLevelForMasteryRank`).
 */
export const XP_COSTS = {
    ATTRIBUTE: [
        { min: 1, max: 8, cost: 1 },
        { min: 9, max: 16, cost: 2 },
        { min: 17, max: 24, cost: 3 },
        { min: 25, max: 32, cost: 4 },
        { min: 33, max: 40, cost: 5 },
        { min: 41, max: 48, cost: 6 },
        { min: 49, max: 56, cost: 7 },
        { min: 57, max: 64, cost: 8 },
        { min: 65, max: 72, cost: 9 },
        { min: 73, max: 80, cost: 10 }
    ],
    get SKILL() { return XP_COSTS.ATTRIBUTE; },
    POWER_LEVEL: [
        1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15, 16
    ], // Levels 1-16, cost = newLevel
    ARTIFACT_LEVEL: 8
};

/** XP cost to raise an Attribute (or Skill) to `nextValue` (1..80). */
export function attributeBandCost(nextValue: number): number {
    const v = Math.max(1, Math.floor(Number(nextValue) || 1));
    return Math.floor((v - 1) / 8) + 1;
}

/** XP cost to raise a Power to `level` (1..16); `cost = level`. */
export function powerLevelCost(level: number): number {
    const l = Math.max(0, Math.floor(Number(level) || 0));
    if (l <= 0 || l > MAX_POWER_LEVEL) return 0;
    return l;
}

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
export const MR_ADVANCEMENT = [
    { stones: 1, mr: 2, tier: 'Adept' },
    { stones: 8, mr: 3, tier: 'Expert' },
    { stones: 14, mr: 4, tier: 'Master' },
    { stones: 21, mr: 5, tier: 'Grandmaster' },
    { stones: 30, mr: 6, tier: 'Legend' },
    { stones: 40, mr: 7, tier: 'Mythic' },
    { stones: 50, mr: 8, tier: 'Godlevel' }
];

/**
 * Divine Scale label within MR8 (50–70 Stones). Returns `null` for any
 * Stone total below 50 (i.e. MR 7 or lower).
 */
export function getDivineScale(totalStones: number): 'Lesser God' | 'True God' | 'High God' | 'Apex God' | null {
    const s = Math.max(0, Math.floor(Number(totalStones) || 0));
    if (s < 50) return null;
    if (s <= 55) return 'Lesser God';
    if (s <= 63) return 'True God';
    if (s <= 69) return 'High God';
    return 'Apex God'; // 70+
}

/**
 * Attribute Check TN by source Mastery Rank (Player's Guide "Attribute Checks
 * Against Effects"): `TN = 8 × Source Mastery Rank`.
 */
export const ATTRIBUTE_CHECK_TN_BY_MR: Record<number, number> = {
    1: 8, 2: 16, 3: 24, 4: 32, 5: 40, 6: 48, 7: 56, 8: 64
};

/** Attribute Check TN = 8 × Source Mastery Rank. */
export function attributeCheckTn(sourceMasteryRank: number): number {
    const mr = Math.max(1, Math.floor(Number(sourceMasteryRank) || 1));
    return ATTRIBUTE_CHECK_TN_BY_MR[mr] ?? mr * 8;
}

// Echo base speeds
export const ECHO_SPEEDS: Record<string, number> = {
    human: 10,
    dwarf: 9,
    halfling: 8,
    elf: 12,
    elorian: 12,
    elorians: 12,
    sentinel: 10,
    titanborn: 12,
    centaur: 14,
    minotaur: 10,
    dragonborn: 10,
    unbound: 10
};

