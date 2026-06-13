/**
 * Tower Wizard — shared types.
 */

import type { CastingAttribute, SpellResolution } from '../../types/item.js';
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';

export type DefensePackageId = 'armor' | 'evade' | 'damage-reduction' | 'phasing';

export type OffensePackageId =
    | 'bleeding-push'
    | 'ignite'
    | 'freeze'
    | 'expose'
    | 'corrode-damage'
    | 'mark'
    | 'hex-spell'
    | 'weaken-save'
    | 'direct-damage';

export type DeliveryMode = 'melee' | 'ranged';

export type WeakenSaveChoice = 'body' | 'mind' | 'spirit';

export type TowerWizardStep =
    | 'defense'
    | 'passive2'
    | 'activeBuffChoice'
    | 'offensiveBuff'
    | 'offense'
    | 'weakenSave'
    | 'delivery'
    | 'review';

export type OffenseActiveVariant =
    | 'weapon-single'
    | 'weapon-aoe'
    | 'weapon-split'
    | 'damage-t3'
    | 'damage-t4'
    | 'damage-t4-spell';

export type PackageGrantKey =
    | 'passive-1'
    | 'passive-2'
    | 'active-buff'
    | 'reaction'
    | 'offense-0'
    | 'offense-1';

export interface PackagePowerOverride {
    grantKey: PackageGrantKey;
    templateId: string;
    special?: string | null;
    isSpell?: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
}

export interface OffenseActiveOverride {
    /** `offense-0` or `offense-1` */
    grantKey: string;
    variant?: OffenseActiveVariant;
    isSpell?: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
}

export type CatalogStatus = 'ok' | 'missing';

export interface ResolvedGrant {
    spec: PowerGrantSpec;
    displayName: string;
    mechanicalName: string;
    category: string;
    status: CatalogStatus;
}

export type ActiveBuffMode = 'defensive' | 'offensive';

export interface OffenseActivePick {
    /** Stable catalog identity (`templateId` or `templateId::special`). */
    pickId: string;
    templateId: string;
    special?: string | null;
}

export interface TowerWizardSelection {
    defenseId: DefensePackageId;
    secondPassiveTemplateId: string;
    activeBuffMode: ActiveBuffMode;
    offensiveActiveBuffId?: string;
    /** @deprecated Legacy package flow — prefer `offenseActivePicks`. */
    offenseId?: OffensePackageId;
    offenseActivePicks?: OffenseActivePick[];
    delivery: DeliveryMode;
    weakenSave: WeakenSaveChoice | null;
    offenseActiveOverrides?: OffenseActiveOverride[];
    powerOverrides?: PackagePowerOverride[];
    /** Skip guided steps; configure all six Powers on the review page. */
    manualBuildMode?: boolean;
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
}

export interface SecondPassiveOption {
    id: string;
    label: string;
    hint: string;
}

export interface SecondPassiveGroup {
    groupLabel: string;
    passives: SecondPassiveOption[];
}

export interface OffenseActiveOption {
    pickId: string;
    templateId: string;
    special?: string | null;
    label: string;
    hint: string;
    isSelected?: boolean;
}

export interface OffenseActiveGroup {
    groupLabel: string;
    actives: OffenseActiveOption[];
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
}

export interface OffenseResolveContext {
    delivery: DeliveryMode;
    weakenSave: WeakenSaveChoice | null;
}

export interface ReviewPowerRow {
    grantKey: PackageGrantKey;
    role: string;
    playerName: string;
    rank: number;
    category: string;
    hasCatalogOverride: boolean;
    spec: PowerGrantSpec;
    variantOptions?: Array<{ id: OffenseActiveVariant; label: string }>;
    override?: OffenseActiveOverride;
    showSpellConfig: boolean;
}

export interface PackageReviewRow {
    role: string;
    grantKey?: string;
    displayName: string;
    playerName: string;
    mechanicalName: string;
    rank: number;
    spec: PowerGrantSpec;
    configurable?: boolean;
    variantOptions?: Array<{ id: OffenseActiveVariant; label: string }>;
    override?: OffenseActiveOverride;
}

export interface WizardOffensiveActiveBuff {
    id: string;
    label: string;
    explanation: string;
    groupLabel: string;
    rankPreview: string;
    durationNote: string;
}

export interface WizardOffensiveActiveBuffGroup {
    groupLabel: string;
    buffs: WizardOffensiveActiveBuff[];
}

export interface WizardActiveBuffPreview {
    id: string;
    name: string;
    rankPreview: string;
    fluff: string;
}
