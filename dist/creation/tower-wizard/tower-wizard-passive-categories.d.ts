/**
 * Mechanical Passive categories for Combat Package Wizard — Passive 2 legality.
 *
 * Combined passives occupy every listed category. Passive 2 must not share
 * any category with Passive 1.
 */
export type SecondPassiveBucket = 'armor' | 'evade' | 'parry' | 'damage-reduction' | 'damage-negation' | 'phasing' | 'invisibility' | 'health' | 'temporary-hp' | 'sustain' | 'offense' | 'advanced';
export declare function normalizePassiveCategory(category: string): string;
export declare function inferPassiveCategoriesFromTemplateId(templateId: string): string[];
export declare function getPassiveMechanicalCategories(templateId: string): string[];
export declare function getNormalizedPassiveCategories(templateId: string): string[];
export declare function formatPassiveCategoryLabel(category: string): string;
export declare function formatPassiveCategoryList(templateId: string): string;
export declare function passivesAreCategoryCompatible(passive1TemplateId: string, passive2TemplateId: string): boolean;
export declare function isAllowedSecondPassive(passive2TemplateId: string, passive1TemplateId: string, actorEchoKey?: string | null): boolean;
export declare function getPassiveCategoryConflictMessage(passive1TemplateId: string, passive2TemplateId: string): string | null;
export declare function secondPassiveBucketFor(templateId: string): SecondPassiveBucket;
export declare function secondPassiveCardWarning(_templateId: string): string | undefined;
//# sourceMappingURL=tower-wizard-passive-categories.d.ts.map