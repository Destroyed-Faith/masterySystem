/**
 * Tower Wizard — validation for selections and finalize.
 */
import type { PackagePowerOverride, TowerWizardSelection } from './tower-wizard-types.js';
export declare function isValidSecondPassiveForDefense(defenseId: string, templateId: string): boolean;
export declare function validatePowerOverrideForGrantKey(selection: TowerWizardSelection, override: PackagePowerOverride): string | null;
export declare function validateOffenseActivePicks(selection: TowerWizardSelection): string | null;
export declare function validateManualWizardSelection(selection: Partial<TowerWizardSelection>): string | null;
export declare function validateTowerWizardSelection(selection: Partial<TowerWizardSelection>): string | null;
export declare function validateTowerWizardCreation(actor: Actor): string | null;
export declare function validatePackageSpecs(selection: TowerWizardSelection): string | null;
export declare function collectRelevantWarnings(selection: TowerWizardSelection): string[];
//# sourceMappingURL=tower-wizard-validation.d.ts.map