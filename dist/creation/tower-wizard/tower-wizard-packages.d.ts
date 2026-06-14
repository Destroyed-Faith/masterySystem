/**
 * Tower Wizard — declarative defense/offense package definitions.
 */
import type { PowerCategory } from '../../types/item.js';
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';
import type { CatalogEntry } from '../../utils/power-catalog.js';
import type { DefensePackageId, OffenseActiveOverride, OffenseActiveVariant, OffensePackageId, PackageReviewRow, ResolvedGrant, TowerWizardDefensePackage, TowerWizardOffensePackage, TowerWizardSelection, PackageGrantKey, PackagePowerOverride, ReviewPowerRow, SecondPassiveGroup, OffenseActiveGroup, OffenseActivePick, OffenseActiveSpecialGroup, PowerPickerGroup, WizardOffensiveActiveBuff, WizardOffensiveActiveBuffGroup, WizardActiveBuffPreview } from './tower-wizard-types.js';
export declare function grantKeyCategory(grantKey: PackageGrantKey): PowerCategory;
export declare function grantKeyRank(grantKey: PackageGrantKey): number;
/** True when a catalog entry is valid for the wizard slot (category + rank). */
export declare function catalogEntryMatchesGrantKey(entry: CatalogEntry, grantKey: PackageGrantKey): boolean;
export declare function packageSpecIdentity(spec: PowerGrantSpec): string;
export declare function collectPackageIdentityKeys(specs: PowerGrantSpec[], exceptGrantKey?: PackageGrantKey): Set<string>;
/** Offense packages hidden from the wizard UI (still in type union for saved data). */
export declare const WIZARD_HIDDEN_OFFENSE_IDS: OffensePackageId[];
export declare function offensePickFromEntry(entry: CatalogEntry): OffenseActivePick;
export declare function getOffenseActiveSpecialGroups(actorEchoKey?: string | null, selectedPickIds?: Set<string>, excludeIdentityKeys?: Set<string>): OffenseActiveSpecialGroup[];
/** Flat list grouped by subfamily — kept for tooling; wizard uses special groups. */
export declare function getOffenseActiveGroups(actorEchoKey?: string | null): OffenseActiveGroup[];
/** Rank-specific mechanical effect text for a catalog entry (hover tooltip). */
export declare function catalogMechanicsText(entry: CatalogEntry, rank: number): string;
/**
 * Build collapsible, subfamily-grouped power cards for the Change-Power picker
 * (non-active slots: passive, activeBuff, reaction). Active slots use
 * getOffenseActiveSpecialGroups instead.
 */
export declare function getCatalogSubfamily(templateId: string, special?: string | null): string | null;
export declare function getCategoryPickerGroups(category: PowerCategory, rank: number, options?: {
    excludeIdentityKeys?: Set<string>;
    excludeSubfamilies?: Set<string>;
    selectedIdentityKeys?: Set<string>;
    actorEchoKey?: string | null;
}): PowerPickerGroup[];
export declare function resolveOffenseActiveSpecs(selection: TowerWizardSelection): PowerGrantSpec[] | null;
export declare function selectionUsesCatalogOffense(selection: Partial<TowerWizardSelection>): boolean;
export declare function getDefaultActiveBuffPreview(defenseId: DefensePackageId): WizardActiveBuffPreview | null;
export declare function getOffensiveActiveBuffOptions(): WizardOffensiveActiveBuff[];
export declare function getOffensiveActiveBuffGroups(): WizardOffensiveActiveBuffGroup[];
export declare function isValidOffensiveActiveBuffId(templateId: string): boolean;
/** @deprecated use getOffensiveActiveBuffOptions() */
export declare const WIZARD_OFFENSIVE_ACTIVE_BUFFS: WizardOffensiveActiveBuff[];
export declare const TOWER_WIZARD_DEFENSE_PACKAGES: TowerWizardDefensePackage[];
export declare const TOWER_WIZARD_OFFENSE_PACKAGES: TowerWizardOffensePackage[];
export declare function getDefensePackage(id: DefensePackageId): TowerWizardDefensePackage | undefined;
export declare function getOffensePackage(id: OffensePackageId): TowerWizardOffensePackage | undefined;
export declare function getAvailableOffensePackages(): TowerWizardOffensePackage[];
export declare function getSecondPassiveGroups(defenseId: DefensePackageId): SecondPassiveGroup[];
export declare function resolveActiveBuffSpec(selection: TowerWizardSelection): PowerGrantSpec;
export declare function playerFacingPowerName(spec: PowerGrantSpec, resolved?: ResolvedGrant): string;
export declare function playerFacingVariantLabel(variant: OffenseActiveVariant, baseSpec?: PowerGrantSpec): string;
export declare function packageNeedsOffensiveBuffStep(selection: Partial<TowerWizardSelection>): boolean;
export declare function sortOffensePackagesForDefense(_defenseId: DefensePackageId): TowerWizardOffensePackage[];
export declare function secondPassiveLabel(templateId: string): string;
export declare function secondPassiveHint(templateId: string, description?: string): string;
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
        playerName?: string;
    }>;
    offenseRows: Array<PackageReviewRow>;
    reviewPowerRows: ReviewPowerRow[];
    packageId: string;
    allOk: boolean;
}
export declare function buildReviewPowerRows(selection: TowerWizardSelection): ReviewPowerRow[];
export declare function buildPackageReview(selection: TowerWizardSelection): PackageReview;
export declare function isManualBuildMode(selection: Partial<TowerWizardSelection>): boolean;
export declare function buildPackageGrantSpecsFromOverrides(selection: Partial<TowerWizardSelection>): PowerGrantSpec[] | null;
export declare function collectOverrideIdentityKeys(overrides: PackagePowerOverride[], exceptGrantKey?: PackageGrantKey): Set<string>;
export declare function buildManualReviewPowerRows(selection: Partial<TowerWizardSelection>): ReviewPowerRow[];
export declare function buildManualPackageReview(selection: Partial<TowerWizardSelection>): PackageReview;
export declare function packageNeedsDeliveryStep(selection: Partial<TowerWizardSelection>): boolean;
export declare function packageNeedsWeakenSaveStep(selection: Partial<TowerWizardSelection>): boolean;
//# sourceMappingURL=tower-wizard-packages.d.ts.map