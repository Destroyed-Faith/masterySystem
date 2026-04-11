/**
 * Minor Expressions (cantrips) — catalog and tier/scaling helpers.
 * Vitality and Wits have no catalog entries; selections are capped by mastery rank and require attribute ≥ 8.
 */
export declare const MINOR_EXPRESSION_MIN_ATTRIBUTE = 8;
export declare const MINOR_EXPRESSION_TIERS: readonly [8, 16, 24, 32, 40];
export type MinorExpressionTier = (typeof MINOR_EXPRESSION_TIERS)[number];
export type MinorExpressionAttribute = 'might' | 'agility' | 'intellect' | 'resolve' | 'influence';
export interface MinorExpressionDefinition {
    id: string;
    attribute: MinorExpressionAttribute;
    name: string;
    tagline: string;
    tiers: Record<MinorExpressionTier, string>;
}
export declare const MINOR_EXPRESSIONS: MinorExpressionDefinition[];
export declare function getMinorExpressionDefinition(id: string): MinorExpressionDefinition | undefined;
export declare function listMinorExpressionsByAttribute(attr: MinorExpressionAttribute): MinorExpressionDefinition[];
export declare function attributeForExpressionId(id: string): MinorExpressionAttribute | undefined;
/** Highest tier threshold not above value; null if value < MIN or unknown. */
export declare function tierThresholdForAttributeValue(value: number): MinorExpressionTier | null;
export declare function tierBodyForExpression(def: MinorExpressionDefinition, attributeValue: number): string;
export declare function sanitizeMinorExpressionIds(ids: string[] | undefined, getAttributeValue: (key: string) => number, masteryRank: number): string[];
export declare const MINOR_EXPRESSION_ATTRIBUTES: MinorExpressionAttribute[];
//# sourceMappingURL=minor-expressions.d.ts.map