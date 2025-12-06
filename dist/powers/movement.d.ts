/**
 * Movement Powers System for Mastery System
 *
 * Rules from rulebook (Lines 4636-4642):
 *
 * Movement Powers:
 * - Replace your normal Movement for the round
 * - Cost: 1 Movement Action
 * - Roll: Only required if movement includes an attack or contested action
 * - May reposition, evade, or strike while moving
 *
 * Additional from Active Powers (Lines 4644-4667):
 * - Powers may have Stone costs for enhanced effects
 * - AoE modifiers may apply
 * - Range considerations
 */
/**
 * Movement power usage data
 */
export interface MovementPowerUsage {
    actorId: string;
    powerId: string;
    powerName: string;
    requiresRoll: boolean;
    hasAttack: boolean;
    hasContest: boolean;
    stoneCost: number;
}
/**
 * Check if a power requires a roll
 * Movement powers only need rolls if they include attack/contested action
 */
export declare function movementPowerRequiresRoll(power: any): boolean;
/**
 * Use a Movement Power
 *
 * @param actor - The actor using the power
 * @param power - The movement power item
 * @returns Success status
 */
export declare function useMovementPower(actor: any, power: any): Promise<boolean>;
/**
 * Get all equipped movement powers for an actor
 */
export declare function getMovementPowers(actor: any): any[];
/**
 * Calculate stone cost for a movement power
 * Based on AoE, range, and special effects
 */
export declare function calculateMovementPowerCost(power: any): number;
//# sourceMappingURL=movement.d.ts.map