/**
 * Tower Wizard — declarative defense/offense package definitions.
 */
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';
import type { DefensePackageId, OffensePackageId, ResolvedGrant, TowerWizardDefensePackage, TowerWizardOffensePackage, TowerWizardSelection } from './tower-wizard-types.js';
export declare const TOWER_WIZARD_DEFENSE_PACKAGES: TowerWizardDefensePackage[];
export declare const TOWER_WIZARD_OFFENSE_PACKAGES: TowerWizardOffensePackage[];
export declare function getDefensePackage(id: DefensePackageId): TowerWizardDefensePackage | undefined;
export declare function getOffensePackage(id: OffensePackageId): TowerWizardOffensePackage | undefined;
export declare function getAvailableOffensePackages(): TowerWizardOffensePackage[];
export declare function sortOffensePackagesForDefense(defenseId: DefensePackageId, spellcaster: boolean): TowerWizardOffensePackage[];
export declare function secondPassiveLabel(templateId: string): string;
export declare function resolveGrant(spec: PowerGrantSpec): ResolvedGrant;
export declare function buildPackageGrantSpecs(selection: TowerWizardSelection): PowerGrantSpec[];
export interface PackageReview {
    defenseRows: Array<ResolvedGrant & {
        role: string;
    }>;
    offenseRows: Array<ResolvedGrant & {
        role: string;
    }>;
    packageId: string;
    allOk: boolean;
}
export declare function buildPackageReview(selection: TowerWizardSelection): PackageReview;
export declare function packageNeedsDeliveryStep(_offenseId: OffensePackageId): boolean;
export declare function packageNeedsWeakenSaveStep(offenseId: OffensePackageId): boolean;
//# sourceMappingURL=tower-wizard-packages.d.ts.map