/**
 * Constants for the Mastery System
 */
// Dice mechanics
export const EXPLODE_VALUE = 8;
export const RAISE_INCREMENT = 5;
// Attribute ranges
export const MIN_ATTRIBUTE = 0;
export const MAX_ATTRIBUTE = 10;
// Combat
export const ACTIONS_PER_TURN = 2;
export const REACTIONS_PER_ROUND = 1;
export const MOVEMENT_POINTS_BASE = 6;
// Health bars
export const HEALTH_BARS_COUNT = 3;
export const DEFAULT_HEALTH_PER_BAR = 10;
// Mastery ranks
export const MAX_MASTERY_RANK = 4;
// Stone pools
export const STARTING_STONES = 8;
// Initiative Shop costs
export const INITIATIVE_SHOP = {
    MOVEMENT: {
        COST: 4, // Per 2m of movement
        INCREMENT: 2 // Movement increases by 2m per purchase
    },
    SWAP: {
        COST: 8 // Cost to unlock initiative swap (2 Raises, 1x/round)
    },
    EXTRA_ATTACK: {
        COST: 20 // Cost for extra attack (1x/round)
    }
};
// Character Creation
export const CREATION = {
    ATTRIBUTE_POINTS: 16,
    SKILL_POINTS: 16, // Configurable via CONFIG.creation.skillPoints
    MAX_ATTRIBUTE_AT_CREATION: 8,
    MAX_SKILL_AT_CREATION: 4,
    MAX_DISADVANTAGE_POINTS: 8
};
//# sourceMappingURL=constants.js.map