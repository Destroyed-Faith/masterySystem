/**
 * Tower Wizard — declarative defense/offense package definitions.
 */
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';
import type { DefensePackageId, OffenseActiveOverride, OffenseActiveVariant, OffensePackageId, PackageReviewRow, ResolvedGrant, TowerWizardDefensePackage, TowerWizardOffensePackage, TowerWizardSelection, WizardOffensiveActiveBuff } from './tower-wizard-types.js';
/** Offense packages hidden from the wizard UI (still in type union for saved data). */
export declare const WIZARD_HIDDEN_OFFENSE_IDS: OffensePackageId[];
export declare const WIZARD_OFFENSIVE_ACTIVE_BUFFS: WizardOffensiveActiveBuff[];
export declare const TOWER_WIZARD_DEFENSE_PACKAGES: TowerWizardDefensePackage[];
export declare const TOWER_WIZARD_OFFENSE_PACKAGES: TowerWizardOffensePackage[];
export declare function getDefensePackage(id: DefensePackageId): TowerWizardDefensePackage | undefined;
export declare function getOffensePackage(id: OffensePackageId): TowerWizardOffensePackage | undefined;
export declare function getAvailableOffensePackages(): TowerWizardOffensePackage[];
export declare function getSecondPassiveGroups(defenseId: DefensePackageId): {
    defensive: Array<{
        id: string;
        label: string;
        hint: string;
    }>;
    offensive: Array<{
        id: string;
        label: string;
        hint: string;
    }>;
};
export declare function resolveActiveBuffSpec(selection: TowerWizardSelection): PowerGrantSpec;
export declare function playerFacingPowerName(spec: PowerGrantSpec, resolved?: ResolvedGrant): string;
export declare function playerFacingVariantLabel(variant: OffenseActiveVariant, baseSpec?: PowerGrantSpec): string;
export declare function packageNeedsOffensiveBuffStep(selection: Partial<TowerWizardSelection>): boolean;
export declare function sortOffensePackagesForDefense(defenseId: DefensePackageId): TowerWizardOffensePackage[];
export declare function secondPassiveLabel(templateId: string): string;
export declare function secondPassiveHint(templateId: string): string;
export declare function resolveGrant(spec: PowerGrantSpec): ResolvedGrant;
export declare function specFromVariant(delivery: 'melee' | 'ranged', variant: OffenseActiveVariant): PowerGrantSpec;
export declare function getVariantOptionsForOffenseSlot(offenseId: OffensePackageId, slotIndex: number): OffenseActiveVariant[];
export declare function isOffenseSlotConfigurable(offenseId: OffensePackageId, slotIndex: number): boolean;
export declare function defaultVariantForOffenseSlot(offenseId: OffensePackageId, slotIndex: number): OffenseActiveVariant | undefined;
export declare function initializeOffenseOverrides(selection: TowerWizardSelection): OffenseActiveOverride[];
export declare function buildPackageGrantSpecs(selection: TowerWizardSelection): PowerGrantSpec[];
export interface PackageReview {
    defenseRows: Array<ResolvedGrant & {
        role: string;
    }>;
    offenseRows: Array<PackageReviewRow>;
    packageId: string;
    allOk: boolean;
}
export declare function buildPackageReview(selection: TowerWizardSelection): PackageReview;
export declare function packageNeedsDeliveryStep(_offenseId: OffensePackageId): boolean;
export declare function packageNeedsWeakenSaveStep(offenseId: OffensePackageId): boolean;
//# sourceMappingURL=tower-wizard-packages.d.ts.map