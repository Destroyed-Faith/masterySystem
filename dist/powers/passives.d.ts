/**
 * Passive Abilities System
 * Handles passive ability slots, activation, and management
 */
export interface PassiveSlot {
    slotIndex: number;
    passive: PassiveAbility | null;
    active: boolean;
}
export interface PassiveAbility {
    id: string;
    name: string;
    description: string;
    category: string;
    level?: number;
}
/**
 * Get all passive slots for an actor
 * Returns only as many slots as the actor's Mastery Rank
 */
export declare function getPassiveSlots(actor: Actor): PassiveSlot[];
/**
 * Get all available passive abilities for an actor
 * Gets passives from actor's items (powers with powerType 'passive')
 */
export declare function getAvailablePassives(actor: Actor): PassiveAbility[];
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