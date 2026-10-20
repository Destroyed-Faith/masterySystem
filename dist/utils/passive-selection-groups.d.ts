/**
 * Passive Selection Groups — UI browsing metadata only.
 * Not mechanical categories; slot exclusivity still uses
 * `tower-wizard-passive-categories.ts`.
 */
export type PassiveSelectionGroupId = 'offensive' | 'defensive' | 'utility';
export declare const PASSIVE_SELECTION_GROUP_ORDER: readonly PassiveSelectionGroupId[];
export declare const PASSIVE_SELECTION_GROUP_LABELS: Readonly<Record<PassiveSelectionGroupId, string>>;
/**
 * Canonical Expanded Playtest catalogue (28 Passives).
 * Order within each group matches the approved overview.
 */
export declare const PASSIVE_SELECTION_GROUPS: Readonly<Record<PassiveSelectionGroupId, readonly string[]>>;
/** Flat set of the 28 catalogue templateIds. */
export declare const CANONICAL_PASSIVE_TEMPLATE_IDS: ReadonlySet<string>;
export declare function passiveSelectionGroupFor(templateId: string): PassiveSelectionGroupId | null;
export declare function isCanonicalPassiveTemplateId(templateId: string): boolean;
//# sourceMappingURL=passive-selection-groups.d.ts.map