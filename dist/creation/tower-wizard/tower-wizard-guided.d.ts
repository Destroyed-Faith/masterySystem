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
export declare function wrapGuidedPassive2Card(templateId: string): SecondPassiveOption | null;
export declare function getGuidedSecondPassiveIntentGroups(passive1TemplateId: string, actorEchoKey?: string | null): SecondPassiveIntentGroup[];
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