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
/** Passive powers on the actor (items with powerType `passive`). */
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
/**
 * Choose default passive ids for empty slots. Deterministic per `seed`
 * (normally the actor id) so the first fight does not reshuffle.
 */
export declare function pickDefaultPassiveIds(available: Array<{
    id?: string | null;
}>, slotCount: number, seed: string): string[];
/**
 * If the actor has no slotted passives yet, fill unlocked slots from known
 * passives (all of them when they fit; otherwise a stable random subset).
 * Already-slotted picks are the saved default and are left alone.
 */
export declare function ensureDefaultPassiveSlots(actor: Actor): Promise<string[]>;
/** Stone Power `generic.exchangePassive` stores leftover mid-combat swaps here. */
export declare const EXCHANGE_PASSIVE_SWAPS_FLAG = "exchangePassiveSwapsPending";
export declare function getPendingPassiveSwaps(actor: Actor | null | undefined): number;
export declare function consumePendingPassiveSwap(actor: Actor): Promise<number>;
/**
 * Round 1 (and prepare) is free. Later rounds stay locked unless Exchange
 * Passive (or leftover swap tokens) has been paid this fight.
 */
export declare function canEditEncounterPassives(combat: Combat | null | undefined, actor: Actor | null | undefined): boolean;
//# sourceMappingURL=passives.d.ts.map