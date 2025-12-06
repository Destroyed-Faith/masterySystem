/**
 * Passive Powers System for Mastery System
 *
 * Rules:
 * - 8 Passive Slots total
 * - Max active Passives = Mastery Rank
 * - Only 1 Passive per category can be active
 * - Categories: Armor, Evade, To-Hit, Damage, Roll, Save, Hit Point, Healing, Awareness, Attribute
 * - Set before Initiative roll, no switching during combat
 * - Effects apply automatically (no roll required)
 */
/**
 * Passive Power Categories
 */
export declare enum PassiveCategory {
    ARMOR = "armor",
    EVADE = "evade",
    TO_HIT = "toHit",
    DAMAGE = "damage",
    ROLL = "roll",
    SAVE = "save",
    HIT_POINT = "hitPoint",
    HEALING = "healing",
    AWARENESS = "awareness",
    ATTRIBUTE = "attribute"
}
/**
 * Passive Power Data
 */
export interface PassiveData {
    id: string;
    name: string;
    category: PassiveCategory;
    description: string;
    effects: PassiveEffect[];
    sourceItem?: string;
}
/**
 * Effect of a passive power
 */
export interface PassiveEffect {
    type: 'flat' | 'dice' | 'flag';
    target: string;
    value: number | string;
    condition?: string;
}
/**
 * Passive Slot State
 */
export interface PassiveSlot {
    slotIndex: number;
    passive: PassiveData | null;
    active: boolean;
}
/**
 * Get all passive slots for an actor
 */
export declare function getPassiveSlots(actor: any): PassiveSlot[];
/**
 * Get all available passive powers from actor's items
 */
export declare function getAvailablePassives(actor: any): PassiveData[];
/**
 * Slot a passive power
 * Validates category uniqueness and Mastery Rank limit
 */
export declare function slotPassive(actor: any, slotIndex: number, passiveId: string): Promise<boolean>;
/**
 * Unslot a passive power
 */
export declare function unslotPassive(actor: any, slotIndex: number): Promise<void>;
/**
 * Activate a slotted passive
 * Checks Mastery Rank limit
 */
export declare function activatePassive(actor: any, slotIndex: number): Promise<boolean>;
/**
 * Deactivate all passives (e.g., at end of combat)
 */
export declare function deactivateAllPassives(actor: any): Promise<void>;
/**
 * Get all active passive effects for an actor
 * Used for calculating derived stats
 */
export declare function getActivePassiveEffects(actor: any): PassiveEffect[];
/**
 * Apply passive effects to a stat calculation
 *
 * @param actor - The actor
 * @param target - Target stat (e.g., 'armor', 'evade', 'damage')
 * @param baseValue - Base value before passives
 * @returns Modified value with passive effects
 */
export declare function applyPassiveEffects(actor: any, target: string, baseValue: number): number;
/**
 * Get passive dice bonuses for rolls
 *
 * @param actor - The actor
 * @param rollType - Type of roll ('attack', 'damage', 'skill', etc.)
 * @returns Number of bonus dice to add
 */
export declare function getPassiveDiceBonus(actor: any, rollType: string): number;
/**
 * Check if actor has a specific passive flag
 *
 * @param actor - The actor
 * @param flagName - Flag to check (e.g., 'cannotBeSurprised', 'regeneration')
 * @returns True if flag is active
 */
export declare function hasPassiveFlag(actor: any, flagName: string): boolean;
//# sourceMappingURL=passives.d.ts.map