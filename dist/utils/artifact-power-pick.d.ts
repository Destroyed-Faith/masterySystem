/**
 * Special-first martial damage picks for the Artifact Node Editor.
 *
 * Delivery form + Special → tier (from Special eligibility) → existing tier template.
 */
import type { ActiveSpecialTier, ArtifactProgressionPick } from '../types/item.js';
export type MartialDelivery = 'melee-single' | 'melee-aoe' | 'ranged-single' | 'ranged-aoe';
/** Matches `active-{melee|ranged}-{damage|aoe-damage}-t{3|4|5|6}`. */
export declare const MARTIAL_DAMAGE_TEMPLATE_RE: RegExp;
export declare const MARTIAL_DELIVERY_OPTIONS: {
    value: MartialDelivery;
    label: string;
}[];
/** Prefix for martial delivery rows in the Active catalog dropdown. */
export declare const MARTIAL_PICK_PREFIX = "martial:";
export declare function martialDeliveryPickId(delivery: MartialDelivery): string;
export declare function isMartialDeliveryPickId(id: string): boolean;
export declare function parseMartialDeliveryPickId(id: string): MartialDelivery | undefined;
/** Martial delivery forms as Active-dropdown entries (delivery + Special picker). */
export declare function martialDeliveryCatalogOptions(): {
    id: string;
    name: string;
}[];
/** Derive damage tier from Special eligibility lists (T3–T6). */
export declare function tierFromSpecialKey(key: string): ActiveSpecialTier | undefined;
export declare function isMartialDamageTemplateId(templateId: string): boolean;
/** Parse delivery + tier from a martial damage template id. */
export declare function parseMartialDamageTemplateId(templateId: string): {
    delivery: MartialDelivery;
    tier: ActiveSpecialTier;
} | undefined;
export declare function templateIdForDeliveryAndTier(delivery: MartialDelivery, tier: ActiveSpecialTier): string;
export declare function resolvePickFromUi(delivery: MartialDelivery, specialKey: string): Pick<ArtifactProgressionPick, 'powerTemplateId' | 'delivery' | 'chosenSpecial'>;
export declare function artifactPowerRowLabel(delivery: MartialDelivery, specialKey: string): string;
export declare function listMartialDamageSpecialOptions(): {
    key: string;
    label: string;
    description: string;
    tier: ActiveSpecialTier;
}[];
/** Reconstruct UI fields from a stored pick (incl. legacy template-only picks). */
export declare function parseLegacyPick(pick: ArtifactProgressionPick): {
    delivery: MartialDelivery | '';
    specialKey: string;
    isLegacyNonMartial: boolean;
    needsSpecial: boolean;
};
//# sourceMappingURL=artifact-power-pick.d.ts.map