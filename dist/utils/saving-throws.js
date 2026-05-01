/**
 * Saving Throw utility functions
 * Per Player's Guide saving-throw chapter (~6840–6864):
 *   - 3 categories, dual-attribute selection.
 *   - DC = 8 × source Mastery Rank + ⌊source Intellect / 8⌋.
 */
import { SAVING_THROWS, SAVE_DC_BY_MR } from './constants.js';
/**
 * Get the two attributes used for a save category
 */
export function getSaveAttributes(category) {
    const attrs = SAVING_THROWS[category];
    return [attrs[0], attrs[1]];
}
/**
 * Calculate saving throw DC from source's Mastery Rank.
 *
 * The optional `sourceIntellect` argument adds the Intellect scaling bonus
 * (⌊Intellect/8⌋). When omitted (legacy callers) the DC matches the old
 * `MR × 8` table for backwards compatibility.
 */
export function calculateSaveDC(sourceMR, sourceIntellect = 0) {
    const baseTN = SAVE_DC_BY_MR[sourceMR] ?? sourceMR * 8;
    const intBonus = Math.max(0, Math.floor((Number.isFinite(sourceIntellect) ? sourceIntellect : 0) / 8));
    return baseTN + intBonus;
}
/**
 * Determine the save roll parameters for a character
 */
export function buildSaveRollInfo(category, attributes, sourceMR, sourceIntellect = 0) {
    const [attr1Name, attr2Name] = getSaveAttributes(category);
    const attr1Value = attributes[attr1Name]?.value ?? 0;
    const attr2Value = attributes[attr2Name]?.value ?? 0;
    const chosenAttribute = attr1Value >= attr2Value ? attr1Name : attr2Name;
    const dicePool = Math.max(attr1Value, attr2Value);
    const dc = calculateSaveDC(sourceMR, sourceIntellect);
    return {
        category,
        attribute1: attr1Name,
        attribute2: attr2Name,
        chosenAttribute,
        dicePool,
        dc
    };
}
//# sourceMappingURL=saving-throws.js.map