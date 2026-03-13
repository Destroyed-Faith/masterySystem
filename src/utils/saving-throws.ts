/**
 * Saving Throw utility functions
 * Per Player's Guide: 3 categories, dual-attribute selection, DC = MR × 8
 */

import { SAVING_THROWS, SAVE_DC_BY_MR } from './constants.js';

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
export function getSaveAttributes(category: SaveCategory): [string, string] {
  const attrs = SAVING_THROWS[category];
  return [attrs[0], attrs[1]];
}

/**
 * Calculate saving throw DC from source's Mastery Rank
 */
export function calculateSaveDC(sourceMR: number): number {
  return SAVE_DC_BY_MR[sourceMR] ?? sourceMR * 8;
}

/**
 * Determine the save roll parameters for a character
 */
export function buildSaveRollInfo(
  category: SaveCategory,
  attributes: Record<string, { value: number }>,
  sourceMR: number
): SaveRollInfo {
  const [attr1Name, attr2Name] = getSaveAttributes(category);
  const attr1Value = attributes[attr1Name]?.value ?? 0;
  const attr2Value = attributes[attr2Name]?.value ?? 0;
  
  const chosenAttribute = attr1Value >= attr2Value ? attr1Name : attr2Name;
  const dicePool = Math.max(attr1Value, attr2Value);
  const dc = calculateSaveDC(sourceMR);
  
  return {
    category,
    attribute1: attr1Name,
    attribute2: attr2Name,
    chosenAttribute,
    dicePool,
    dc
  };
}
