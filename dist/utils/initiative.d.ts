/**
 * Initiative calculation and management for Mastery System
 * Initiative is rolled each round using:
 * Base Initiative = Agility + Wits + Combat Reflexes (skill)
 * Mastery Roll = Roll [Mastery Rank]d8, keep all, 8s explode
 * Final Initiative = Base + Mastery Roll - Shop Spending
 */
/**
 * Calculate base initiative for an actor
 * Base = Agility + Wits + Combat Reflexes skill
 */
export declare function calculateBaseInitiative(actor: any): number;
/**
 * Roll initiative dice for an actor
 * Rolls [Mastery Rank]d8, keeps all, 8s explode
 *
 * @param actor - The actor rolling initiative
 * @param withStones - Whether to include Stone Power bonuses (+1d8 per activation)
 * @param stoneActivations - Number of Wits Stone activations for initiative
 * @returns Object with total, rolls array, and formula string
 */
export declare function rollInitiativeDice(actor: any, withStones?: boolean, stoneActivations?: number): Promise<{
    total: number;
    rolls: number[];
    formula: string;
}>;
/**
 * Data returned from the Initiative Shop dialog
 */
export interface InitiativeShopResult {
    finalInitiative: number;
    spentPoints: number;
    purchases: {
        extraMovement: number;
        initiativeSwap: boolean;
        extraAttack: boolean;
    };
    cancelled: boolean;
}
/**
 * Calculate the total cost of shop purchases
 */
export declare function calculateShopCost(purchases: InitiativeShopResult['purchases']): number;
/**
 * Validate shop purchases against available initiative points
 */
export declare function validateShopPurchases(rawInitiative: number, purchases: InitiativeShopResult['purchases']): {
    valid: boolean;
    error?: string;
};
/**
 * Apply initiative shop purchases to an actor
 * Updates resources (movement, actions) based on purchases
 */
export declare function applyShopPurchases(actor: any, purchases: InitiativeShopResult['purchases']): Promise<void>;
/**
 * Create a chat message for initiative roll results
 */
export declare function createInitiativeChatMessage(actor: any, baseInitiative: number, masteryRoll: {
    total: number;
    rolls: number[];
    formula: string;
}, rawInitiative: number, shopResult: InitiativeShopResult): Promise<void>;
/**
 * Roll initiative for an NPC (no shop, automatic)
 */
export declare function rollNpcInitiative(actor: any, combatant: any): Promise<number>;
//# sourceMappingURL=initiative.d.ts.map