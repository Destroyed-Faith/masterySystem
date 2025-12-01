/**
 * Extended Item document for Mastery System
 */
export declare class MasteryItem extends Item {
    /**
     * Augment the basic item data with additional dynamic data
     */
    prepareData(): void;
    /**
     * Prepare Special (Power) specific data
     */
    prepareSpecialData(): void;
    /**
     * Check if this item can be used by an actor
     */
    canUse(actor: Actor): boolean;
    /**
     * Get the attribute to roll for this power
     */
    getRollAttribute(): string;
    /**
     * Get the damage formula for this power
     */
    getDamageFormula(): string;
    /**
     * Get the healing formula for this power
     */
    getHealingFormula(): string;
    /**
     * Get the target number for this power
     */
    getTargetNumber(): number;
    /**
     * Check if this power requires an action
     */
    requiresAction(): boolean;
    /**
     * Check if this power requires movement
     */
    requiresMovement(): boolean;
    /**
     * Check if this power requires a reaction
     */
    requiresReaction(): boolean;
    /**
     * Get stone cost for this power
     */
    getStoneCost(): number;
    /**
     * Get charge cost for this power
     */
    getChargeCost(): number;
    /**
     * Check if this is a spell
     */
    isSpell(): boolean;
    /**
     * Check if this is a charged power
     */
    isCharged(): boolean;
}
//# sourceMappingURL=item.d.ts.map