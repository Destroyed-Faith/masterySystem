/**
 * System constants for Mastery System
 */
/**
 * Target Numbers for difficulty levels
 */
export declare const TARGET_NUMBERS: {
    readonly TRIVIAL: 8;
    readonly EASY: 12;
    readonly STANDARD: 16;
    readonly CHALLENGING: 20;
    readonly DIFFICULT: 24;
    readonly EXTREME: 28;
    readonly HEROIC: 32;
};
/**
 * Raise increment (each +4 TN = 1 Raise)
 */
export declare const RAISE_INCREMENT = 4;
/**
 * Dice explode value (d8 explodes on 8)
 */
export declare const EXPLODE_VALUE = 8;
/**
 * Dice type for rolls
 */
export declare const DICE_TYPE = "d8";
/**
 * Stone calculation (every 8 attribute points = 1 Stone)
 */
export declare const ATTRIBUTE_PER_STONE = 8;
/**
 * Health Bar multiplier (each bar = Vitality × 2)
 */
export declare const HEALTH_BAR_MULTIPLIER = 2;
/**
 * Starting attribute value at character creation
 */
export declare const STARTING_ATTRIBUTE = 2;
/**
 * Attribute points to distribute at creation
 */
export declare const CREATION_ATTRIBUTE_POINTS = 16;
/**
 * Skill points to distribute at creation
 */
export declare const CREATION_SKILL_POINTS = 22;
/**
 * Maximum attribute value at creation
 */
export declare const MAX_ATTRIBUTE_AT_CREATION = 8;
/**
 * Starting Mastery Rank
 */
export declare const STARTING_MASTERY_RANK = 2;
/**
 * Maximum Mastery Rank
 */
export declare const MAX_MASTERY_RANK = 8;
/**
 * Skill rank multiplier (max skill = Mastery Rank × 4)
 */
export declare const SKILL_RANK_MULTIPLIER = 4;
/**
 * AP values for Power types (Level 1-4)
 */
export declare const POWER_AP_CURVES: {
    readonly ACTIVE: readonly [30, 60, 90, 120];
    readonly BUFF: readonly [40, 70, 100, 130];
    readonly UTILITY: readonly [20, 40, 60, 80];
    readonly MOVEMENT: readonly [20, 40, 60, 80];
    readonly REACTION: readonly [20, 40, 60, 80];
    readonly PASSIVE: readonly [20, 40, 60, 80];
};
/**
 * Base movement speed in meters
 */
export declare const BASE_MOVEMENT_SPEED = 6;
/**
 * Base Evade value
 */
export declare const BASE_EVADE = 10;
/**
 * Action economy defaults
 */
export declare const DEFAULT_ACTIONS: {
    readonly MOVEMENT: 1;
    readonly ATTACK: 1;
    readonly REACTION: 1;
};
/**
 * Attribute names
 */
export declare const ATTRIBUTES: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
/**
 * Save types
 */
export declare const SAVE_TYPES: readonly ["body", "mind", "spirit"];
/**
 * Condition types that are diminishing
 */
export declare const DIMINISHING_CONDITIONS: readonly ["bleeding", "ignite", "mark", "poisoned", "corrode", "curse", "entangled", "freeze", "shock", "soulburn", "weaken", "hex"];
/**
 * Power types
 */
export declare const POWER_TYPES: readonly ["active", "buff", "utility", "passive", "reaction", "movement"];
/**
 * Initiative Shop costs and effects
 */
export declare const INITIATIVE_SHOP: {
    readonly MOVEMENT: {
        readonly COST: 4;
        readonly EFFECT: 2;
    };
    readonly SWAP: {
        readonly COST: 8;
        readonly RAISES_REQUIRED: 2;
    };
    readonly EXTRA_ATTACK: {
        readonly COST: 20;
        readonly MAX_PER_ROUND: 1;
    };
};
/**
 * Initiative is rolled each round using Mastery Dice
 * Base = Agility + Wits + Combat Reflexes skill
 * Roll = Mastery Rank d8s, keep all, 8s explode
 */
export declare const INITIATIVE: {
    readonly MIN_VALUE: 0;
    readonly HEAVY_WEAPON_PENALTY: -10;
};
//# sourceMappingURL=constants.d.ts.map