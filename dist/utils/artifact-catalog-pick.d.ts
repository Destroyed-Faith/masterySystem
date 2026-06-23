/**
 * Catalog Power picks in the Artifact Node Editor — templates that need a
 * chosen Special (Persistent Zone, Special Auras, etc.).
 */
import type { ActiveSpecialTier } from '../types/item.js';
export interface CatalogSpecialOption {
    key: string;
    label: string;
    description: string;
    tier?: ActiveSpecialTier;
}
/** True when the GM must pick which Special this catalog template applies. */
export declare function catalogTemplateRequiresSpecial(templateId: string): boolean;
/** Eligible Special keys for a catalog template (empty if none required). */
export declare function catalogSpecialKeysForTemplate(templateId: string): string[];
export declare function catalogSpecialTierForTemplate(templateId: string): ActiveSpecialTier | undefined;
export declare function listCatalogSpecialOptions(templateId: string): CatalogSpecialOption[];
export declare function catalogPowerRowLabel(templateName: string, specialKey: string): string;
//# sourceMappingURL=artifact-catalog-pick.d.ts.map