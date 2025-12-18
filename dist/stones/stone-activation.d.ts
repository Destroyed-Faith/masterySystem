/**
 * Stone Power Activation System
 *
 * Implements:
 * - Power registry with attribute associations
 * - Exponential cost calculation (1, 2, 4, 8, 16...)
 * - Pool deduction and round state updates
 */
import { type AttributeKey } from '../combat/action-economy.js';
import { STONE_POWERS, type StonePower } from './stone-powers.js';
export { STONE_POWERS, type StonePower };
/**
 * Activate a stone power
 *
 * @param actor The actor using the power
 * @param combatant The combatant in combat
 * @param abilityId The stone power ID
 * @param attributeKey For generic powers, which attribute pool to use
 * @returns true if successful, false if failed (insufficient stones, etc.)
 */
export declare function activateStonePower(options: {
    actor: Actor;
    combatant: Combatant;
    abilityId: string;
    attributeKey?: AttributeKey;
}): Promise<boolean>;
/**
 * Get available stone powers for an actor
 * (could filter based on mastery rank, unlocked powers, etc.)
 */
export declare function getAvailableStonePowers(_actor: Actor): StonePower[];
//# sourceMappingURL=stone-activation.d.ts.map