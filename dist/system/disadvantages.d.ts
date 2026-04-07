/**
 * Disadvantages System for Mastery System
 * Defines all available disadvantages that characters can take during creation
 */
export interface DisadvantageField {
    name: string;
    type: 'text' | 'number' | 'select';
    label: string;
    placeholder?: string;
    options?: Array<{
        value: string;
        label: string;
    }>;
    required?: boolean;
    min?: number;
    max?: number;
}
export interface DisadvantageDefinition {
    id: string;
    name: string;
    basePoints: number | number[];
    description: string;
    fields?: DisadvantageField[];
    effect?: string;
}
/**
 * All available Disadvantages
 * Based on Mastery System rules - during character creation players must take at least
 * CONFIG.MASTERY.creation.minDisadvantagePoints (default 2) and at most maxDisadvantagePoints (8).
 * Disadvantage Points = Starting Faith Fractures (both current and maximum)
 */
export declare const DISADVANTAGES: DisadvantageDefinition[];
/**
 * Get disadvantage definition by ID
 */
export declare function getDisadvantageDefinition(id: string): DisadvantageDefinition | undefined;
/**
 * Get all disadvantage definitions
 */
export declare function getDisadvantageDefinitions(): DisadvantageDefinition[];
/**
 * Legacy mental-restrictions rows used a `type` field and flat 2 pts. Preselect Normal (2 pt) until the player picks a tier.
 */
export declare function detailsForMentalRestrictionsDialog(details?: Record<string, any>): Record<string, any>;
/**
 * Calculate points for a disadvantage selection
 */
export declare function calculateDisadvantagePoints(disadvantageId: string, details: Record<string, any>): number;
/**
 * Validate disadvantage selection
 */
export declare function validateDisadvantageSelection(selections: Array<{
    id: string;
    details: Record<string, any>;
}>): {
    valid: boolean;
    totalPoints: number;
    error?: string;
};
//# sourceMappingURL=disadvantages.d.ts.map