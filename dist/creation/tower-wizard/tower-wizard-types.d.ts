/**
 * Tower Wizard — shared types.
 */
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';
export type DefensePackageId = 'armor' | 'evade' | 'damage-reduction' | 'phasing';
export type OffensePackageId = 'bleeding-push' | 'ignite' | 'freeze' | 'expose' | 'corrode-damage' | 'mark' | 'hex-spell' | 'weaken-save' | 'direct-damage';
export type DeliveryMode = 'melee' | 'ranged';
export type WeakenSaveChoice = 'body' | 'mind' | 'spirit';
export type TowerWizardStep = 'intro' | 'defense' | 'passive2' | 'defenseSummary' | 'buffLimitation' | 'spellcaster' | 'offense' | 'weakenSave' | 'delivery' | 'combatLoop' | 'warnings' | 'review';
export type CatalogStatus = 'ok' | 'missing';
export interface ResolvedGrant {
    spec: PowerGrantSpec;
    displayName: string;
    mechanicalName: string;
    category: string;
    status: CatalogStatus;
}
export interface TowerWizardSelection {
    defenseId: DefensePackageId;
    secondPassiveTemplateId: string;
    offenseId: OffensePackageId;
    delivery: DeliveryMode;
    weakenSave: WeakenSaveChoice | null;
    spellcaster: boolean;
}
export interface TowerWizardDefensePackage {
    id: DefensePackageId;
    label: string;
    explanation: string;
    warning?: string;
    grants: {
        passive1: PowerGrantSpec;
        activeBuff: PowerGrantSpec;
        reaction: PowerGrantSpec;
    };
    secondPassiveTemplateIds: string[];
    recommendedSecondPassiveTemplateIds: string[];
    offenseRecommendations: OffensePackageId[];
}
export interface TowerWizardOffensePackage {
    id: OffensePackageId;
    label: string;
    explanation: string;
    warning?: string;
    helperText?: string;
    catalogAvailable: boolean;
    catalogTodo?: string;
    resolveGrants: (ctx: OffenseResolveContext) => PowerGrantSpec[];
    recommendedForSpellcaster?: boolean;
}
export interface OffenseResolveContext {
    delivery: DeliveryMode;
    weakenSave: WeakenSaveChoice | null;
}
export interface PackageReviewRow {
    role: string;
    displayName: string;
    mechanicalName: string;
    rank: number;
}
//# sourceMappingURL=tower-wizard-types.d.ts.map