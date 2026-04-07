/**
 * Constants for the Mastery System
 * Based on Player's Guide v0.5.26
 */

// Dice mechanics
export const EXPLODE_VALUE = 8;
export const RAISE_INCREMENT = 4; // Every +4 over TN = 1 Raise

// Attribute ranges
export const MIN_ATTRIBUTE = 0;
export const MAX_ATTRIBUTE = 80; // Theoretical max per Player's Guide scaling table

// Combat
export const ATTACK_ACTIONS_PER_TURN = 1;
export const REACTIONS_PER_ROUND = 1;
export const MOVEMENT_PER_TURN = 1;

// Health bars
export const HEALTH_BARS_COUNT = 4; // Healthy, Bruised, Injured, Wounded
export const HEALTH_PENALTIES = [0, -1, -2, -4];

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
    SKILL_POINTS: 16,
    MAX_ATTRIBUTE_AT_CREATION: 8,
    MAX_SKILL_AT_CREATION: 4,
    MIN_DISADVANTAGE_POINTS: 2,
    MAX_DISADVANTAGE_POINTS: 8
};

// XP Costs for Progression
export const XP_COSTS = {
    ATTRIBUTE: [
        { min: 0, max: 8, cost: 1 },
        { min: 9, max: 16, cost: 2 },
        { min: 17, max: 24, cost: 3 },
        { min: 25, max: 32, cost: 4 }
    ],
    /** Multiplier for buying rank N: cost = N × SKILL_PER_RANK (1 → N XP per step). */
    SKILL_PER_RANK: 1,
    POWER_LEVEL: [2, 4, 8, 16, 24, 32, 40, 40, 40, 40, 40, 40], // Levels 1-12
    NEW_TREE: 1,
    ARTIFACT_ACCESS: 1,
    ARTIFACT_LEVEL: 8
};

// Mastery Rank Advancement (based on total Stone count)
export const MR_ADVANCEMENT = [
    { stones: 1, mr: 2, tier: 'Adept' },
    { stones: 8, mr: 3, tier: 'Expert' },
    { stones: 12, mr: 4, tier: 'Master' },
    { stones: 16, mr: 5, tier: 'Grandmaster' },
    { stones: 20, mr: 6, tier: 'Legend' }
];

// Saving Throw categories
export const SAVING_THROWS = {
    body: ['might', 'agility'],
    mind: ['intellect', 'wits'],
    spirit: ['resolve', 'influence']
};

// Save DC by source Mastery Rank
export const SAVE_DC_BY_MR: Record<number, number> = {
    1: 8, 2: 16, 3: 24, 4: 32, 5: 40, 6: 48
};

// Echo base speeds
export const ECHO_SPEEDS: Record<string, number> = {
    human: 10,
    dwarf: 9,
    halfling: 8,
    elf: 12,
    sentinel: 10,
    titanborn: 12,
    centaur: 14,
    minotaur: 10,
    dragonborn: 10,
    unbound: 10
};

