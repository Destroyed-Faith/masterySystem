/**
 * Echo Imprints — 28 catalogue entries, tiers 4/8/12/16/20.
 * Replaces Minor Expressions. Selection costs no Stones / XP / charges.
 */
export declare const ECHO_IMPRINT_TIERS: readonly [4, 8, 12, 16, 20];
export type EchoImprintTier = (typeof ECHO_IMPRINT_TIERS)[number];
export type EchoImprintAttribute = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';
export interface EchoImprintDefinition {
    id: string;
    attribute: EchoImprintAttribute;
    name: string;
    tagline: string;
    tiers: Record<EchoImprintTier, string>;
    echoMemory: string;
}
export declare const ECHO_IMPRINTS: readonly EchoImprintDefinition[];
export declare const ECHO_IMPRINT_MIN_ATTRIBUTE = 4;
export declare function echoImprintTierFromAttribute(attributeValue: number): EchoImprintTier;
export declare function findEchoImprint(id: string): EchoImprintDefinition | undefined;
export declare function echoImprintsForAttribute(attribute: EchoImprintAttribute): EchoImprintDefinition[];
export interface EchoImprintSelectionValidation {
    ok: boolean;
    errors: string[];
}
export declare function validateEchoImprintSelections(opts: {
    selectedIds: string[];
    masteryRank: number;
    attributes: Partial<Record<EchoImprintAttribute, number>>;
}): EchoImprintSelectionValidation;
export declare function resolveEchoImprintUse(id: string, attributeValue: number): {
    definition: EchoImprintDefinition;
    tier: EchoImprintTier;
    effect: string;
    echoMemory: string;
} | null;
//# sourceMappingURL=echo-imprints.d.ts.map