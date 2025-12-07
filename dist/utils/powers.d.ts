/**
 * Power utilities for the Mastery System
 */
export interface PowerDefinition {
    id: string;
    name: string;
    type: 'active' | 'passive' | 'reaction' | 'movement' | 'utility' | 'spell' | 'buff';
    description: string;
    cost?: {
        actions?: number;
        stones?: number;
        movement?: number;
    };
    requirements?: {
        masteryRank?: number;
        attributes?: Record<string, number>;
    };
}
/**
 * Get all available powers for an actor
 */
export declare function getAvailablePowers(actor: Actor): PowerDefinition[];
/**
 * Check if a power can be used
 */
export declare function canUsePower(actor: Actor, power: any): boolean;
//# sourceMappingURL=powers.d.ts.map