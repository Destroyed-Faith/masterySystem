/**
 * Extended Actor document for Mastery System
 */
export declare class MasteryActor extends Actor {
    /**
     * Augment the basic actor data with additional dynamic data
     */
    prepareData(): void;
    /**
     * Prepare base data for the actor (attributes, stones, etc.)
     */
    prepareBaseData(): void;
    /**
     * Prepare derived equipment data (armorTotal, evadeTotal, etc.)
     */
    prepareDerivedData(): void;
    /**
     * Heal the actor
     */
    heal(amount: number): Promise<void>;
    /**
     * Apply damage to the actor
     */
    applyDamage(amount: number): Promise<void>;
}
//# sourceMappingURL=actor.d.ts.map