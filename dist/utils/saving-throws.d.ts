/**
 * Saving Throw utility functions
 * Per Player's Guide: 3 categories, dual-attribute selection, DC = MR × 8
 */
export type SaveCategory = 'body' | 'mind' | 'spirit';
export interface SaveRollInfo {
    category: SaveCategory;
    attribute1: string;
    attribute2: string;
    chosenAttribute: string;
    dicePool: number;
    dc: number;
}
/**
 * Get the two attributes used for a save category
 */
export declare function getSaveAttributes(category: SaveCategory): [string, string];
/**
 * Calculate saving throw DC from source's Mastery Rank
 */
export declare function calculateSaveDC(sourceMR: number): number;
/**
 * Determine the save roll parameters for a character
 */
export declare function buildSaveRollInfo(category: SaveCategory, attributes: Record<string, {
    value: number;
}>, sourceMR: number): SaveRollInfo;
//# sourceMappingURL=saving-throws.d.ts.map