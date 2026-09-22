/**
 * Constants for the Mastery System
 * Based on Destroyed Faith DF Core v0.9.9.0
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
// Attribute ranges — compressed scale (v0.9.9.0). Skills still cap at MR × 4 (max 32).
export const MIN_ATTRIBUTE = 0;
export const MAX_ATTRIBUTE = 40;
// Combat
export const ATTACK_ACTIONS_PER_TURN = 1;
export const REACTIONS_PER_ROUND = 1;
export const MOVEMENT_PER_TURN = 1;
/** Normal base Speed in meters (Players Guide / agent.md v0.9.8). */
export const BASE_SPEED_M = 8;
// Health bars
// Six health levels:
//   Healthy → Bruised → Injured → Wounded → Broken → Incapacitated.
// Each non-Incapacitated bar holds `Vitality × 4` boxes; Incapacitated is a
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
/** Initiative spent per Temporary Colorless Stone = this × Mastery Rank. */
export const INITIATIVE_PER_COLORLESS_STONE = 4;
// Character Creation
export const CREATION = {
    ATTRIBUTE_DISTRIBUTION: [4, 4, 3, 3, 2, 2, 2],
    ATTRIBUTE_ALLOWED_VALUES: [2, 3, 4],
    SKILL_POINTS: 40,
    MAX_ATTRIBUTE_AT_CREATION: 4,
    MAX_SKILL_AT_CREATION: 4,
    // Players Guide ~5158–5164: only the *maximum* of 8 Disadvantage Points
    // is canonical. Any minimum is a house rule and ships as 0 by default.
    MIN_DISADVANTAGE_POINTS: 0,
    MAX_DISADVANTAGE_POINTS: 8
};
// Power level cap (1..16). Per-MR caps live in `calculateMaxPowerLevel`.
export const MAX_POWER_LEVEL = 16;
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
export const XP_COSTS = {
    ATTRIBUTE: [
        { min: 1, max: 4, cost: 2 },
        { min: 5, max: 8, cost: 4 },
        { min: 9, max: 12, cost: 6 },
        { min: 13, max: 16, cost: 8 },
        { min: 17, max: 20, cost: 10 },
        { min: 21, max: 24, cost: 12 },
        { min: 25, max: 28, cost: 14 },
        { min: 29, max: 32, cost: 16 },
        { min: 33, max: 36, cost: 18 },
        { min: 37, max: 40, cost: 20 }
    ],
    SKILL: [
        { min: 1, max: 8, cost: 1 },
        { min: 9, max: 16, cost: 2 },
        { min: 17, max: 24, cost: 3 },
        { min: 25, max: 32, cost: 4 }
    ],
    POWER_LEVEL: [
        2, 4, 6, 8, 10, 12, 14, 16,
        18, 20, 22, 24, 26, 28, 30, 32
    ], // Levels 1-16, cost = 2 × newLevel
    /** @deprecated Use `artifactLevelXpCost(newLevel)`. L2/L3 band cost. */
    ARTIFACT_LEVEL: 8
};
/** XP cost to raise an Attribute to `nextValue` on the compressed 1–40 scale. */
export function attributeBandCost(nextValue) {
    const v = Math.max(1, Math.floor(Number(nextValue) || 1));
    if (v > MAX_ATTRIBUTE)
        return 0;
    return Math.floor((v - 1) / 4) * 2 + 2;
}
/**
 * XP cost to raise a Skill to `nextValue`.
 * Skills keep the pre-v0.9.9 bands: 1–8 = 1, 9–16 = 2, 17–24 = 3, 25–32 = 4.
 */
export function skillBandCost(nextValue) {
    const v = Math.max(1, Math.floor(Number(nextValue) || 1));
    if (v > 32)
        return 0;
    return Math.floor((v - 1) / 8) + 1;
}
/** XP cost to raise a Power to `level` (1..16); `cost = 2 × level`. */
export function powerLevelCost(level) {
    const l = Math.max(0, Math.floor(Number(level) || 0));
    if (l <= 0 || l > MAX_POWER_LEVEL)
        return 0;
    return 2 * l;
}
/**
 * XP cost to raise an Artifact to `newLevel` (cost of the level reached).
 * L1 free; L2–3 = 8; L4–6 = 16; L7–9 = 32; L10 = 64.
 */
export function artifactLevelXpCost(newLevel) {
    const l = Math.max(0, Math.floor(Number(newLevel) || 0));
    if (l <= 1)
        return 0;
    if (l <= 3)
        return 8;
    if (l <= 6)
        return 16;
    if (l <= 9)
        return 32;
    if (l === 10)
        return 64;
    return 0;
}
/** Total XP invested to bring an Artifact from Level 1 to `level`. */
export function totalArtifactXpToLevel(level) {
    const cap = Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
    let sum = 0;
    for (let l = 2; l <= cap; l++)
        sum += artifactLevelXpCost(l);
    return sum;
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
 *  | 50 – 112     | 8  | God          |
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
 * Divine Scale label within MR8 (50–112 Stones). Returns `null` for any
 * Stone total below 50 (i.e. MR 7 or lower).
 */
export function getDivineScale(totalStones) {
    const s = Math.max(0, Math.floor(Number(totalStones) || 0));
    if (s < 50)
        return null;
    if (s <= 55)
        return 'Lesser God';
    if (s <= 63)
        return 'True God';
    if (s <= 69)
        return 'High God';
    if (s <= 111)
        return 'Apex God';
    return 'System Limit';
}
/**
 * Standard Target Number for a Challenge / source Mastery Rank (v0.9.9.0):
 * `TN = (8 × MR) − 2`. Spell Base TN, Attribute Checks, Death Checks,
 * Stress Breakdown, and Ritual base TN all use this value.
 */
export function standardTnForMasteryRank(masteryRank) {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    return 8 * mr - 2;
}
/** @deprecated Use `standardTnForMasteryRank`. Kept so older imports still resolve. */
export const ATTRIBUTE_CHECK_TN_BY_MR = {
    1: 6, 2: 14, 3: 22, 4: 30, 5: 38, 6: 46, 7: 54, 8: 62
};
/** Attribute Check TN = (8 × Source Mastery Rank) − 2. */
export function attributeCheckTn(sourceMasteryRank) {
    return standardTnForMasteryRank(sourceMasteryRank);
}
// Echo base speeds
export const ECHO_SPEEDS = {
    human: 8,
    humans: 8,
    dwarf: 8,
    dwarfs: 8,
    halfling: 8,
    halflings: 8,
    elf: 8,
    elorian: 8,
    elorians: 8,
    sentinel: 8,
    sentinels: 8,
    titanborn: 8,
    dragonborn: 8,
    unbound: 8,
};
//# sourceMappingURL=constants.js.map