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
 */
export declare function getPassiveSlots(actor: Actor): PassiveSlot[];
/**
 * Get all available passive abilities for an actor
 * This would typically come from the actor's mastery trees and powers
 */
export declare function getAvailablePassives(_actor: Actor): PassiveAbility[];
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