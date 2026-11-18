/**
 * Extended Actor document for Mastery System
 */
export declare class MasteryActor extends Actor {
    /** Legacy skill fields are quarantined instead of written (see legacy-skill-write-guard). */
    _preCreate(data: any, options: any, user: any): Promise<any>;
    _preUpdate(changed: any, options: any, user: any): Promise<any>;
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