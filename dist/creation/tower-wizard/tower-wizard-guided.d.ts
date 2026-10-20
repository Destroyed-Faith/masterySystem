/**
 * Tower Wizard — Guided Mode player-facing copy, wrappers, and offense flow helpers.
 */
import { type SecondPassiveBucket } from './tower-wizard-passive-categories.js';
import type { DefensePackageId, DeliveryMode, GuidedAttackDelivery, GuidedBuildSummary, GuidedDeliveryOption, GuidedSpecialFocusGroup, OffenseActivePick, SecondPassiveIntentGroup, SecondPassiveOption, TowerWizardSelection } from './tower-wizard-types.js';
import type { PackageReview } from './tower-wizard-packages.js';
export declare const GUIDED_PASSIVE2_BUCKET_LABELS: Record<SecondPassiveBucket, {
    label: string;
    intentHint?: string;
    warning?: string;
}>;
export declare const GUIDED_DELIVERY_OPTIONS: GuidedDeliveryOption[];
export declare function isPassiveHiddenFromGuidedPassive2(templateId: string): boolean;
export declare function wrapGuidedPassiveCard(templateId: string, opts?: {
    recommended?: boolean;
}): SecondPassiveOption | null;
/** @deprecated Use {@link wrapGuidedPassiveCard}. */
export declare function wrapGuidedPassive2Card(templateId: string): SecondPassiveOption | null;
export interface GuidedPassiveSelectionOptions {
    /** When set, exclude this Passive and enforce category compatibility (Step 2). */
    excludeTemplateId?: string | null;
    actorEchoKey?: string | null;
    actorSubChoiceKey?: string | null;
    /** Mark survivability recommendations (Step 1 only). */
    markRecommended?: boolean;
}
/**
 * Shared Passive catalogue provider for Wizard Steps 1 and 2.
 * Step 1: omit `excludeTemplateId`. Step 2: pass Passive 1 as `excludeTemplateId`.
 */
export declare function getGuidedPassiveSelectionGroups(opts?: GuidedPassiveSelectionOptions): SecondPassiveIntentGroup[];
export declare function getGuidedSecondPassiveIntentGroups(passive1TemplateId: string, actorEchoKey?: string | null, actorSubChoiceKey?: string | null): SecondPassiveIntentGroup[];
export declare function getGuidedFirstPassiveIntentGroups(actorEchoKey?: string | null, actorSubChoiceKey?: string | null): SecondPassiveIntentGroup[];
export declare function guidedDeliveryToCombatDelivery(mode: GuidedAttackDelivery): DeliveryMode;
export declare function resolveGuidedCoreAttackPick(mode: GuidedAttackDelivery): {
    pick: OffenseActivePick;
    delivery: DeliveryMode;
    coreIsSpell: boolean;
} | null;
export declare function resolveGuidedSpecialPick(deliveryMode: GuidedAttackDelivery, specialKey: string, actorEchoKey?: string | null): OffenseActivePick | null;
export declare function getGuidedSpecialFocusGroups(deliveryMode: GuidedAttackDelivery | undefined, actorEchoKey?: string | null, selectedPickId?: string): GuidedSpecialFocusGroup[];
export declare function getDefensiveActiveBuffChoiceBody(defenseId: DefensePackageId): string;
export declare function buildGuidedBuildSummary(selection: TowerWizardSelection, review: PackageReview): GuidedBuildSummary;
export declare function assembleGuidedOffensePicks(selection: Partial<TowerWizardSelection>): OffenseActivePick[] | undefined;
//# sourceMappingURL=tower-wizard-guided.d.ts.map