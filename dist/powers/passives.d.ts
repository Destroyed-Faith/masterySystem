/**
 * Passive Abilities System
 * Handles passive ability slots, activation, and management
 */
/**
 * Mastery Rank at which each passive slot unlocks (Players Guide / passives.md).
 * MR1→1, MR2→2, MR3–4→3, MR5–6→4, MR7→5, MR8→6.
 */
export declare const PASSIVE_SLOT_UNLOCK_RANKS: readonly number[];
export declare const MAX_PASSIVE_SLOTS: number;
export interface PassiveSlot {
    slotIndex: number;
    passive: PassiveAbility | null;
    active: boolean;
    unlockMasteryRank: number;
    /** True when Mastery Rank is below this slot's unlock rank (still shown in UI). */
    locked: boolean;
}
export interface PassiveAbility {
    id: string;
    name: string;
    description: string;
    category: string;
    level?: number;
    /** Catalog templateId when known (selection-group browsing). */
    templateId?: string;
}
/** How many passive slots are available at the given Mastery Rank. */
export declare function getPassiveSlotCountForMasteryRank(masteryRank: number): number;
/** Mastery Rank required to unlock a slot index (0-based), or null if out of range. */
export declare function getPassiveSlotUnlockRank(slotIndex: number): number | null;
/**
 * All six Passive Slots for an actor (locked ones included so the UI can show
 * unlock ranks). Combat effects and auto-fill should skip `locked` slots.
 */
export declare function getPassiveSlots(actor: Actor): PassiveSlot[];
/**
 * Clear combat Passive slots whose power item was deleted (ghost slots block drops).
 * Safe to call often; no-ops when nothing is stale.
 */
export declare function pruneStalePassiveSlots(actor: Actor): Promise<number>;
/** Unlocked Passive Slots only (usable at current Mastery Rank). */
export declare function getUnlockedPassiveSlots(actor: Actor): PassiveSlot[];
/** Plain combat-facing blurb for a Passive power item (Available + slotted). */
export declare function formatPassiveDescription(item: any): string;
/**
 * World prototype + unlinked token actor often diverge: GM may grant a Passive on
 * the sheet while Combat Select Passives reads the other. Union both.
 */
export declare function passiveItemSourceActors(actor: Actor | null | undefined): Actor[];
/** True when a power item is a Passive (category, powerType, or catalog template). */
export declare function isPassivePowerItem(item: any): boolean;
/** Passive powers owned by the actor (sheet Passives + combat Available list). */
export declare function getAvailablePassives(actor: Actor): PassiveAbility[];
/** Find a Passive power item on the actor or its world/token counterpart. */
export declare function findPassivePowerItem(actor: Actor, passiveId: string): any | null;
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
/**
 * Rainbow "pick passives" prompt only when a slot is still empty and there is
 * a passive left to put in it, or Exchange Passive paid a swap.
 * A full set (no third slot, or nothing left to assign) stays quiet.
 */
export declare function passiveSlotsHaveOpenChoice(slots: Array<{
    passive?: unknown;
    locked?: boolean;
}>, availablePassiveCount: number, pendingSwaps: number): boolean;
export declare function getPendingPassiveSwaps(actor: Actor | null | undefined): number;
export declare function consumePendingPassiveSwap(actor: Actor): Promise<number>;
/**
 * Round 1 (and prepare) is free. Later rounds stay locked unless Exchange
 * Passive (or leftover swap tokens) has been paid this fight.
 */
export declare function canEditEncounterPassives(combat: Combat | null | undefined, actor: Actor | null | undefined): boolean;
//# sourceMappingURL=passives.d.ts.map