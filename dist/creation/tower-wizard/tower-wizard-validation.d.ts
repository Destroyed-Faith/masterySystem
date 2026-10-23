/**
 * Tower Wizard — validation for selections and finalize.
 */
import type { PackagePowerOverride, TowerWizardAttributeMap, TowerWizardSelection, TowerWizardStep } from './tower-wizard-types.js';
import type { TowerWizardEchoContext } from './tower-wizard-echo-advisor.js';
/** Starting Attribute Stones (permanent; independent of Attribute scores). */
export declare const TOWER_WIZARD_STARTING_STONES: number;
/** Starting Specializations: five at Rank 2 (20 Creation Points). */
export declare const TOWER_WIZARD_STARTING_SPECIALIZATIONS = 5;
/** Standard starting Mastery Rank. */
export declare const TOWER_WIZARD_DEFAULT_MASTERY_RANK = 2;
export interface TowerWizardIdentityContext {
    /** Overrides `selection.masteryRank` (e.g. the actor's current MR). */
    masteryRank?: number;
    /** Attribute scores used for Imprint eligibility when the selection has none. */
    actorAttributes?: TowerWizardAttributeMap;
    /** True when the actor already has an Echo (`system.echo.key`). */
    hasEcho?: boolean;
}
export declare function resolveWizardMasteryRank(selection: Partial<TowerWizardSelection>, ctx?: TowerWizardIdentityContext): number;
/** Attribute Stone concentration cap: Mastery Rank × 2 on one Attribute. */
export declare function wizardStoneCap(masteryRank: number): number;
/** Starting Attribute package (4,4,3,3,2,2,2) + 2 Stones (≤ MR × 2 each). */
export declare function validateWizardAttributesAndStones(selection: Partial<TowerWizardSelection>, ctx?: TowerWizardIdentityContext): string[];
/** Echo Imprints: ≤ MR, unique, linked Attribute ≥ 4 (shared rules validator). */
export declare function validateWizardEchoImprints(selection: Partial<TowerWizardSelection>, ctx?: TowerWizardIdentityContext): string[];
/** Starting Specializations: exactly five Rank 2 (shared rules validator). */
export declare function validateWizardSpecializations(selection: Partial<TowerWizardSelection>): string[];
/**
 * Validate the early identity DTO. Fields are only checked when present, so
 * legacy callers (imports, tests) keep working; set `requireComplete` for the
 * dialog gate where every early step must be finished.
 */
export declare function validateTowerWizardIdentity(selection: Partial<TowerWizardSelection>, ctx?: TowerWizardIdentityContext, opts?: {
    requireComplete?: boolean;
}): string | null;
/**
 * Per-step gate for the dialog's early steps. Attributes/Stones and Specializations are
 * required to continue; Echo Imprints are optional ("up to MR") but must be legal.
 */
export declare function validateWizardIdentityStep(step: TowerWizardStep, selection: Partial<TowerWizardSelection>, ctx?: TowerWizardIdentityContext): string | null;
export declare function isValidSecondPassiveForDefense(_defenseId: string, templateId: string, passive1TemplateId?: string, actorEchoKey?: string | null, actorSubChoiceKey?: string | null): boolean;
export declare function validatePowerOverrideForGrantKey(selection: TowerWizardSelection, override: PackagePowerOverride): string | null;
export declare function validateOffenseActivePicks(selection: TowerWizardSelection): string | null;
export declare function validateManualWizardSelection(selection: Partial<TowerWizardSelection>): string | null;
export declare function validateTowerWizardSelection(selection: Partial<TowerWizardSelection>, identityCtx?: TowerWizardIdentityContext): string | null;
export declare function validateTowerWizardCreation(actor: Actor): string | null;
export declare function validatePackageSpecs(selection: TowerWizardSelection, identityCtx?: TowerWizardIdentityContext): string | null;
export declare function collectRelevantWarnings(selection: TowerWizardSelection, echoContext?: TowerWizardEchoContext | null): string[];
//# sourceMappingURL=tower-wizard-validation.d.ts.map