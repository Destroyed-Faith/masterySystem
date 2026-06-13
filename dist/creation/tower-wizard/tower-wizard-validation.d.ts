/**
 * Tower Wizard — validation for selections and finalize.
 */
import type { TowerWizardSelection } from './tower-wizard-types.js';
export declare function isValidSecondPassiveForDefense(defenseId: string, templateId: string): boolean;
export declare function validateTowerWizardSelection(selection: Partial<TowerWizardSelection>): string | null;
export declare function validateTowerWizardCreation(actor: Actor): string | null;
export declare function validatePackageSpecs(selection: TowerWizardSelection): string | null;
export declare function collectRelevantWarnings(selection: TowerWizardSelection): string[];
//# sourceMappingURL=tower-wizard-validation.d.ts.map