/**
 * Saving Throw utility functions
 * Per Player's Guide saving-throw chapter (~6840–6864):
 *   - 3 categories, dual-attribute selection.
 *   - DC = 8 × source Mastery Rank + ⌊source Intellect / 8⌋.
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
 * Calculate saving throw DC from source's Mastery Rank.
 *
 * The optional `sourceIntellect` argument adds the Intellect scaling bonus
 * (⌊Intellect/8⌋). When omitted (legacy callers) the DC matches the old
 * `MR × 8` table for backwards compatibility.
 */
export declare function calculateSaveDC(sourceMR: number, sourceIntellect?: number): number;
/**
 * Determine the save roll parameters for a character
 */
export declare function buildSaveRollInfo(category: SaveCategory, attributes: Record<string, {
    value: number;
}>, sourceMR: number, sourceIntellect?: number): SaveRollInfo;
//# sourceMappingURL=saving-throws.d.ts.map