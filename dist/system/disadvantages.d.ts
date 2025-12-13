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
 * Based on Mastery System rules - players can select 0-8 points of disadvantages
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