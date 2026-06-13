/**
 * Passive Abilities System
 * Handles passive ability slots, activation, and management
 */
/** Mastery Rank at which each passive slot unlocks (max 4 slots). */
export declare const PASSIVE_SLOT_UNLOCK_RANKS: readonly number[];
export declare const MAX_PASSIVE_SLOTS: number;
export interface PassiveSlot {
    slotIndex: number;
    passive: PassiveAbility | null;
    active: boolean;
    unlockMasteryRank: number;
}
export interface PassiveAbility {
    id: string;
    name: string;
    description: string;
    category: string;
    level?: number;
}
/** How many passive slots are available at the given Mastery Rank. */
export declare function getPassiveSlotCountForMasteryRank(masteryRank: number): number;
/** Mastery Rank required to unlock a slot index (0-based), or null if out of range. */
export declare function getPassiveSlotUnlockRank(slotIndex: number): number | null;
/**
 * Get all passive slots for an actor
 * Returns slots unlocked by Mastery Rank (MR 1/2/4/6 → up to 4 slots).
 */
export declare function getPassiveSlots(actor: Actor): PassiveSlot[];
/**
 * Get all available passive abilities for an actor
 * Gets passives from actor's items (powers with powerType 'passive')
 */
export declare function getAvailablePassives(actor: Actor): PassiveAbility[];
/**
 * Item ids (or legacy fallbacks stored on slotted passive) already placed in a passive slot.
 * Used so the combat passive UI still lists other passives from the same tree.
 */
export declare function getSlottedPassiveIds(actor: Actor): Set<string>;
/**
 * Slot a passive ability into a slot
 */
export declare function slotPassive(actor: Actor, slotIndex: number, passiveId: string): Promise<void>;
/**
 * Activate or deactivate a passive in a slot
 */
export declare function activatePassive(actor: Actor, slotIndex: number): Promise<void>;
/**
 * Remove a passive from a slot
 */
export declare function unslotPassive(actor: Actor, slotIndex: number): Promise<void>;
//# sourceMappingURL=passives.d.ts.map