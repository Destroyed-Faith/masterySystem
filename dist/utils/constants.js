/**
 * Constants for Mastery System
 */

// Dice mechanics
export const EXPLODE_VALUE = 8; // d8s explode on 8
export const RAISE_INCREMENT = 5; // Each raise = 5 over TN

// Initiative Shop costs
export const INITIATIVE_SHOP = {
  extraMovement: 2, // 2 initiative per meter
  initiativeSwap: 10, // 10 initiative to swap with another
  extraAttack: 15 // 15 initiative for extra attack
};

// Action economy
export const ACTIONS_PER_ROUND = {
  attack: 1,
  movement: 1,
  reaction: 1
};

// Stone costs (exponential)
export const STONE_COSTS = [1, 2, 4, 8]; // Level 1-4 power costs

// Mastery Ranks
export const MAX_MASTERY_RANK = 10;
export const DEFAULT_MASTERY_RANK = 2;

// Passive limits
export const MAX_PASSIVE_SLOTS = 8;

// Death & Dying
export const DEATH_SAVE_TN = 10;
export const MAX_DEATH_FAILURES = 3;

//# sourceMappingURL=constants.js.map
