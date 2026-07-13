/**
 * Tower Wizard — shared types.
 */

import type { CastingAttribute, SpellResolution } from '../../types/item.js';
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';

export type DefensePackageId = 'armor' | 'evade' | 'damage-reduction' | 'phasing';

export type OffensePackageId =
    | 'lacerate-push'
    | 'ruin'
    | 'slow'
    | 'expose'
    | 'corrode-damage'
    | 'mark'
    | 'hex-spell'
    | 'weaken-save'
    | 'direct-damage';

export type DeliveryMode = 'melee' | 'ranged';

export type WeakenSaveChoice = 'body' | 'mind' | 'spirit';

export type GuidedAttackDelivery = 'melee' | 'ranged' | 'spell' | 'natural';

export type TowerWizardStep =
    | 'defense'
    | 'defensePassiveVariant'
    | 'passive2'
    | 'activeBuffChoice'
    | 'offensiveBuff'
    | 'offenseDelivery'
    | 'offenseSpecial'
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

export type ActiveBuffMode = 'defensive' | 'offensive' | 'support';

export interface DefensePackageCustomizedSlots {
    passive1?: boolean;
    activeBuff?: boolean;
    reaction?: boolean;
}

export interface DefensePackagePreviewRow {
    label: string;
    value: string;
}

export interface DefensePackagePreview {
    mainDefenseLabel: string;
    rows: DefensePackagePreviewRow[];
}

export interface Passive1VariantOption {
    templateId: string;
    label: string;
    description: string;
    mechanicsPreview: string;
    isDefault: boolean;
    isLocked: boolean;
    isRecommended: boolean;
}

export interface OffenseActivePick {
    /** Stable catalog identity (`templateId` or `templateId::special`). */
    pickId: string;
    templateId: string;
    special?: string | null;
}

export interface TowerWizardSelection {
    defenseId: DefensePackageId;
    /** Passive 1 variant; defaults to the defense package recommendation when unset. */
    passive1TemplateId?: string;
    secondPassiveTemplateId: string;
    activeBuffMode: ActiveBuffMode;
    offensiveActiveBuffId?: string;
    customizedSlots?: DefensePackageCustomizedSlots;
    /** @deprecated Legacy package flow — prefer `offenseActivePicks`. */
    offenseId?: OffensePackageId;
    offenseActivePicks?: OffenseActivePick[];
    delivery: DeliveryMode;
    weakenSave: WeakenSaveChoice | null;
    offenseActiveOverrides?: OffenseActiveOverride[];
    powerOverrides?: PackagePowerOverride[];
    /** How the character mainly attacks (Guided offense flow). */
    guidedAttackDelivery?: GuidedAttackDelivery;
    /** Skip guided steps; configure all six Powers on the review page. */
    manualBuildMode?: boolean;
}

export interface GuidedDeliveryOption {
    id: GuidedAttackDelivery;
    label: string;
    explanation: string;
}

export interface GuidedSpecialFocusCard {
    pickId: string;
    templateId: string;
    special: string | null;
    playerTitle: string;
    explanation: string;
    whenToUse: string;
    powerName: string;
    mechanicsPreview: string;
    isSelected?: boolean;
}

export interface GuidedSpecialFocusGroup {
    purposeId: string;
    label: string;
    explanation: string;
    isAdvanced?: boolean;
    cards: GuidedSpecialFocusCard[];
}

export interface GuidedBuildSummarySlot {
    role: string;
    text: string;
}

export interface GuidedBuildSummary {
    slots: GuidedBuildSummarySlot[];
    rotationSteps: string[];
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
    warning?: string;
    /** Catalog / system power name (Guided Mode secondary text). */
    powerName?: string;
    whenToUse?: string;
    mechanicsPreview?: string;
}

export interface SecondPassiveGroup {
    groupLabel: string;
    passives: SecondPassiveOption[];
}

export interface SecondPassiveIntentGroup {
    intentLabel: string;
    intentHint?: string;
    warning?: string;
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

/** @deprecated Subfamily grouping — use OffenseActiveSpecialGroup. */
export interface OffenseActiveGroup {
    groupLabel: string;
    actives: OffenseActiveOption[];
}

export interface OffenseActiveVariantOption {
    pickId: string;
    templateId: string;
    special?: string | null;
    delivery: DeliveryMode;
    deliveryLabel: string;
    /** Rank-specific mechanical effect text (hover tooltip). */
    mechanics?: string;
    isSelected?: boolean;
}

export interface OffenseActivePattern {
    patternId: string;
    label: string;
    hint: string;
    variants: OffenseActiveVariantOption[];
}

export interface OffenseActiveSpecialGroup {
    groupLabel: string;
    specialKey: string | null;
    /** Hover tooltip: how this Special works in the system. */
    groupTooltip: string;
    /** Open the collapsible section when a variant in this group is selected. */
    hasSelection: boolean;
    patterns: OffenseActivePattern[];
}

/** A single selectable power card in the Change-Power picker (non-active slots). */
export interface PowerPickerCard {
    templateId: string;
    special: string | null;
    label: string;
    hint: string;
    /** Rank-specific mechanical effect text (hover tooltip). */
    mechanics: string;
    identityKey: string;
    isSelected: boolean;
}

/** A collapsible group of power cards in the Change-Power picker. */
export interface PowerPickerGroup {
    groupLabel: string;
    /** Open the collapsible section when a card in this group is the current pick. */
    hasSelection: boolean;
    cards: PowerPickerCard[];
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

export interface PackageCustomizationNote {
    kind: 'passive1-variant' | 'active-buff-replaced';
    recommended: string;
    current: string;
}

export interface ReviewPowerRow {
    grantKey: PackageGrantKey;
    role: string;
    playerName: string;
    rank: number;
    category: string;
    hasCatalogOverride: boolean;
    showResetToDefault?: boolean;
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
