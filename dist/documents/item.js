/**
 * Extended Item document for Mastery System
 */
export class MasteryItem extends Item {
    /**
     * Augment the basic item data with additional dynamic data
     */
    prepareData() {
        super.prepareData();
        // Add any item-specific derived data here
        if (this.type === 'special') {
            this.prepareSpecialData();
        }
    }
    /**
     * Prepare Special (Power) specific data
     */
    prepareSpecialData() {
        const system = this.system;
        // Ensure tags is an array
        if (!Array.isArray(system.tags)) {
            system.tags = [];
        }
        // Ensure specials is an array
        if (!Array.isArray(system.specials)) {
            system.specials = [];
        }
    }
    /**
     * Check if this item can be used by an actor
     */
    canUse(actor) {
        const system = this.system;
        // Check mastery rank requirement
        if (system.requirements?.masteryRank) {
            const actorSystem = actor.system;
            const masteryRank = actorSystem.mastery?.rank || 0;
            if (masteryRank < system.requirements.masteryRank) {
                return false;
            }
        }
        // TODO: Check other requirements (stones, prerequisites, etc.)
        return true;
    }
    /**
     * Get the attribute to roll for this power
     */
    getRollAttribute() {
        const system = this.system;
        return system.roll?.attribute || 'might';
    }
    /**
     * Get the damage formula for this power
     */
    getDamageFormula() {
        const system = this.system;
        return system.roll?.damage || '';
    }
    /**
     * Get the healing formula for this power
     */
    getHealingFormula() {
        const system = this.system;
        return system.roll?.healing || '';
    }
    /**
     * Get the target number for this power
     */
    getTargetNumber() {
        const system = this.system;
        return system.roll?.tn || 0;
    }
    /**
     * Check if this power requires an action
     */
    requiresAction() {
        const system = this.system;
        return system.cost?.action || false;
    }
    /**
     * Check if this power requires movement
     */
    requiresMovement() {
        const system = this.system;
        return system.cost?.movement || false;
    }
    /**
     * Check if this power requires a reaction
     */
    requiresReaction() {
        const system = this.system;
        return system.cost?.reaction || false;
    }
    /**
     * Get stone cost for this power
     */
    getStoneCost() {
        const system = this.system;
        return system.cost?.stones || 0;
    }
    /**
     * Get charge cost for this power
     */
    getChargeCost() {
        const system = this.system;
        return system.cost?.charges || 0;
    }
    /**
     * Check if this is a spell
     */
    isSpell() {
        const system = this.system;
        return system.tags?.includes('spell') || false;
    }
    /**
     * Check if this is a charged power
     */
    isCharged() {
        const system = this.system;
        return system.tags?.includes('charged') || false;
    }
}
//# sourceMappingURL=item.js.map