/**
 * Extended Actor document for Mastery System
 * Handles automatic calculation of derived values
 */
export declare class MasteryActor extends Actor {
    /**
     * Augment the basic actor data with additional dynamic data
     */
    prepareData(): void;
    /**
     * Prepare character-specific derived data
     */
    prepareCharacterData(): void;
    /**
     * Get the current health bar penalty
     */
    get currentPenalty(): number;
    /**
     * Get total HP across all bars
     */
    get totalHP(): number;
    /**
     * Get maximum HP across all bars
     */
    get maxHP(): number;
    /**
     * Apply damage to the actor
     */
    applyDamage(damage: number): Promise<void>;
    /**
     * Heal the actor
     * Healing only affects the current health bar
     */
    heal(healing: number): Promise<void>;
    /**
     * Get a skill value
     */
    getSkillValue(skillName: string): number;
    /**
     * Set a skill value
     */
    setSkillValue(skillName: string, value: number): Promise<void>;
    /**
     * Get the number of dice to roll for an attribute
     */
    getAttributeDice(attributeName: string): number;
    /**
     * Get the number of dice to keep (based on Mastery Rank)
     */
    getKeepDice(): number;
}
//# sourceMappingURL=actor.d.ts.map