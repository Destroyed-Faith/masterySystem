/**
 * Encounter Generator — input validation.
 */
import { type EncounterSelection } from './encounter-generator-types.js';
export interface ValidationResult {
    ok: boolean;
    error: string | null;
}
/** Normalize composition values into legal ranges. */
export declare function normalizeComposition(comp: EncounterSelection['composition']): EncounterSelection['composition'];
/** Validate the full selection prior to generation. */
export declare function validateEncounterSelection(selection: EncounterSelection): ValidationResult;
//# sourceMappingURL=encounter-generator-validation.d.ts.map