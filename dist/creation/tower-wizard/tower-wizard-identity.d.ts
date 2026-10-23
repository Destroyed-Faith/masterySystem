/**
 * Tower Wizard — DF 2026 early identity steps (view models + apply DTO).
 *
 * Pure helpers (no Foundry globals) shared by the dialog, the apply step and tests.
 * Skills are NOT written here: the legacy fixed-skill ratings are left untouched.
 */
import { type EchoImprintAttribute } from '../../rules/echo-imprints.js';
import { type SkillField, type SpecializationRecord } from '../../rules/specializations.js';
import { type AttributeKeyName } from '../../progression/v099-rules.js';
import { type TowerWizardIdentityContext } from './tower-wizard-validation.js';
import type { TowerWizardSelection } from './tower-wizard-types.js';
export declare const WIZARD_ATTRIBUTE_LABELS: Record<AttributeKeyName, string>;
/** Allowed starting Attribute values (package 4,4,3,3,2,2,2). */
export declare const WIZARD_ATTRIBUTE_CHOICES: readonly number[];
export declare const WIZARD_STARTING_PACKAGE_TEXT: string;
export interface WizardAttributeRow {
    key: AttributeKeyName;
    label: string;
    value: number | null;
    stones: number;
    options: Array<{
        value: number;
        selected: boolean;
    }>;
}
export declare function buildWizardAttributeRows(selection: Partial<TowerWizardSelection>): WizardAttributeRow[];
export interface WizardAttributeSummary {
    packageText: string;
    stonesPlaced: number;
    stonesTotal: number;
    stoneCap: number;
}
export declare function buildWizardAttributeSummary(selection: Partial<TowerWizardSelection>, ctx?: TowerWizardIdentityContext): WizardAttributeSummary;
export interface WizardImprintChoice {
    id: string;
    name: string;
    tagline: string;
    tierText: string;
    echoMemory: string;
    selected: boolean;
}
export interface WizardImprintGroup {
    attribute: EchoImprintAttribute;
    label: string;
    value: number;
    eligible: boolean;
    tier: number;
    candidateSummary: string;
    imprints: WizardImprintChoice[];
}
/** Imprints grouped by Attribute; ineligible Attributes (< 4) are listed but locked. */
export declare function buildWizardImprintGroups(selection: Partial<TowerWizardSelection>, ctx?: TowerWizardIdentityContext): WizardImprintGroup[];
export interface WizardSpecRow {
    index: number;
    name: string;
    field: SkillField;
    scope: string;
    rank: number;
    fieldOptions: Array<{
        value: SkillField;
        label: string;
        selected: boolean;
    }>;
}
/** Always returns five editable rows (Rank 2 each), padded from the current draft. */
export declare function buildWizardSpecRows(selection: Partial<TowerWizardSelection>): WizardSpecRow[];
/** Normalize draft rows into Rank-2 records; drops fully blank rows. */
export declare function specRecordsFromDraft(rows: Array<{
    name?: string;
    field?: string;
    scope?: string;
}>): SpecializationRecord[];
/** Read the actor's existing identity data so the dialog opens pre-filled. */
export declare function readActorIdentityPrefill(system: any): Partial<TowerWizardSelection>;
/**
 * Actor update payload for the identity steps. Writes `system.specializations`
 * and `system.echoImprints`; never touches legacy `system.skills` / `skillsSpent`.
 */
export declare function buildIdentityUpdateData(selection: Partial<TowerWizardSelection>): Record<string, unknown>;
export type WizardEarlyChange = 'echo' | 'attributes' | 'stones' | 'imprints' | 'specializations';
/** True once the player has picked any of the six combat Powers. */
export declare function wizardHasPowerChoices(selection: Partial<TowerWizardSelection>): boolean;
/**
 * Short reconciliation preview after an early-step change when Powers are already
 * chosen. Lists what may need re-checking; never edits the Power choices itself.
 */
export declare function buildReconciliationPreview(selection: Partial<TowerWizardSelection>, changes: Iterable<WizardEarlyChange>, ctx?: {
    echoKey?: string | null;
    subChoiceKey?: string | null;
}): string[];
//# sourceMappingURL=tower-wizard-identity.d.ts.map