/**
 * Artifact body armor weight classes (Light / Medium / Heavy).
 *
 * Artifact `bodyArmor` base values store the **Artifact Armor Bonus** only;
 * the mundane base (4 / 8 / 12) and class drawbacks come from the selected
 * weight class. Legacy items without `armorWeightClass` infer the class from
 * their label and treat `value` as the full echo total.
 */
import type { ArtifactBaseValue } from '../types/item.js';
export type ArmorWeightClass = 'light' | 'medium' | 'heavy';
export interface ResolvedArtifactBodyArmor {
    weightClass: ArmorWeightClass;
    typeLabel: string;
    baseArmor: number;
    bonusArmor: number;
    totalArmor: number;
    evadeModifier: number;
    initiativeModifier: number;
    skillPenalty: string;
    skillPenaltyDice: number;
}
export interface ArtifactBodyArmorClassPenalty {
    weightClass: ArmorWeightClass;
    typeLabel: string;
    source: string;
    evade: number;
    initiative: number;
    skillPenalty: string;
    skillPenaltyDice: number;
}
/**
 * Resolve one artifact `bodyArmor` base value into total armor + class drawbacks.
 *
 * Evade is **not** taken from the mundane weight-class table anymore: every
 * Artifact Body Armor contributes its Final Evade Modifier via a separate
 * Evade Base Value on slot A. This helper still returns Initiative / Physical
 * Skill drawbacks from the weight class (Medium −4 Init / −1d8, Heavy −8 / −2d8).
 * An explicit `evadeModifier` / `initiativeModifier` on the BV remains an override
 * for legacy printed exceptions.
 */
export declare function resolveArtifactBodyArmor(bv: ArtifactBaseValue, itemSystem?: any): ResolvedArtifactBodyArmor | null;
/**
 * Active body-slot artifact weight-class penalties (equipped / echo-bound).
 * When multiple apply, the heaviest class wins.
 */
export declare function getEquippedArtifactBodyArmorClassPenalty(actor: any): ArtifactBodyArmorClassPenalty | null;
/** Display label for a resolved body-armor row (sheet / print). */
export declare function formatArtifactBodyArmorDetail(resolved: ResolvedArtifactBodyArmor): string;
//# sourceMappingURL=artifact-armor-weight.d.ts.map