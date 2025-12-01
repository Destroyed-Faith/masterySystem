/**
 * System constants for Mastery System
 */
/**
 * Target Numbers for difficulty levels
 */
export const TARGET_NUMBERS = {
    TRIVIAL: 8,
    EASY: 12,
    STANDARD: 16,
    CHALLENGING: 20,
    DIFFICULT: 24,
    EXTREME: 28,
    HEROIC: 32
};
/**
 * Raise increment (each +4 TN = 1 Raise)
 */
export const RAISE_INCREMENT = 4;
/**
 * Dice explode value (d8 explodes on 8)
 */
export const EXPLODE_VALUE = 8;
/**
 * Dice type for rolls
 */
export const DICE_TYPE = 'd8';
/**
 * Stone calculation (every 8 attribute points = 1 Stone)
 */
export const ATTRIBUTE_PER_STONE = 8;
/**
 * Health Bar multiplier (each bar = Vitality × 2)
 */
export const HEALTH_BAR_MULTIPLIER = 2;
/**
 * Starting attribute value at character creation
 */
export const STARTING_ATTRIBUTE = 2;
/**
 * Attribute points to distribute at creation
 */
export const CREATION_ATTRIBUTE_POINTS = 16;
/**
 * Skill points to distribute at creation
 */
export const CREATION_SKILL_POINTS = 22;
/**
 * Maximum attribute value at creation
 */
export const MAX_ATTRIBUTE_AT_CREATION = 8;
/**
 * Starting Mastery Rank
 */
export const STARTING_MASTERY_RANK = 2;
/**
 * Maximum Mastery Rank
 */
export const MAX_MASTERY_RANK = 8;
/**
 * Skill rank multiplier (max skill = Mastery Rank × 4)
 */
export const SKILL_RANK_MULTIPLIER = 4;
/**
 * AP values for Power types (Level 1-4)
 */
export const POWER_AP_CURVES = {
    ACTIVE: [30, 60, 90, 120],
    BUFF: [40, 70, 100, 130],
    UTILITY: [20, 40, 60, 80],
    MOVEMENT: [20, 40, 60, 80],
    REACTION: [20, 40, 60, 80],
    PASSIVE: [20, 40, 60, 80]
};
/**
 * Base movement speed in meters
 */
export const BASE_MOVEMENT_SPEED = 6;
/**
 * Base Evade value
 */
export const BASE_EVADE = 10;
/**
 * Action economy defaults
 */
export const DEFAULT_ACTIONS = {
    MOVEMENT: 1,
    ATTACK: 1,
    REACTION: 1
};
/**
 * Attribute names
 */
export const ATTRIBUTES = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits'
];
/**
 * Save types
 */
export const SAVE_TYPES = ['body', 'mind', 'spirit'];
/**
 * Condition types that are diminishing
 */
export const DIMINISHING_CONDITIONS = [
    'bleeding',
    'ignite',
    'mark',
    'poisoned',
    'corrode',
    'curse',
    'entangled',
    'freeze',
    'shock',
    'soulburn',
    'weaken',
    'hex'
];
/**
 * Power types
 */
export const POWER_TYPES = [
    'active',
    'buff',
    'utility',
    'passive',
    'reaction',
    'movement'
];
//# sourceMappingURL=constants.js.map