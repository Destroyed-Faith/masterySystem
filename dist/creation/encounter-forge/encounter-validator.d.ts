/**
 * Encounter Validator — turns the solved encounter into explained warnings.
 *
 * Every warning says WHY it fires, in GM-readable terms (rounds, Health
 * Levels, defense shares), never as an abstract score. Thresholds are the
 * central tuning constants.
 */
import type { EncounterDesign } from './encounter-model.js';
import type { EncounterSolution } from './solve-encounter.js';
export type WarningSeverity = 'info' | 'warn' | 'strong';
export interface EncounterWarning {
    severity: WarningSeverity;
    code: string;
    message: string;
}
export declare function validateEncounter(design: EncounterDesign, solution: EncounterSolution): EncounterWarning[];
//# sourceMappingURL=encounter-validator.d.ts.map